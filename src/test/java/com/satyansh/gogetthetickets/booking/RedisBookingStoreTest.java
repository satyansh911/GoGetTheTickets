package com.satyansh.gogetthetickets.booking;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.StringRedisTemplate;

import com.satyansh.gogetthetickets.TestcontainersConfiguration;

/** Runs against a real Redis started in Docker by Testcontainers. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class RedisBookingStoreTest {

	private static final Duration SHORT_TTL = Duration.ofMillis(300);

	@Autowired
	private BookingService service;

	@Autowired
	private RedisBookingStore store;

	@Autowired
	private StringRedisTemplate redis;

	@BeforeEach
	void flushRedis() {
		redis.execute(connection -> {
			connection.serverCommands().flushDb();
			return null;
		}, true);
	}

	/** The property the whole design exists to guarantee. */
	@Test
	void concurrentHoldsOnOneSeatExactlyOneWins() throws Exception {
		int attempts = 1_000;
		AtomicInteger successes = new AtomicInteger();
		AtomicInteger rejections = new AtomicInteger();
		CountDownLatch startGate = new CountDownLatch(1);

		try (ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor()) {
			List<Future<?>> futures = new ArrayList<>();
			for (int i = 0; i < attempts; i++) {
				futures.add(pool.submit(() -> {
					startGate.await(); // release every thread at once to maximise contention
					try {
						service.hold("inception", "A1", UUID.randomUUID().toString());
						successes.incrementAndGet();
					} catch (SeatUnavailableException e) {
						rejections.incrementAndGet();
					}
					return null;
				}));
			}
			startGate.countDown();
			for (Future<?> f : futures) {
				f.get();
			}
		}

		assertThat(successes.get()).isEqualTo(1);
		assertThat(rejections.get()).isEqualTo(attempts - 1);
	}

	@Test
	void expiredHoldFreesTheSeat() throws Exception {
		assertThat(store.hold(booking("alice"), SHORT_TTL)).isTrue();
		assertThat(store.hold(booking("bob"), SHORT_TTL)).isFalse();

		Thread.sleep(SHORT_TTL.multipliedBy(2));

		assertThat(store.hold(booking("bob"), SHORT_TTL)).isTrue();
	}

	@Test
	void confirmedBookingNeverExpires() throws Exception {
		Booking held = booking("alice");
		store.hold(held, SHORT_TTL);
		assertThat(store.confirm(held.confirmed())).isTrue();

		Thread.sleep(SHORT_TTL.multipliedBy(2));

		assertThat(store.findBySessionId(held.sessionId()))
				.hasValueSatisfying(b -> assertThat(b.status()).isEqualTo(BookingStatus.CONFIRMED));
		assertThat(store.hold(booking("bob"), SHORT_TTL)).isFalse();
	}

	/**
	 * Alice's hold lapses and Bob takes the seat. Alice's late confirm must fail rather than
	 * overwrite Bob's hold.
	 */
	@Test
	void lateConfirmCannotStealASeatReHeldBySomeoneElse() throws Exception {
		Booking alice = booking("alice");
		store.hold(alice, SHORT_TTL);
		Thread.sleep(SHORT_TTL.multipliedBy(2));
		Booking bob = booking("bob");
		store.hold(bob, Duration.ofMinutes(1));

		assertThat(store.confirm(alice.confirmed())).isFalse();
		assertThat(store.findByMovie("inception", List.of("A1")))
				.singleElement()
				.satisfies(b -> assertThat(b.userId()).isEqualTo("bob"));
	}

	@Test
	void confirmedBookingCannotBeReleased() {
		Booking held = booking("alice");
		store.hold(held, SHORT_TTL);
		store.confirm(held.confirmed());

		assertThat(store.release(held)).isFalse();
		assertThat(store.findByMovie("inception", List.of("A1"))).hasSize(1);
	}

	@Test
	void releaseFreesTheSeat() {
		Booking held = booking("alice");
		store.hold(held, Duration.ofMinutes(1));

		assertThat(store.release(held)).isTrue();
		assertThat(store.findBySessionId(held.sessionId())).isEmpty();
		assertThat(store.hold(booking("bob"), Duration.ofMinutes(1))).isTrue();
	}

	@Test
	void findByMovieReturnsOnlyThatMoviesSeats() {
		service.hold("inception", "A1", "alice");
		service.hold("inception", "B3", "bob");
		service.hold("dune", "A1", "carol");

		assertThat(service.listBookings("inception"))
				.extracting(Booking::seatId)
				.containsExactlyInAnyOrder("A1", "B3");
	}

	private static Booking booking(String userId) {
		return new Booking(UUID.randomUUID().toString(), "inception", "A1", userId, BookingStatus.HELD,
				Instant.now().plus(SHORT_TTL));
	}

}
