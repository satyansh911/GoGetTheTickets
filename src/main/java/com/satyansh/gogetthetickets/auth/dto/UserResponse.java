package com.satyansh.gogetthetickets.auth.dto;

import java.time.Instant;

import com.satyansh.gogetthetickets.auth.User;

public record UserResponse(long id, String name, String email, Instant memberSince, long bookings) {

	public static UserResponse from(User user, long bookings) {
		return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getCreatedAt(), bookings);
	}

}
