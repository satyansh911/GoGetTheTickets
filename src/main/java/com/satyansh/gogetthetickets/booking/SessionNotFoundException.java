package com.satyansh.gogetthetickets.booking;

import org.springframework.http.HttpStatus;

import com.satyansh.gogetthetickets.common.ApiException;

public class SessionNotFoundException extends ApiException {

	public SessionNotFoundException() {
		super(HttpStatus.NOT_FOUND, "session not found or hold expired");
	}

}
