package com.satyansh.gogetthetickets.booking;

import java.security.SecureRandom;

/** Booking codes like GGT7K3X9QM: easy to read aloud (no 0/O or 1/I) and hard to guess. */
final class BookingCodes {

	private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	private static final SecureRandom RANDOM = new SecureRandom();

	private BookingCodes() {
	}

	static String next() {
		StringBuilder code = new StringBuilder("GGT");
		for (int i = 0; i < 7; i++) {
			code.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
		}
		return code.toString();
	}

}
