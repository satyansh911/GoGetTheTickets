package com.satyansh.gogetthetickets.common;

import org.springframework.http.HttpStatus;

/** A business rule refused the request. The message is written for the person using the app. */
public class RequestRejectedException extends ApiException {

	public RequestRejectedException(HttpStatus status, String code, String message) {
		super(status, code, message);
	}

}
