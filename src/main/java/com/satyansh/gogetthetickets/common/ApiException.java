package com.satyansh.gogetthetickets.common;

import org.springframework.http.HttpStatus;

/**
 * Base class for errors that map to a specific HTTP status.
 * {@link GlobalExceptionHandler} turns these into {@code {"error": "..."}} responses.
 */
public abstract class ApiException extends RuntimeException {

	private final HttpStatus status;

	protected ApiException(HttpStatus status, String message) {
		super(message);
		this.status = status;
	}

	public HttpStatus status() {
		return status;
	}

}
