package com.satyansh.gogetthetickets.booking;

import org.springframework.http.HttpStatus;

import com.satyansh.gogetthetickets.common.ApiException;

public class InvalidSeatException extends ApiException {

	public InvalidSeatException(String movieId, String seatId) {
		super(HttpStatus.BAD_REQUEST, "seat " + seatId + " does not exist for movie " + movieId);
	}

}
