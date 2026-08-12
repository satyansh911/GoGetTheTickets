package com.satyansh.gogetthetickets.common;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

/** Showtimes are local to India, so "today" and show dates are always in IST. */
public final class AppTime {

	public static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

	private AppTime() {
	}

	public static LocalDate today(Clock clock) {
		return LocalDate.now(clock.withZone(ZONE));
	}

}
