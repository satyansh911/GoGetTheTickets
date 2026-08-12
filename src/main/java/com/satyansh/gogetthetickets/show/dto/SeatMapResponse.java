package com.satyansh.gogetthetickets.show.dto;

import java.math.BigDecimal;
import java.util.List;

/** Rows back to front, each with its seats left to right. */
public record SeatMapResponse(long showId, List<Row> rows) {

	public record Row(String row, String tier, List<Seat> seats) {
	}

	/** @param status AVAILABLE, HELD (someone else is checking out) or BOOKED */
	public record Seat(String id, String row, int number, String tier, BigDecimal price, String status,
			boolean wheelchair) {
	}

}
