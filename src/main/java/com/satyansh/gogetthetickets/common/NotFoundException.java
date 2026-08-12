package com.satyansh.gogetthetickets.common;

import org.springframework.http.HttpStatus;

public class NotFoundException extends ApiException {

	public NotFoundException(String what) {
		super(HttpStatus.NOT_FOUND, "NOT_FOUND", what + " not found");
	}

}
