package com.satyansh.gogetthetickets.booking;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;

import com.satyansh.gogetthetickets.common.ApiException;

/** Some requested seats are held or sold. Carries their IDs so the seat map can mark them. */
public class SeatsUnavailableException extends ApiException {

	private final List<String> seatIds;

	public SeatsUnavailableException(List<String> seatIds) {
		super(HttpStatus.CONFLICT, "SEATS_UNAVAILABLE", message(seatIds));
		this.seatIds = List.copyOf(seatIds);
	}

	private static String message(List<String> seatIds) {
		return seatIds.size() == 1
				? "Seat " + seatIds.get(0) + " was just taken by someone else"
				: "Seats " + String.join(", ", seatIds) + " were just taken by someone else";
	}

	@Override
	public Object details() {
		return Map.of("seats", seatIds);
	}

}
