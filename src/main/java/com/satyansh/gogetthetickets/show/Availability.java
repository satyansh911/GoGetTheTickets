package com.satyansh.gogetthetickets.show;

public enum Availability {

	AVAILABLE,
	FILLING_FAST,
	SOLD_OUT;

	/** Filling fast once fewer than 35% of seats are left. */
	public static Availability of(int free, int total) {
		if (free <= 0) {
			return SOLD_OUT;
		}
		return free < total * 0.35 ? FILLING_FAST : AVAILABLE;
	}

}
