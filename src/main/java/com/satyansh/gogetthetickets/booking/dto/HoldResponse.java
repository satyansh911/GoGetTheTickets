package com.satyansh.gogetthetickets.booking.dto;

import java.time.Instant;

import com.satyansh.gogetthetickets.booking.Booking;

public record HoldResponse(String sessionId, String movieId, String seatId, Instant expiresAt) {

	public static HoldResponse from(Booking booking) {
		return new HoldResponse(booking.sessionId(), booking.movieId(), booking.seatId(), booking.expiresAt());
	}

}
