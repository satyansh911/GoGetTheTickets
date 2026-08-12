package com.satyansh.gogetthetickets.booking;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.satyansh.gogetthetickets.auth.CurrentUser;
import com.satyansh.gogetthetickets.booking.dto.BookingResponse;
import com.satyansh.gogetthetickets.booking.dto.CouponRequest;
import com.satyansh.gogetthetickets.booking.dto.HoldRequest;
import com.satyansh.gogetthetickets.booking.dto.ItemsRequest;
import com.satyansh.gogetthetickets.booking.dto.PaymentRequest;
import com.satyansh.gogetthetickets.common.ApiError;
import com.satyansh.gogetthetickets.common.RequestRejectedException;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class BookingController {

	private final BookingService service;

	public BookingController(BookingService service) {
		this.service = service;
	}

	@PostMapping("/shows/{showId}/holds")
	@ResponseStatus(HttpStatus.CREATED)
	public BookingResponse hold(@PathVariable long showId, @Valid @RequestBody HoldRequest request, @AuthenticationPrincipal Jwt jwt) {
		return service.hold(CurrentUser.id(jwt), showId, request.seatIds());
	}

	@GetMapping("/bookings")
	public List<BookingResponse> list(@RequestParam(defaultValue = "upcoming") String scope, @AuthenticationPrincipal Jwt jwt) {
		return service.list(CurrentUser.id(jwt), !"past".equalsIgnoreCase(scope));
	}

	@GetMapping("/bookings/{id}")
	public BookingResponse get(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
		return service.get(CurrentUser.id(jwt), id);
	}

	@DeleteMapping("/bookings/{id}/hold")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void releaseHold(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
		service.releaseHold(CurrentUser.id(jwt), id);
	}

	@PutMapping("/bookings/{id}/items")
	public BookingResponse items(@PathVariable String id, @Valid @RequestBody ItemsRequest request, @AuthenticationPrincipal Jwt jwt) {
		return service.updateItems(CurrentUser.id(jwt), id, request.items());
	}

	@PutMapping("/bookings/{id}/coupon")
	public BookingResponse applyCoupon(@PathVariable String id, @Valid @RequestBody CouponRequest request, @AuthenticationPrincipal Jwt jwt) {
		return service.applyCoupon(CurrentUser.id(jwt), id, request.code());
	}

	@DeleteMapping("/bookings/{id}/coupon")
	public BookingResponse removeCoupon(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
		return service.removeCoupon(CurrentUser.id(jwt), id);
	}

	/**
	 * 200 with the confirmed booking, or 402 when the (demo) bank declines. The 402 body still
	 * carries the booking in {@code details}: the seats stay held for a retry.
	 */
	@PostMapping("/bookings/{id}/payments")
	public ResponseEntity<?> pay(@PathVariable String id, @RequestHeader(name = "Idempotency-Key", required = false) String key,
			@Valid @RequestBody PaymentRequest request, @AuthenticationPrincipal Jwt jwt) {
		if (key == null || key.isBlank() || key.length() > 80) {
			throw new RequestRejectedException(HttpStatus.BAD_REQUEST, "IDEMPOTENCY_KEY_REQUIRED",
					"An Idempotency-Key header (up to 80 characters) is required");
		}
		BookingService.PaymentOutcome outcome = service.pay(CurrentUser.id(jwt), id, key, request);
		if (outcome.succeeded()) {
			return ResponseEntity.ok(outcome.booking());
		}
		return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(new ApiError(
				"The demo bank declined this payment (code " + outcome.failureCode() + "). No money was deducted.",
				"PAYMENT_DECLINED", null, outcome.booking()));
	}

	@PostMapping("/bookings/{id}/cancel")
	public BookingResponse cancel(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
		return service.cancel(CurrentUser.id(jwt), id);
	}

}
