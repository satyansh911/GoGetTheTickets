package com.satyansh.gogetthetickets.show;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.satyansh.gogetthetickets.auth.CurrentUser;
import com.satyansh.gogetthetickets.show.dto.SeatMapResponse;
import com.satyansh.gogetthetickets.show.dto.ShowDetailsResponse;
import com.satyansh.gogetthetickets.show.dto.ShowtimesResponse;

@RestController
@RequestMapping("/api")
public class ShowController {

	private final ShowService service;

	public ShowController(ShowService service) {
		this.service = service;
	}

	@GetMapping("/movies/{movieId}/showtimes")
	public ShowtimesResponse showtimes(@PathVariable String movieId, @RequestParam String city,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
		return service.showtimes(movieId, city, date);
	}

	@GetMapping("/shows/{showId}")
	public ShowDetailsResponse show(@PathVariable long showId, @AuthenticationPrincipal Jwt jwt) {
		return service.details(showId, CurrentUser.idOrNull(jwt));
	}

	@GetMapping("/shows/{showId}/seats")
	public SeatMapResponse seats(@PathVariable long showId, @AuthenticationPrincipal Jwt jwt) {
		return service.seatMap(showId, CurrentUser.idOrNull(jwt));
	}

}
