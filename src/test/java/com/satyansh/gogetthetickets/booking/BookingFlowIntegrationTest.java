package com.satyansh.gogetthetickets.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import com.satyansh.gogetthetickets.MutableClock;
import com.satyansh.gogetthetickets.TestcontainersConfiguration;
import com.satyansh.gogetthetickets.auth.User;
import com.satyansh.gogetthetickets.auth.UserRepository;
import com.satyansh.gogetthetickets.booking.SeatInventory.SeatStatus;
import com.satyansh.gogetthetickets.booking.dto.BookingResponse;
import com.satyansh.gogetthetickets.booking.dto.PaymentRequest;
import com.satyansh.gogetthetickets.common.ApiException;
import com.satyansh.gogetthetickets.show.SeatLayout;

/**
 * The booking rules against real Postgres and Redis (Testcontainers). Each test uses a
 * different upcoming show, so tests don't share seats. Simulated walk-in sales are off, so
 * every seat starts free.
 */
@SpringBootTest(properties = "booking.demo-occupancy=false")
@Import({ TestcontainersConfiguration.class, BookingFlowIntegrationTest.Config.class })
class BookingFlowIntegrationTest {

	@TestConfiguration(proxyBeanMethods = false)
	static class Config {

		@Bean
		@Primary
		MutableClock testClock() {
			return new MutableClock();
		}

	}

	@Autowired
	private BookingService bookings;

	@Autowired
	private SeatInventory inventory;

	@Autowired
	private SeatHoldStore holdStore;

	@Autowired
	private HoldExpiryJob expiryJob;

	@Autowired
	private BookingRepository bookingRepository;

	@Autowired
	private BookedSeatRepository bookedSeats;

	@Autowired
	private UserRepository users;

	@Autowired
	private JdbcTemplate jdbc;

	@Autowired
	private StringRedisTemplate redis;

	@Autowired
	private TransactionTemplate tx;

	@Autowired
	private MutableClock clock;

	private long showId;

	@BeforeEach
	void pickFreshShow() {
		clock.reset();
		showId = jdbc.queryForObject("""
				select s.id from shows s
				where s.starts_at > now() + interval '4 hours'
				  and not exists (select 1 from bookings b where b.show_id = s.id)
				order by random() limit 1""", Long.class);
	}

	/** The property the design exists for: many people, one pair of seats, one winner. */
	@Test
	void concurrentHoldsOnTheSameSeatsExactlyOneWins() throws Exception {
		List<Long> racers = newUsers(200);
		ConcurrentLinkedQueue<String> winners = new ConcurrentLinkedQueue<>();
		AtomicInteger rejected = new AtomicInteger();

		race(racers, userId -> {
			try {
				winners.add(bookings.hold(userId, showId, List.of("C7", "C8")).bookingId());
			}
			catch (SeatsUnavailableException e) {
				rejected.incrementAndGet();
			}
		});

		assertThat(winners).hasSize(1);
		assertThat(rejected.get()).isEqualTo(racers.size() - 1);
		assertThat(holdStore.holders(showId, List.of("C7", "C8"))).containsOnly(
				Map.entry("C7", winners.peek()), Map.entry("C8", winners.peek()));
	}

	/**
	 * Half the racers want B5+B6, half want B6+B7. Both sets include B6, so exactly one
	 * request can succeed, and a loser must not be left holding its other seat.
	 */
	@Test
	void overlappingRequestsAreAllOrNothing() throws Exception {
		List<Long> racers = newUsers(100);
		ConcurrentLinkedQueue<BookingResponse> winners = new ConcurrentLinkedQueue<>();

		race(racers, userId -> {
			List<String> wanted = userId % 2 == 0 ? List.of("B5", "B6") : List.of("B6", "B7");
			try {
				winners.add(bookings.hold(userId, showId, wanted));
			}
			catch (SeatsUnavailableException ignored) {
			}
		});

		assertThat(winners).hasSize(1);
		List<String> won = winners.peek().seats().stream().map(BookingResponse.SeatLine::id).toList();
		String loserOnlySeat = won.contains("B5") ? "B7" : "B5";
		assertThat(inventory.statuses(showId, null).get(loserOnlySeat)).isEqualTo(SeatStatus.AVAILABLE);
	}

	@Test
	void holdFailsAsAWholeAndNamesTheTakenSeat() {
		long bob = newUser();
		long alice = newUser();
		bookings.hold(bob, showId, List.of("A2"));

		assertThatThrownBy(() -> bookings.hold(alice, showId, List.of("A1", "A2", "A3")))
				.isInstanceOfSatisfying(SeatsUnavailableException.class,
						e -> assertThat(e.details()).isEqualTo(Map.of("seats", List.of("A2"))));

		Map<String, SeatStatus> seats = inventory.statuses(showId, null);
		assertThat(seats.get("A1")).isEqualTo(SeatStatus.AVAILABLE);
		assertThat(seats.get("A3")).isEqualTo(SeatStatus.AVAILABLE);
	}

	@Test
	void holdersSeeTheirOwnSeatsAsFreeAndEveryoneElseSeesThemHeld() {
		long alice = newUser();
		bookings.hold(alice, showId, List.of("F4"));

		assertThat(inventory.statuses(showId, alice).get("F4")).isEqualTo(SeatStatus.AVAILABLE);
		assertThat(inventory.statuses(showId, newUser()).get("F4")).isEqualTo(SeatStatus.HELD);
	}

	@Test
	void pickingSeatsAgainReplacesTheEarlierHold() {
		long alice = newUser();
		BookingResponse first = bookings.hold(alice, showId, List.of("E1", "E2"));
		bookings.hold(alice, showId, List.of("E5", "E6"));

		assertThat(bookingRepository.findById(first.bookingId())).get().extracting(Booking::getStatus).isEqualTo(BookingStatus.RELEASED);
		assertThat(inventory.statuses(showId, null).get("E1")).isEqualTo(SeatStatus.AVAILABLE);
		assertThat(inventory.statuses(showId, null).get("E5")).isEqualTo(SeatStatus.HELD);
	}

	@Test
	void paymentConfirmsTheBookingAndIsIdempotent() {
		long alice = newUser();
		String id = bookings.hold(alice, showId, List.of("G1", "G2")).bookingId();

		BookingService.PaymentOutcome first = bookings.pay(alice, id, "key-" + id, upi("alice@okbank"));
		BookingService.PaymentOutcome replay = bookings.pay(alice, id, "key-" + id, upi("alice@okbank"));

		assertThat(first.succeeded()).isTrue();
		assertThat(first.booking().status()).isEqualTo("CONFIRMED");
		assertThat(replay.succeeded()).isTrue();
		assertThat(jdbc.queryForObject("select count(*) from payments where booking_id = ?", Integer.class, id)).isEqualTo(1);
		assertThat(bookedSeats.findSeatIds(showId)).containsExactlyInAnyOrder("G1", "G2");
		assertThat(holdStore.holders(showId, List.of("G1", "G2"))).isEmpty();
	}

	@Test
	void declinedPaymentKeepsTheSeatsHeldForARetry() {
		long alice = newUser();
		String id = bookings.hold(alice, showId, List.of("H9")).bookingId();

		BookingService.PaymentOutcome declined = bookings.pay(alice, id, UUID.randomUUID().toString(), upi("alice-fail@okbank"));
		assertThat(declined.succeeded()).isFalse();
		assertThat(declined.booking().status()).isEqualTo("HELD");
		assertThat(inventory.statuses(showId, null).get("H9")).isEqualTo(SeatStatus.HELD);

		BookingService.PaymentOutcome retry = bookings.pay(alice, id, UUID.randomUUID().toString(), upi("alice@okbank"));
		assertThat(retry.succeeded()).isTrue();
	}

	@Test
	void anExpiredHoldCannotBePaidAndIsMarkedExpired() {
		long alice = newUser();
		String id = bookings.hold(alice, showId, List.of("J3")).bookingId();

		clock.advance(Duration.ofMinutes(11));

		assertThatThrownBy(() -> bookings.pay(alice, id, UUID.randomUUID().toString(), upi("alice@okbank")))
				.isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.code()).isEqualTo("HOLD_EXPIRED"));
		expiryJob.expireLapsedHolds();
		assertThat(bookingRepository.findById(id)).get().extracting(Booking::getStatus).isEqualTo(BookingStatus.EXPIRED);
	}

	/**
	 * Redis is the fast path, not the source of truth. If a hold vanishes (eviction, restart)
	 * and someone else buys the seat, the original holder's payment is refused, and the
	 * database key rejects a second sale outright.
	 */
	@Test
	void aLostRedisHoldStillCannotCauseADoubleSale() {
		long alice = newUser();
		long bob = newUser();
		String alicesBooking = bookings.hold(alice, showId, List.of("D5")).bookingId();
		redis.delete("hold:{" + showId + "}:D5");

		String bobsBooking = bookings.hold(bob, showId, List.of("D5")).bookingId();
		assertThat(bookings.pay(bob, bobsBooking, UUID.randomUUID().toString(), upi("bob@okbank")).succeeded()).isTrue();

		assertThatThrownBy(() -> bookings.pay(alice, alicesBooking, UUID.randomUUID().toString(), upi("alice@okbank")))
				.isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.code()).isEqualTo("HOLD_EXPIRED"));
		assertThatThrownBy(() -> tx.executeWithoutResult(s -> bookedSeats.insert(showId, "D5", alicesBooking)))
				.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void cancellingFreesTheSeatsUntilTwoHoursBeforeTheShow() {
		long alice = newUser();
		String id = bookings.hold(alice, showId, List.of("K1")).bookingId();
		bookings.pay(alice, id, UUID.randomUUID().toString(), upi("alice@okbank"));

		BookingResponse cancelled = bookings.cancel(alice, id);
		assertThat(cancelled.status()).isEqualTo("CANCELLED");
		assertThat(cancelled.refundAmount()).isEqualByComparingTo("450");
		assertThat(inventory.statuses(showId, null).get("K1")).isEqualTo(SeatStatus.AVAILABLE);

		String second = bookings.hold(alice, showId, List.of("K2")).bookingId();
		bookings.pay(alice, second, UUID.randomUUID().toString(), upi("alice@okbank"));
		Instant startsAt = jdbc.queryForObject("select starts_at from shows where id = ?", java.sql.Timestamp.class, showId).toInstant();
		clock.advance(Duration.between(clock.instant(), startsAt.minus(Duration.ofMinutes(90))));

		assertThatThrownBy(() -> bookings.cancel(alice, second))
				.isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.code()).isEqualTo("CANCELLATION_CLOSED"));
	}

	@Test
	void someoneElsesBookingLooksLikeItDoesNotExist() {
		long alice = newUser();
		String id = bookings.hold(alice, showId, List.of("A9")).bookingId();

		assertThatThrownBy(() -> bookings.get(newUser(), id))
				.isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.code()).isEqualTo("NOT_FOUND"));
	}

	@Test
	void theScheduleNeverDoubleBooksAScreen() {
		Integer overlaps = jdbc.queryForObject("""
				select count(*) from shows a
				join shows b on b.cinema_id = a.cinema_id and b.screen = a.screen and b.starts_at > a.starts_at
				join movies m on m.id = a.movie_id
				where b.starts_at < a.starts_at + make_interval(mins => m.runtime_minutes)""", Integer.class);
		assertThat(overlaps).isZero();
		assertThat(SeatLayout.capacity()).isEqualTo(168);
	}

	private PaymentRequest upi(String upiId) {
		return new PaymentRequest("UPI", "fan@example.com", upiId, null, null, null);
	}

	private long newUser() {
		return users.save(new User("Test", UUID.randomUUID() + "@example.com", "x", Instant.now())).getId();
	}

	private List<Long> newUsers(int n) {
		List<Long> ids = new ArrayList<>();
		for (int i = 0; i < n; i++) {
			ids.add(newUser());
		}
		return ids;
	}

	/** Runs one task per user on virtual threads, all released at the same instant. */
	private static void race(List<Long> userIds, java.util.function.LongConsumer task) throws Exception {
		CountDownLatch start = new CountDownLatch(1);
		try (ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor()) {
			List<Future<?>> futures = new ArrayList<>();
			for (long userId : userIds) {
				futures.add(pool.submit(() -> {
					start.await();
					task.accept(userId);
					return null;
				}));
			}
			start.countDown();
			for (Future<?> f : futures) {
				f.get();
			}
		}
	}

}
