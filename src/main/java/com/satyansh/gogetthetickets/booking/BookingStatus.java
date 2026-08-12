package com.satyansh.gogetthetickets.booking;

/**
 * Lifecycle:
 *
 * <pre>
 * HELD ──pay──▶ CONFIRMED ──cancel──▶ CANCELLED
 *  │
 *  ├─ timer runs out ─▶ EXPIRED
 *  └─ user picks other seats ─▶ RELEASED
 * </pre>
 *
 * A failed payment leaves the booking HELD, so the user can retry until the timer runs out.
 */
public enum BookingStatus {
	HELD,
	CONFIRMED,
	CANCELLED,
	EXPIRED,
	RELEASED
}
