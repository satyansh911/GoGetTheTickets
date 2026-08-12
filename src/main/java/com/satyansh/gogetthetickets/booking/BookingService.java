package com.satyansh.gogetthetickets.booking;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.satyansh.gogetthetickets.booking.dto.BookingResponse;
import com.satyansh.gogetthetickets.booking.dto.ItemsRequest;
import com.satyansh.gogetthetickets.booking.dto.PaymentRequest;
import com.satyansh.gogetthetickets.catalog.FoodItem;
import com.satyansh.gogetthetickets.catalog.FoodItemRepository;
import com.satyansh.gogetthetickets.common.AppTime;
import com.satyansh.gogetthetickets.common.FieldValidationException;
import com.satyansh.gogetthetickets.common.NotFoundException;
import com.satyansh.gogetthetickets.common.RequestRejectedException;
import com.satyansh.gogetthetickets.show.DemoOccupancy;
import com.satyansh.gogetthetickets.show.SeatLayout;
import com.satyansh.gogetthetickets.show.Show;
import com.satyansh.gogetthetickets.show.ShowRepository;

/**
 * The booking lifecycle: hold seats, add food and coupons, pay, cancel.
 *
 * Two layers stop double-selling. Redis holds (see {@link SeatHoldStore}) keep two people
 * from checking out the same seat at once. On payment, sold seats are inserted into
 * booked_seats, whose (show, seat) primary key makes a double sale impossible even if Redis
 * lost a hold.
 */
@Service
public class BookingService {

	private static final Duration PAYMENT_WINDOW = Duration.ofMinutes(2);
	private static final Pattern UPI_ID = Pattern.compile("^[\\w.\\-]{2,}@[a-zA-Z]{2,}$");
	private static final Pattern CARD_EXPIRY = Pattern.compile("^(0[1-9]|1[0-2])/\\d{2}$");

	public record PaymentOutcome(BookingResponse booking, boolean succeeded, String failureCode) {
	}

	private final BookingRepository bookings;
	private final ShowRepository shows;
	private final BookedSeatRepository bookedSeats;
	private final SeatHoldStore holds;
	private final DemoOccupancy demo;
	private final FoodItemRepository food;
	private final CouponRepository coupons;
	private final PaymentRepository payments;
	private final PaymentGateway gateway;
	private final BookingMapper mapper;
	private final Clock clock;
	private final Duration holdTtl;

	public BookingService(BookingRepository bookings, ShowRepository shows, BookedSeatRepository bookedSeats,
			SeatHoldStore holds, DemoOccupancy demo, FoodItemRepository food, CouponRepository coupons,
			PaymentRepository payments, PaymentGateway gateway, BookingMapper mapper, Clock clock,
			@Value("${booking.hold-ttl}") Duration holdTtl) {
		this.bookings = bookings;
		this.shows = shows;
		this.bookedSeats = bookedSeats;
		this.holds = holds;
		this.demo = demo;
		this.food = food;
		this.coupons = coupons;
		this.payments = payments;
		this.gateway = gateway;
		this.mapper = mapper;
		this.clock = clock;
		this.holdTtl = holdTtl;
	}

	/** Holds all requested seats for {@code booking.hold-ttl}, or none of them. */
	@Transactional
	public BookingResponse hold(long userId, long showId, List<String> requestedSeatIds) {
		Show show = shows.findWithDetailsById(showId).orElseThrow(() -> new NotFoundException("Show"));
		Instant now = clock.instant();
		if (!show.getStartsAt().isAfter(now)) {
			throw new RequestRejectedException(HttpStatus.CONFLICT, "SHOW_STARTED",
					"This show has already started. Pick a later showtime.");
		}

		List<String> seatIds = requestedSeatIds.stream().map(s -> s.trim().toUpperCase(Locale.ROOT)).distinct().toList();
		List<BookingSeat> seats = new ArrayList<>();
		for (String seatId : seatIds) {
			SeatLayout.Seat seat = SeatLayout.seat(seatId).orElseThrow(() -> new RequestRejectedException(
					HttpStatus.BAD_REQUEST, "INVALID_SEAT", "Seat " + seatId + " doesn't exist in this screen"));
			seats.add(new BookingSeat(seat.id(), seat.tier().name(), seat.tier().price()));
		}
		List<String> walkInSold = seatIds.stream().filter(id -> demo.isSold(showId, id)).toList();
		if (!walkInSold.isEmpty()) {
			throw new SeatsUnavailableException(walkInSold);
		}

		// Picking seats again replaces the user's earlier hold on this show.
		for (Booking previous : bookings.findByUserIdAndShowIdAndStatus(userId, showId, BookingStatus.HELD)) {
			previous.release();
			holds.release(showId, previous.seatIds(), previous.getId());
		}

		String bookingId = BookingCodes.next();
		List<String> taken = holds.hold(showId, seatIds, bookingId, holdTtl);
		if (!taken.isEmpty()) {
			throw new SeatsUnavailableException(taken);
		}
		releaseHoldIfRolledBack(showId, seatIds, bookingId);

		// Lock first, then check what's sold. A confirm writes booked_seats before it deletes
		// its Redis keys, so once our hold succeeded, any sale of these seats is visible here.
		List<String> sold = bookedSeats.findSeatIdsAmong(showId, seatIds);
		if (!sold.isEmpty()) {
			throw new SeatsUnavailableException(sold);
		}

		Booking booking = Booking.hold(bookingId, userId, show, seats, now, now.plus(holdTtl));
		booking.applyPrice(Pricing.quote(booking.getSeats(), booking.getItems(), null), null);
		bookings.save(booking);
		return mapper.toResponse(booking, null);
	}

	@Transactional(readOnly = true)
	public BookingResponse get(long userId, String bookingId) {
		return mapper.toResponse(findOwned(userId, bookingId), null);
	}

	/** Gives the seats back (the user went back to change seats or showtime). Safe to repeat. */
	@Transactional
	public void releaseHold(long userId, String bookingId) {
		Booking booking = findOwned(userId, bookingId);
		if (booking.getStatus() == BookingStatus.HELD) {
			booking.release();
			long showId = booking.getShow().getId();
			List<String> seatIds = booking.seatIds();
			afterCommit(() -> holds.release(showId, seatIds, bookingId));
		}
	}

	@Transactional
	public BookingResponse updateItems(long userId, String bookingId, List<ItemsRequest.Item> requested) {
		Booking booking = findOwned(userId, bookingId);
		requireActiveHold(booking);

		Map<String, FoodItem> menu = food.findAllById(requested.stream().map(ItemsRequest.Item::id).toList()).stream()
				.collect(Collectors.toMap(FoodItem::getId, Function.identity()));
		Map<String, BookingItem> lines = new LinkedHashMap<>();
		for (ItemsRequest.Item item : requested) {
			if (item.qty() == 0) {
				continue;
			}
			FoodItem f = Optional.ofNullable(menu.get(item.id())).orElseThrow(() -> new RequestRejectedException(
					HttpStatus.BAD_REQUEST, "UNKNOWN_ITEM", "That item isn't on the menu"));
			lines.put(f.getId(), new BookingItem(f.getId(), f.getName(), f.getPrice(), item.qty()));
		}
		booking.replaceItems(List.copyOf(lines.values()));

		// A change of order can invalidate the coupon (e.g. POPCORN50 with no food left).
		Coupon coupon = currentCoupon(booking);
		String notice = coupon == null ? null : couponProblem(coupon, userId, booking);
		if (notice != null) {
			coupon = null;
		}
		booking.applyPrice(Pricing.quote(booking.getSeats(), booking.getItems(), coupon), coupon == null ? null : coupon.getCode());
		return mapper.toResponse(booking, notice);
	}

	@Transactional
	public BookingResponse applyCoupon(long userId, String bookingId, String rawCode) {
		Booking booking = findOwned(userId, bookingId);
		requireActiveHold(booking);
		String code = rawCode.trim().toUpperCase(Locale.ROOT);
		Coupon coupon = coupons.findByCodeAndActiveTrue(code).orElseThrow(() -> new RequestRejectedException(
				HttpStatus.UNPROCESSABLE_CONTENT, "COUPON_INVALID", "“" + code + "” isn't a valid code for this show"));
		String problem = couponProblem(coupon, userId, booking);
		if (problem != null) {
			throw new RequestRejectedException(HttpStatus.UNPROCESSABLE_CONTENT, "COUPON_NOT_APPLICABLE", problem);
		}
		booking.applyPrice(Pricing.quote(booking.getSeats(), booking.getItems(), coupon), coupon.getCode());
		return mapper.toResponse(booking, null);
	}

	@Transactional
	public BookingResponse removeCoupon(long userId, String bookingId) {
		Booking booking = findOwned(userId, bookingId);
		requireActiveHold(booking);
		booking.applyPrice(Pricing.quote(booking.getSeats(), booking.getItems(), null), null);
		return mapper.toResponse(booking, null);
	}

	/**
	 * Charges the booking and, on success, turns the hold into sold seats.
	 *
	 * Idempotent per {@code idempotencyKey}: a retry with the same key (double click, network
	 * retry) gets the first attempt's outcome instead of a second charge. A failed payment
	 * leaves the seats held, so the user can retry with a new key.
	 */
	@Transactional
	public PaymentOutcome pay(long userId, String bookingId, String idempotencyKey, PaymentRequest request) {
		Optional<Payment> earlier = payments.findByIdempotencyKey(idempotencyKey);
		if (earlier.isPresent()) {
			Payment p = earlier.get();
			if (!p.getBookingId().equals(bookingId)) {
				throw new RequestRejectedException(HttpStatus.CONFLICT, "IDEMPOTENCY_KEY_REUSED",
						"This payment key was already used for another booking");
			}
			return new PaymentOutcome(mapper.toResponse(findOwned(userId, bookingId), null),
					p.getStatus() == Payment.Status.SUCCEEDED, p.getFailureCode());
		}

		Booking booking = findOwned(userId, bookingId);
		if (booking.getStatus() == BookingStatus.CONFIRMED) {
			return new PaymentOutcome(mapper.toResponse(booking, null), true, null);
		}
		validatePaymentDetails(request);
		requireActiveHold(booking);

		long showId = booking.getShow().getId();
		List<String> seatIds = booking.seatIds();
		if (!holds.verifyAndExtend(showId, seatIds, bookingId, PAYMENT_WINDOW)) {
			throw holdExpired();
		}

		String method = request.method().toUpperCase(Locale.ROOT);
		PaymentGateway.Result result = gateway.charge(new PaymentGateway.Charge(bookingId, booking.getTotal(), method,
				request.upiId(), "FAIL".equalsIgnoreCase(request.simulate())));
		Instant now = clock.instant();
		payments.save(new Payment(bookingId, idempotencyKey, method,
				result.succeeded() ? Payment.Status.SUCCEEDED : Payment.Status.FAILED, booking.getTotal(),
				result.failureCode(), now));
		if (!result.succeeded()) {
			return new PaymentOutcome(mapper.toResponse(booking, null), false, result.failureCode());
		}

		for (String seatId : seatIds) {
			bookedSeats.insert(showId, seatId, bookingId);
		}
		booking.confirm(now, request.email().trim());
		// The seats are now in booked_seats; drop the Redis hold only once that is committed.
		afterCommit(() -> holds.release(showId, seatIds, bookingId));
		return new PaymentOutcome(mapper.toResponse(booking, null), true, null);
	}

	@Transactional
	public BookingResponse cancel(long userId, String bookingId) {
		Booking booking = findOwned(userId, bookingId);
		if (booking.getStatus() != BookingStatus.CONFIRMED) {
			throw new RequestRejectedException(HttpStatus.CONFLICT, "NOT_CANCELLABLE", "Only confirmed bookings can be cancelled");
		}
		Instant now = clock.instant();
		if (!booking.getShow().getStartsAt().minus(BookingMapper.CANCEL_CUTOFF).isAfter(now)) {
			throw new RequestRejectedException(HttpStatus.CONFLICT, "CANCELLATION_CLOSED",
					"Cancellations close 2 hours before the show");
		}
		booking.cancel(now);
		bookedSeats.deleteByBooking(bookingId);
		return mapper.toResponse(booking, null);
	}

	/** Confirmed and cancelled bookings. Upcoming soonest first; past most recent first. */
	@Transactional(readOnly = true)
	public List<BookingResponse> list(long userId, boolean upcoming) {
		LocalDate today = AppTime.today(clock);
		Comparator<Booking> byStart = Comparator.comparing(b -> b.getShow().getStartsAt());
		return bookings.findByUserIdAndStatusIn(userId, List.of(BookingStatus.CONFIRMED, BookingStatus.CANCELLED)).stream()
				.filter(b -> upcoming == !b.getShow().getShowDate().isBefore(today))
				.sorted(upcoming ? byStart : byStart.reversed())
				.map(b -> mapper.toResponse(b, null))
				.toList();
	}

	private Booking findOwned(long userId, String bookingId) {
		// Someone else's booking is reported as missing, not forbidden, so IDs can't be probed.
		return bookings.findWithShowById(bookingId)
				.filter(b -> b.getUserId().equals(userId))
				.orElseThrow(() -> new NotFoundException("Booking"));
	}

	private void requireActiveHold(Booking booking) {
		if (!booking.isActiveHold(clock.instant())) {
			throw holdExpired();
		}
	}

	private static RequestRejectedException holdExpired() {
		return new RequestRejectedException(HttpStatus.GONE, "HOLD_EXPIRED", "Your hold expired. Pick your seats again.");
	}

	private Coupon currentCoupon(Booking booking) {
		return booking.getCouponCode() == null ? null : coupons.findById(booking.getCouponCode()).orElse(null);
	}

	/** Why a coupon can't be used on this booking, or null if it can. */
	private String couponProblem(Coupon coupon, long userId, Booking booking) {
		if (coupon.isFirstBookingOnly() && bookings.countByUserIdAndStatus(userId, BookingStatus.CONFIRMED) > 0) {
			return coupon.getCode() + " is only for your first booking";
		}
		if (coupon.getKind() == Coupon.Kind.FNB_FLAT && booking.getItems().isEmpty()) {
			return "Add a food or beverage item to use " + coupon.getCode();
		}
		Pricing.Quote quote = Pricing.quote(booking.getSeats(), booking.getItems(), null);
		if (Pricing.discount(coupon, quote.tickets(), quote.fnb()).signum() == 0) {
			return coupon.getCode() + " doesn't apply to this order";
		}
		return null;
	}

	private static void validatePaymentDetails(PaymentRequest request) {
		Map<String, String> errors = new LinkedHashMap<>();
		switch (request.method().toUpperCase(Locale.ROOT)) {
			case "UPI" -> {
				String upi = request.upiId() == null ? "" : request.upiId().trim();
				if (upi.isEmpty()) {
					errors.put("upiId", "Enter your UPI ID");
				}
				else if (!UPI_ID.matcher(upi).matches()) {
					errors.put("upiId", "That UPI ID looks incomplete — try name@bank");
				}
			}
			case "CARD" -> {
				PaymentRequest.Card card = request.card();
				String number = card == null || card.number() == null ? "" : card.number().replaceAll("\\s", "");
				if (!number.matches("\\d{16}")) {
					errors.put("card.number", "Card number must be 16 digits");
				}
				if (card == null || card.expiry() == null || !CARD_EXPIRY.matcher(card.expiry().trim()).matches()) {
					errors.put("card.expiry", "Use MM/YY");
				}
				if (card == null || card.cvv() == null || !card.cvv().matches("\\d{3}")) {
					errors.put("card.cvv", "3 digits");
				}
			}
			default -> {
				if (request.bank() == null || request.bank().isBlank()) {
					errors.put("bank", "Choose your bank");
				}
			}
		}
		if (!errors.isEmpty()) {
			throw new FieldValidationException(errors);
		}
	}

	/** If the transaction doesn't commit, give the Redis hold back instead of waiting for its TTL. */
	private void releaseHoldIfRolledBack(long showId, Collection<String> seatIds, String bookingId) {
		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCompletion(int status) {
				if (status != STATUS_COMMITTED) {
					holds.release(showId, seatIds, bookingId);
				}
			}
		});
	}

	private static void afterCommit(Runnable action) {
		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				action.run();
			}
		});
	}

}
