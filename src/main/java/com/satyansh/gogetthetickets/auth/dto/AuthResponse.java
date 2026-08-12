package com.satyansh.gogetthetickets.auth.dto;

import com.satyansh.gogetthetickets.auth.User;

public record AuthResponse(String token, UserResponse user) {

	public static AuthResponse of(String token, User user) {
		return new AuthResponse(token, UserResponse.from(user, 0));
	}

}
