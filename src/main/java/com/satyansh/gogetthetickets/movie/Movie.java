package com.satyansh.gogetthetickets.movie;

import java.util.ArrayList;
import java.util.List;

public record Movie(String id, String title, int rows, int seatsPerRow) {

	private static final String ROW_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

	/** Every seat in the hall, in the same "A1", "A2", ... format the UI uses. */
	public List<String> seatIds() {
		List<String> ids = new ArrayList<>(rows * seatsPerRow);
		for (int r = 0; r < rows; r++) {
			for (int s = 1; s <= seatsPerRow; s++) {
				ids.add(ROW_LABELS.charAt(r) + String.valueOf(s));
			}
		}
		return ids;
	}

	public boolean hasSeat(String seatId) {
		return seatIds().contains(seatId);
	}

}
