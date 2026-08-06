package com.satyansh.gogetthetickets.movie;

import org.springframework.http.HttpStatus;

import com.satyansh.gogetthetickets.common.ApiException;

public class MovieNotFoundException extends ApiException {

	public MovieNotFoundException(String movieId) {
		super(HttpStatus.NOT_FOUND, "movie not found: " + movieId);
	}

}
