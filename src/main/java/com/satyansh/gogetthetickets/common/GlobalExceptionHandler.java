package com.satyansh.gogetthetickets.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(ApiException.class)
	ResponseEntity<ApiError> handleApiException(ApiException e) {
		return ResponseEntity.status(e.status()).body(new ApiError(e.getMessage()));
	}

	// @Valid failures, e.g. a blank user_id.
	@ExceptionHandler(MethodArgumentNotValidException.class)
	ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException e) {
		String message = e.getBindingResult().getFieldErrors().stream()
				.findFirst()
				.map(fe -> fe.getDefaultMessage())
				.orElse("invalid request");
		return ResponseEntity.badRequest().body(new ApiError(message));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	ResponseEntity<ApiError> handleUnreadableBody(HttpMessageNotReadableException e) {
		return ResponseEntity.badRequest().body(new ApiError("request body is missing or malformed"));
	}

	@ExceptionHandler(Exception.class)
	ResponseEntity<ApiError> handleUnexpected(Exception e) {
		// Spring's own exceptions (unknown route, wrong method or content type, ...) already know their status.
		if (e instanceof ErrorResponse springError) {
			return ResponseEntity.status(springError.getStatusCode())
					.body(new ApiError(springError.getBody().getDetail()));
		}
		log.error("unhandled error", e);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiError("internal server error"));
	}

}
