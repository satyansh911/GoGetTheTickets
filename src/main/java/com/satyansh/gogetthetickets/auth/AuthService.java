package com.satyansh.gogetthetickets.auth;

import java.time.Clock;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.satyansh.gogetthetickets.auth.dto.AuthResponse;
import com.satyansh.gogetthetickets.auth.dto.LoginRequest;
import com.satyansh.gogetthetickets.auth.dto.SignupRequest;
import com.satyansh.gogetthetickets.common.NotFoundException;
import com.satyansh.gogetthetickets.common.RequestRejectedException;

@Service
public class AuthService {

	private final UserRepository users;
	private final PasswordEncoder passwords;
	private final TokenService tokens;
	private final Clock clock;

	public AuthService(UserRepository users, PasswordEncoder passwords, TokenService tokens, Clock clock) {
		this.users = users;
		this.passwords = passwords;
		this.tokens = tokens;
		this.clock = clock;
	}

	@Transactional
	public AuthResponse signup(SignupRequest request) {
		String email = request.email().trim();
		if (users.existsByEmailIgnoreCase(email)) {
			throw new RequestRejectedException(HttpStatus.CONFLICT, "EMAIL_TAKEN", "An account with this email already exists");
		}
		User user = users.save(new User(request.name().trim(), email, passwords.encode(request.password()), clock.instant()));
		return AuthResponse.of(tokens.issue(user), user);
	}

	@Transactional(readOnly = true)
	public AuthResponse login(LoginRequest request) {
		// Same message whether the email or the password is wrong, so the response
		// doesn't reveal which emails have accounts.
		User user = users.findByEmailIgnoreCase(request.email().trim())
				.filter(u -> passwords.matches(request.password(), u.getPasswordHash()))
				.orElseThrow(() -> new RequestRejectedException(HttpStatus.UNAUTHORIZED, "BAD_CREDENTIALS",
						"Email or password is incorrect. Try again or reset your password."));
		return AuthResponse.of(tokens.issue(user), user);
	}

	@Transactional(readOnly = true)
	public User get(long userId) {
		return users.findById(userId).orElseThrow(() -> new NotFoundException("User"));
	}

}
