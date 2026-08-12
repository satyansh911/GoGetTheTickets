package com.satyansh.gogetthetickets.show.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.satyansh.gogetthetickets.catalog.dto.CinemaResponse;
import com.satyansh.gogetthetickets.catalog.dto.MovieResponse;
import com.satyansh.gogetthetickets.show.Availability;

/**
 * @param tiers      price and remaining seats per tier, plus the geometry the seat map needs
 * @param otherShows same movie, same cinema, same day, for switching showtime without going back
 */
public record ShowDetailsResponse(long id, MovieResponse movie, CinemaResponse cinema, String screen, LocalDate date,
		String startTime, Instant startsAt, String language, String format, Availability availability,
		List<TierResponse> tiers, List<ShowSummary> otherShows) {

	public record TierResponse(String id, String label, BigDecimal price, List<String> rows, List<Integer> blocks,
			boolean wide, int total, int available) {
	}

}
