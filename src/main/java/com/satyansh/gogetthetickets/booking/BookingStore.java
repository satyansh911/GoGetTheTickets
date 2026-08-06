package com.satyansh.gogetthetickets.booking;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

/**
 * Persistence for seat holds and bookings.
 *
 * Every write is conditional and atomic, so the store alone decides races between concurrent
 * requests, even when several app instances share it. Business rules (ownership, which
 * transitions are allowed) live in {@link BookingService}.
 */
public interface BookingStore {

	/** Holds the seat for {@code ttl}. Returns false if the seat is already held or booked. */
	boolean hold(Booking booking, Duration ttl);

	Optional<Booking> findBySessionId(String sessionId);

	/** Current holds and bookings among the given seats of a movie. */
	List<Booking> findByMovie(String movieId, List<String> seatIds);

	/**
	 * Makes the hold permanent. Returns false if the seat no longer belongs to this session,
	 * i.e. the hold expired or was released in the meantime.
	 */
	boolean confirm(Booking confirmed);

	/** Frees a held seat. Returns false if the seat is no longer held by this session. */
	boolean release(Booking held);

}
