package com.satyansh.gogetthetickets.show;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Simulated box-office sales so a fresh demo doesn't show empty halls.
 *
 * Which seats count as sold is a pure function of the show and seat IDs, so it is stable
 * across requests and restarts without storing anything. Simulated seats behave exactly like
 * sold seats: they can't be held or booked. Turn off with {@code booking.demo-occupancy=false}.
 */
@Component
public class DemoOccupancy {

	private final boolean enabled;

	public DemoOccupancy(@Value("${booking.demo-occupancy:true}") boolean enabled) {
		this.enabled = enabled;
	}

	public boolean isSold(long showId, String seatId) {
		return enabled && unit(mix(showId * 1_000_003L + seatId.hashCode())) < fillLevel(showId);
	}

	public int soldCount(long showId) {
		if (!enabled) {
			return 0;
		}
		return (int) SeatLayout.seatIds().stream().filter(id -> isSold(showId, id)).count();
	}

	/** Most shows are part full, some are nearly full, a few are sold out or empty. */
	private static double fillLevel(long showId) {
		double r = unit(mix(showId));
		double jitter = unit(mix(showId ^ 0x5DEECE66DL));
		if (r < 0.06) {
			return 1.0;
		}
		if (r < 0.30) {
			return 0.62 + jitter * 0.22;
		}
		if (r < 0.88) {
			return 0.18 + jitter * 0.32;
		}
		return jitter * 0.08;
	}

	/** SplitMix64: a fast, well-distributed 64-bit hash. */
	private static long mix(long z) {
		z += 0x9E3779B97F4A7C15L;
		z = (z ^ (z >>> 30)) * 0xBF58476D1CE4E5B9L;
		z = (z ^ (z >>> 27)) * 0x94D049BB133111EBL;
		return z ^ (z >>> 31);
	}

	private static double unit(long x) {
		return (x >>> 11) * 0x1.0p-53;
	}

}
