package com.satyansh.gogetthetickets.common;

import org.springframework.http.HttpStatus;

/**
 * Base class for errors that map to a specific HTTP status.
 * {@link GlobalExceptionHandler} turns these into {@code {"error": "...", "code": "..."}} responses.
 */
public abstract class ApiException extends RuntimeException {

	private final HttpStatus status;
	private final String code;

	protected ApiException(HttpStatus status, String code, String message) {
		super(message);
		this.status = status;
		this.code = code;
	}

	public HttpStatus status() {
		return status;
	}

	/** Machine-readable reason, e.g. {@code SEATS_UNAVAILABLE}, so the UI can react without parsing text. */
	public String code() {
		return code;
	}

	/** Extra structured data for the response body, such as the seat IDs that were taken. */
	public Object details() {
		return null;
	}

}
