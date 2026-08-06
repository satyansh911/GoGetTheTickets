package com.satyansh.gogetthetickets.booking;

import org.springframework.http.HttpStatus;

import com.satyansh.gogetthetickets.common.ApiException;

public class SeatUnavailableException extends ApiException {

	public SeatUnavailableException(String seatId) {
		super(HttpStatus.CONFLICT, "seat " + seatId + " is already taken");
	}

}
