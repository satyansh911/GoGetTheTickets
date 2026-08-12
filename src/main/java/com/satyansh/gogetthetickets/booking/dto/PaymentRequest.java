package com.satyansh.gogetthetickets.booking.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Demo payment. Card details are validated for shape only and never stored.
 *
 * @param simulate "FAIL" to preview a declined payment
 */
public record PaymentRequest(
		@NotBlank @Pattern(regexp = "(?i)UPI|CARD|NETBANKING", message = "Choose UPI, card or netbanking") String method,
		@NotBlank(message = "We need an email to send your tickets") @Email(message = "Enter a valid email address") String email,
		String upiId,
		Card card,
		String bank,
		String simulate) {

	public record Card(String number, String expiry, String cvv, String name) {
	}

}
