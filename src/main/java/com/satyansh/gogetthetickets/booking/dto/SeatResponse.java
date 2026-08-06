package com.satyansh.gogetthetickets.booking.dto;

import com.satyansh.gogetthetickets.booking.Booking;
import com.satyansh.gogetthetickets.booking.BookingStatus;

/** One taken seat. Free seats are not listed. */
public record SeatResponse(String seatId, String userId, boolean booked, boolean confirmed) {

	public static SeatResponse from(Booking booking) {
		return new SeatResponse(booking.seatId(), booking.userId(), true,
				booking.status() == BookingStatus.CONFIRMED);
	}

}
