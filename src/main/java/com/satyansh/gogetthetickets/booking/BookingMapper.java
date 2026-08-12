package com.satyansh.gogetthetickets.booking;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Component;

import com.satyansh.gogetthetickets.booking.dto.BookingResponse;
import com.satyansh.gogetthetickets.booking.dto.BookingResponse.ItemLine;
import com.satyansh.gogetthetickets.booking.dto.BookingResponse.SeatLine;
import com.satyansh.gogetthetickets.catalog.dto.MovieResponse;
import com.satyansh.gogetthetickets.show.SeatLayout;
import com.satyansh.gogetthetickets.show.Show;

@Component
class BookingMapper {

	static final Duration CANCEL_CUTOFF = Duration.ofHours(2);
	private static final List<String> SEAT_ORDER = SeatLayout.seatIds();

	private final CouponRepository coupons;
	private final Clock clock;

	BookingMapper(CouponRepository coupons, Clock clock) {
		this.coupons = coupons;
		this.clock = clock;
	}

	BookingResponse toResponse(Booking b, String couponNotice) {
		Instant now = clock.instant();
		Show show = b.getShow();
		BookingStatus status = b.effectiveStatus(now);

		List<SeatLine> seats = b.getSeats().stream()
				.sorted(Comparator.comparingInt(s -> SEAT_ORDER.indexOf(s.getSeatId())))
				.map(s -> {
					SeatLayout.Seat seat = SeatLayout.seat(s.getSeatId()).orElseThrow();
					return new SeatLine(s.getSeatId(), seat.row(), seat.number(), s.getTier(), s.getPrice());
				})
				.toList();
		List<ItemLine> items = b.getItems().stream()
				.sorted(Comparator.comparing(BookingItem::getName))
				.map(i -> new ItemLine(i.getFoodItemId(), i.getName(), i.getPrice(), i.getQty()))
				.toList();
		String couponLabel = b.getCouponCode() == null ? null
				: coupons.findById(b.getCouponCode()).map(Coupon::getLabel).orElse(null);
		boolean cancellable = status == BookingStatus.CONFIRMED && show.getStartsAt().minus(CANCEL_CUTOFF).isAfter(now);

		return new BookingResponse(b.getId(), status.name(), show.getId(), MovieResponse.summary(show.getMovie()),
				show.getCinema().getName(), show.getCinema().getArea(), show.getCinema().getCityId(), show.getScreen(),
				show.getShowDate(), show.getLocalStartTime().toString(), show.getStartsAt(), show.getLanguage(),
				show.getFormat(), seats, items, b.getTicketsAmount(), b.getFnbAmount(),
				b.getTicketsAmount().add(b.getFnbAmount()), b.getConvenienceFee(), b.getGst(), b.getDiscount(),
				b.getTotal(), b.getCouponCode(), couponLabel, couponNotice,
				status == BookingStatus.HELD ? b.getHoldExpiresAt() : null, b.getEmail(), "ggt://ticket/" + b.getId(),
				b.refundAmount(), cancellable, b.getCreatedAt());
	}

}
