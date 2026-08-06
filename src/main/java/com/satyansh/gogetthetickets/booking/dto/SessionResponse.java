package com.satyansh.gogetthetickets.booking.dto;

import com.satyansh.gogetthetickets.booking.Booking;
import com.satyansh.gogetthetickets.booking.BookingStatus;

public record SessionResponse(String sessionId, String movieId, String seatId, String userId, BookingStatus status) {

	public static SessionResponse from(Booking booking) {
		return new SessionResponse(booking.sessionId(), booking.movieId(), booking.seatId(), booking.userId(),
				booking.status());
	}

}
