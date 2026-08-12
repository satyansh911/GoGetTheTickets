package com.satyansh.gogetthetickets.auth;

import org.springframework.security.oauth2.jwt.Jwt;

/** The signed-in user's ID is the token's subject. */
public final class CurrentUser {

	private CurrentUser() {
	}

	public static long id(Jwt jwt) {
		return Long.parseLong(jwt.getSubject());
	}

	/** For endpoints that work signed out but personalise the answer when signed in. */
	public static Long idOrNull(Jwt jwt) {
		return jwt == null ? null : id(jwt);
	}

}
