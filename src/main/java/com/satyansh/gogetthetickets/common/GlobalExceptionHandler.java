package com.satyansh.gogetthetickets.common;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
	private static final Resource INDEX_HTML = new ClassPathResource("static/index.html");

	@ExceptionHandler(ApiException.class)
	ResponseEntity<ApiError> handleApiException(ApiException e) {
		Map<String, String> fields = e instanceof FieldValidationException fv ? fv.fields() : null;
		return ResponseEntity.status(e.status()).body(new ApiError(e.getMessage(), e.code(), fields, e.details()));
	}

	// @Valid failures: every invalid field with its message, so forms can show errors inline.
	@ExceptionHandler(MethodArgumentNotValidException.class)
	ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException e) {
		Map<String, String> fields = new LinkedHashMap<>();
		e.getBindingResult().getFieldErrors().forEach(fe -> fields.putIfAbsent(fe.getField(), fe.getDefaultMessage()));
		String first = fields.values().stream().findFirst().orElse("Check the highlighted fields");
		return ResponseEntity.badRequest().body(new ApiError(first, "VALIDATION_FAILED", fields, null));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	ResponseEntity<ApiError> handleUnreadableBody(HttpMessageNotReadableException e) {
		return ResponseEntity.badRequest().body(ApiError.of("Request body is missing or malformed"));
	}

	/**
	 * The browser app routes on the client (/movies/..., /bookings/...). A page load of such a
	 * path finds no file, so serve index.html and let the client router render it, including
	 * its own 404 page.
	 */
	@ExceptionHandler(NoResourceFoundException.class)
	ResponseEntity<?> handleNoResource(NoResourceFoundException e, HttpServletRequest request) {
		boolean pageRequest = HttpMethod.GET.matches(request.getMethod()) && !request.getRequestURI().startsWith("/api/");
		if (pageRequest && INDEX_HTML.exists()) {
			return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(INDEX_HTML);
		}
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiError.of("Not found"));
	}

	@ExceptionHandler(Exception.class)
	ResponseEntity<ApiError> handleUnexpected(Exception e) {
		// Spring's own exceptions (wrong method or content type, ...) already know their status.
		if (e instanceof ErrorResponse springError) {
			return ResponseEntity.status(springError.getStatusCode())
					.body(ApiError.of(springError.getBody().getDetail()));
		}
		log.error("unhandled error", e);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiError.of("Something went wrong on our side"));
	}

}
