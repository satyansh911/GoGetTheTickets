package com.satyansh.gogetthetickets.show;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/** The auditorium layout every screen uses: 10 rows, 168 seats, four wheelchair spaces. */
public final class SeatLayout {

	public record Seat(String id, String row, int number, SeatTier tier, boolean wheelchair) {
	}

	private static final Set<String> WHEELCHAIR = Set.of("D1", "D2", "A17", "A18");
	private static final Map<String, Seat> SEATS;

	static {
		Map<String, Seat> seats = new LinkedHashMap<>();
		for (SeatTier tier : SeatTier.values()) {
			for (String row : tier.rows()) {
				for (int n = 1; n <= tier.seatsPerRow(); n++) {
					String id = row + n;
					seats.put(id, new Seat(id, row, n, tier, WHEELCHAIR.contains(id)));
				}
			}
		}
		SEATS = Collections.unmodifiableMap(seats);
	}

	private SeatLayout() {
	}

	/** All seats, back row first, left to right. */
	public static List<Seat> seats() {
		return new ArrayList<>(SEATS.values());
	}

	public static List<String> seatIds() {
		return new ArrayList<>(SEATS.keySet());
	}

	public static Optional<Seat> seat(String id) {
		return Optional.ofNullable(SEATS.get(id));
	}

	public static int capacity() {
		return SEATS.size();
	}

}
