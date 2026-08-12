package com.satyansh.gogetthetickets.booking;

import java.time.Clock;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.satyansh.gogetthetickets.show.DemoOccupancy;
import com.satyansh.gogetthetickets.show.SeatLayout;

/**
 * Live status of every seat in a show, merged from three sources:
 * sold seats (Postgres), simulated walk-in sales, and checkout holds (Redis).
 */
@Service
public class SeatInventory {

	public enum SeatStatus {
		AVAILABLE,
		HELD,
		BOOKED
	}

	private final BookedSeatRepository bookedSeats;
	private final SeatHoldStore holds;
	private final BookingRepository bookings;
	private final DemoOccupancy demo;
	private final Clock clock;

	public SeatInventory(BookedSeatRepository bookedSeats, SeatHoldStore holds, BookingRepository bookings,
			DemoOccupancy demo, Clock clock) {
		this.bookedSeats = bookedSeats;
		this.holds = holds;
		this.bookings = bookings;
		this.demo = demo;
		this.clock = clock;
	}

	/**
	 * @param viewerId the signed-in user, if any. Seats they hold themselves show as AVAILABLE
	 *                 to them, so coming back to the seat map lets them change their pick.
	 */
	@Transactional(readOnly = true)
	public Map<String, SeatStatus> statuses(long showId, Long viewerId) {
		List<String> seatIds = SeatLayout.seatIds();
		Set<String> sold = new HashSet<>(bookedSeats.findSeatIds(showId));
		Map<String, String> holders = holds.holders(showId, seatIds);
		Set<String> mine = viewerId == null ? Set.of()
				: new HashSet<>(bookings.findActiveHoldIds(viewerId, showId, clock.instant()));

		Map<String, SeatStatus> result = new LinkedHashMap<>();
		for (String seatId : seatIds) {
			String holder = holders.get(seatId);
			SeatStatus status;
			if (sold.contains(seatId) || demo.isSold(showId, seatId)) {
				status = SeatStatus.BOOKED;
			}
			else if (holder != null && !mine.contains(holder)) {
				status = SeatStatus.HELD;
			}
			else {
				status = SeatStatus.AVAILABLE;
			}
			result.put(seatId, status);
		}
		return result;
	}

	/** Sold seats per show (real plus simulated), for showtime availability chips. */
	@Transactional(readOnly = true)
	public Map<Long, Integer> soldCounts(Collection<Long> showIds) {
		if (showIds.isEmpty()) {
			return Map.of();
		}
		Map<Long, Long> real = bookedSeats.countByShow(showIds).stream()
				.collect(Collectors.toMap(BookedSeatRepository.ShowCount::getShowId, BookedSeatRepository.ShowCount::getBooked));
		return showIds.stream().distinct().collect(Collectors.toMap(Function.identity(),
				id -> demo.soldCount(id) + real.getOrDefault(id, 0L).intValue()));
	}

}
