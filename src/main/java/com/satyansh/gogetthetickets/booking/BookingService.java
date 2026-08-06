package com.satyansh.gogetthetickets.booking;

import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.satyansh.gogetthetickets.movie.Movie;
import com.satyansh.gogetthetickets.movie.MovieCatalog;

@Service
public class BookingService {

	private final BookingStore store;
	private final MovieCatalog movies;
	private final Clock clock;
	private final Duration holdTtl;

	public BookingService(BookingStore store, MovieCatalog movies, Clock clock,
			@Value("${booking.hold-ttl}") Duration holdTtl) {
		this.store = store;
		this.movies = movies;
		this.clock = clock;
		this.holdTtl = holdTtl;
	}

	public Booking hold(String movieId, String seatId, String userId) {
		Movie movie = movies.get(movieId);
		if (!movie.hasSeat(seatId)) {
			throw new InvalidSeatException(movieId, seatId);
		}

		Booking booking = new Booking(UUID.randomUUID().toString(), movieId, seatId, userId,
				BookingStatus.HELD, clock.instant().plus(holdTtl));
		if (!store.hold(booking, holdTtl)) {
			throw new SeatUnavailableException(seatId);
		}
		return booking;
	}

	public List<Booking> listBookings(String movieId) {
		Movie movie = movies.get(movieId);
		return store.findByMovie(movieId, movie.seatIds());
	}

	/** Idempotent: confirming an already-confirmed session returns it unchanged, so retries are safe. */
	public Booking confirm(String sessionId, String userId) {
		Booking booking = findOwnedSession(sessionId, userId);
		if (booking.status() == BookingStatus.CONFIRMED) {
			return booking;
		}

		Booking confirmed = booking.confirmed();
		if (!store.confirm(confirmed)) {
			// The hold lapsed between our read and the write.
			throw new SessionNotFoundException();
		}
		return confirmed;
	}

	public void release(String sessionId, String userId) {
		Booking booking = findOwnedSession(sessionId, userId);
		if (booking.status() == BookingStatus.CONFIRMED) {
			throw new BookingAlreadyConfirmedException();
		}
		if (!store.release(booking)) {
			throw new SessionNotFoundException();
		}
	}

	private Booking findOwnedSession(String sessionId, String userId) {
		Booking booking = store.findBySessionId(sessionId).orElseThrow(SessionNotFoundException::new);
		if (!booking.ownedBy(userId)) {
			throw new NotSessionOwnerException();
		}
		return booking;
	}

}
