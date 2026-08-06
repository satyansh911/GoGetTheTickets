package com.satyansh.gogetthetickets.booking.dto;

import jakarta.validation.constraints.NotBlank;

/** Body of hold, confirm and release: {@code {"user_id": "..."}}. */
public record UserRequest(@NotBlank(message = "user_id is required") String userId) {
}
