package com.satyansh.gogetthetickets.show.dto;

import java.time.LocalDate;
import java.util.List;

import com.satyansh.gogetthetickets.catalog.dto.CinemaResponse;

/**
 * @param dates   the next seven days, flagged when the movie has shows in the city that day
 * @param date    the day {@code cinemas} is for
 * @param cinemas nearest first, each with its shows that day
 */
public record ShowtimesResponse(List<DateOption> dates, LocalDate date, List<CinemaShowtimes> cinemas) {

	public record DateOption(LocalDate date, boolean hasShows) {
	}

	public record CinemaShowtimes(CinemaResponse cinema, List<ShowSummary> shows) {
	}

}
