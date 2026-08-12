package com.satyansh.gogetthetickets.show.dto;

import java.time.Instant;
import java.time.LocalDate;

import com.satyansh.gogetthetickets.show.Availability;
import com.satyansh.gogetthetickets.show.SeatLayout;
import com.satyansh.gogetthetickets.show.Show;

/** @param startTime local IST time as "HH:mm" */
public record ShowSummary(long id, LocalDate date, String startTime, Instant startsAt, String language, String format,
		String screen, Availability availability) {

	public static ShowSummary from(Show s, int sold) {
		return new ShowSummary(s.getId(), s.getShowDate(), s.getLocalStartTime().toString(), s.getStartsAt(),
				s.getLanguage(), s.getFormat(), s.getScreen(),
				Availability.of(SeatLayout.capacity() - sold, SeatLayout.capacity()));
	}

}
