package com.satyansh.gogetthetickets;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

/** A clock tests can move forward, e.g. past a hold's expiry, without sleeping. */
public class MutableClock extends Clock {

	private volatile Instant now = Instant.now();

	public void advance(Duration by) {
		now = now.plus(by);
	}

	public void reset() {
		now = Instant.now();
	}

	@Override
	public Instant instant() {
		return now;
	}

	@Override
	public ZoneId getZone() {
		return ZoneOffset.UTC;
	}

	@Override
	public Clock withZone(ZoneId zone) {
		return Clock.fixed(now, zone);
	}

}
