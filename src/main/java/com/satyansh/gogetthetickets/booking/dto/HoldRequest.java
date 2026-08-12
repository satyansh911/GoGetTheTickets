package com.satyansh.gogetthetickets.booking.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record HoldRequest(
		@NotEmpty(message = "Pick at least one seat") @Size(max = 10, message = "You can book up to 10 seats at a time")
		List<@NotBlank String> seatIds) {
}
