package com.satyansh.gogetthetickets.booking;

import java.time.Instant;

/**
 * A seat hold or a confirmed booking. The session ID identifies it across hold, confirm and release.
 *
 * @param expiresAt when a hold lapses; {@code null} once confirmed
 */
public record Booking(
		String sessionId,
		String movieId,
		String seatId,
		String userId,
		BookingStatus status,
		Instant expiresAt) {

	public Booking confirmed() {
		return new Booking(sessionId, movieId, seatId, userId, BookingStatus.CONFIRMED, null);
	}

	public boolean ownedBy(String userId) {
		return this.userId.equals(userId);
	}

}
