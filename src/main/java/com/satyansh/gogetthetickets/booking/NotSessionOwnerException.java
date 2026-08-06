package com.satyansh.gogetthetickets.booking;

import org.springframework.http.HttpStatus;

import com.satyansh.gogetthetickets.common.ApiException;

public class NotSessionOwnerException extends ApiException {

	public NotSessionOwnerException() {
		super(HttpStatus.FORBIDDEN, "session belongs to another user");
	}

}
