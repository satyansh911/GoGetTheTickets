package com.satyansh.gogetthetickets.booking;

import java.time.Clock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Marks lapsed holds EXPIRED in the database. The seats themselves are already free: their
 * Redis keys expire on the same timer, so this job only tidies up booking status.
 */
@Component
public class HoldExpiryJob {

	private static final Logger log = LoggerFactory.getLogger(HoldExpiryJob.class);

	private final BookingRepository bookings;
	private final Clock clock;

	public HoldExpiryJob(BookingRepository bookings, Clock clock) {
		this.bookings = bookings;
		this.clock = clock;
	}

	@Scheduled(fixedDelayString = "${booking.expiry-sweep:30s}")
	@Transactional
	public void expireLapsedHolds() {
		int expired = bookings.expireHolds(clock.instant());
		if (expired > 0) {
			log.info("Expired {} lapsed seat holds", expired);
		}
	}

}
