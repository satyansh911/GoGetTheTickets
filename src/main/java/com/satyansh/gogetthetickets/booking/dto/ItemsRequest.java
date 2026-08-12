package com.satyansh.gogetthetickets.booking.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** The full food & drinks order; replaces whatever was there. */
public record ItemsRequest(@NotNull List<@Valid Item> items) {

	public record Item(@NotBlank String id, @Min(0) @Max(value = 10, message = "Up to 10 of each item") int qty) {
	}

}
