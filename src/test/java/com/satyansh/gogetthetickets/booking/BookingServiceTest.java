package com.satyansh.gogetthetickets.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.satyansh.gogetthetickets.movie.MovieCatalog;
import com.satyansh.gogetthetickets.movie.MovieNotFoundException;

/** Business rules in isolation; the store is mocked, so no Redis is needed. */
@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

	private static final Instant NOW = Instant.parse("2026-09-27T10:00:00Z");
	private static final Duration TTL = Duration.ofMinutes(2);

	@Mock
	private BookingStore store;

	private BookingService service;

	@BeforeEach
	void setUp() {
		service = new BookingService(store, new MovieCatalog(), Clock.fixed(NOW, ZoneOffset.UTC), TTL);
	}

	@Test
	void holdReturnsHeldBookingExpiringAfterTtl() {
		when(store.hold(any(), any())).thenReturn(true);

		Booking booking = service.hold("inception", "A1", "alice");

		assertThat(booking.status()).isEqualTo(BookingStatus.HELD);
		assertThat(booking.userId()).isEqualTo("alice");
		assertThat(booking.expiresAt()).isEqualTo(NOW.plus(TTL));
		verify(store).hold(booking, TTL);
	}

	@Test
	void holdFailsWhenSeatIsTaken() {
		when(store.hold(any(), any())).thenReturn(false);

		assertThatThrownBy(() -> service.hold("inception", "A1", "alice"))
				.isInstanceOf(SeatUnavailableException.class);
	}

	@Test
	void holdRejectsUnknownMovie() {
		assertThatThrownBy(() -> service.hold("no-such-movie", "A1", "alice"))
				.isInstanceOf(MovieNotFoundException.class);
	}

	@Test
	void holdRejectsSeatOutsideTheHall() {
		// Inception has 5 rows (A-E) of 8 seats.
		assertThatThrownBy(() -> service.hold("inception", "F1", "alice"))
				.isInstanceOf(InvalidSeatException.class);
		assertThatThrownBy(() -> service.hold("inception", "A9", "alice"))
				.isInstanceOf(InvalidSeatException.class);
		verify(store, never()).hold(any(), any());
	}

	@Test
	void confirmMakesHoldPermanent() {
		when(store.findBySessionId("s1")).thenReturn(Optional.of(held("s1", "alice")));
		when(store.confirm(any())).thenReturn(true);

		Booking confirmed = service.confirm("s1", "alice");

		assertThat(confirmed.status()).isEqualTo(BookingStatus.CONFIRMED);
		assertThat(confirmed.expiresAt()).isNull();
	}

	@Test
	void confirmRejectsAnotherUsersSession() {
		when(store.findBySessionId("s1")).thenReturn(Optional.of(held("s1", "alice")));

		assertThatThrownBy(() -> service.confirm("s1", "mallory"))
				.isInstanceOf(NotSessionOwnerException.class);
		verify(store, never()).confirm(any());
	}

	@Test
	void confirmIsIdempotent() {
		Booking alreadyConfirmed = held("s1", "alice").confirmed();
		when(store.findBySessionId("s1")).thenReturn(Optional.of(alreadyConfirmed));

		assertThat(service.confirm("s1", "alice")).isEqualTo(alreadyConfirmed);
		verify(store, never()).confirm(any());
	}

	@Test
	void confirmFailsWhenHoldLapsesBeforeTheWrite() {
		when(store.findBySessionId("s1")).thenReturn(Optional.of(held("s1", "alice")));
		when(store.confirm(any())).thenReturn(false);

		assertThatThrownBy(() -> service.confirm("s1", "alice"))
				.isInstanceOf(SessionNotFoundException.class);
	}

	@Test
	void confirmFailsForUnknownSession() {
		when(store.findBySessionId("nope")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service.confirm("nope", "alice"))
				.isInstanceOf(SessionNotFoundException.class);
	}

	@Test
	void releaseRejectsConfirmedBooking() {
		when(store.findBySessionId("s1")).thenReturn(Optional.of(held("s1", "alice").confirmed()));

		assertThatThrownBy(() -> service.release("s1", "alice"))
				.isInstanceOf(BookingAlreadyConfirmedException.class);
		verify(store, never()).release(any());
	}

	@Test
	void releaseRejectsAnotherUsersSession() {
		when(store.findBySessionId("s1")).thenReturn(Optional.of(held("s1", "alice")));

		assertThatThrownBy(() -> service.release("s1", "mallory"))
				.isInstanceOf(NotSessionOwnerException.class);
		verify(store, never()).release(any());
	}

	private static Booking held(String sessionId, String userId) {
		return new Booking(sessionId, "inception", "A1", userId, BookingStatus.HELD, NOW.plus(TTL));
	}

}
