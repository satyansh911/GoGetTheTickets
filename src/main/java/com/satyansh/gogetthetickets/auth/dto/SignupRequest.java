package com.satyansh.gogetthetickets.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
		@NotBlank(message = "Tell us your name") @Size(max = 100, message = "Keep your name under 100 characters") String name,
		@NotBlank(message = "Email is required") @Email(message = "Enter a valid email address") String email,
		@NotBlank(message = "Password is required") @Size(min = 8, max = 72, message = "Password must be at least 8 characters") String password) {
}
