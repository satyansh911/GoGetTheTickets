package com.satyansh.gogetthetickets.booking;

import org.springframework.http.HttpStatus;

import com.satyansh.gogetthetickets.common.ApiException;

public class BookingAlreadyConfirmedException extends ApiException {

	public BookingAlreadyConfirmedException() {
		super(HttpStatus.CONFLICT, "booking is already confirmed and cannot be released");
	}

}
