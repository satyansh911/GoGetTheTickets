package com.satyansh.gogetthetickets.common;

import java.util.Map;

import org.springframework.http.HttpStatus;

/** Validation that depends on other fields (e.g. card details only when paying by card). */
public class FieldValidationException extends ApiException {

	private final Map<String, String> fields;

	public FieldValidationException(Map<String, String> fields) {
		super(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", fields.values().iterator().next());
		this.fields = Map.copyOf(fields);
	}

	public Map<String, String> fields() {
		return fields;
	}

}
