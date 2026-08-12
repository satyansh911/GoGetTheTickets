package com.satyansh.gogetthetickets.common;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Error body: {@code {"error": "message", "code": "SEATS_UNAVAILABLE", "fields": {...}, "details": ...}}.
 * Only {@code error} is always present.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(String error, String code, Map<String, String> fields, Object details) {

	public static ApiError of(String error) {
		return new ApiError(error, null, null, null);
	}

}
