package com.satyansh.gogetthetickets.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.satyansh.gogetthetickets.auth.dto.AuthResponse;
import com.satyansh.gogetthetickets.auth.dto.LoginRequest;
import com.satyansh.gogetthetickets.auth.dto.SignupRequest;
import com.satyansh.gogetthetickets.auth.dto.UserResponse;
import com.satyansh.gogetthetickets.booking.BookingRepository;
import com.satyansh.gogetthetickets.booking.BookingStatus;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService auth;
	private final BookingRepository bookings;

	public AuthController(AuthService auth, BookingRepository bookings) {
		this.auth = auth;
		this.bookings = bookings;
	}

	@PostMapping("/signup")
	@ResponseStatus(HttpStatus.CREATED)
	public AuthResponse signup(@Valid @RequestBody SignupRequest request) {
		return auth.signup(request);
	}

	@PostMapping("/login")
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		return auth.login(request);
	}

	@GetMapping("/me")
	public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
		long userId = CurrentUser.id(jwt);
		return UserResponse.from(auth.get(userId), bookings.countByUserIdAndStatus(userId, BookingStatus.CONFIRMED));
	}

}
