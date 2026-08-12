package com.satyansh.gogetthetickets.booking.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.satyansh.gogetthetickets.catalog.dto.MovieResponse;

/**
 * Everything the checkout, ticket and bookings screens show, in one shape.
 *
 * @param couponNotice set when a change (e.g. removing all food) made the applied coupon
 *                     invalid and it was removed
 * @param refundAmount what a cancellation pays back: total minus the non-refundable fee and GST
 */
public record BookingResponse(
		String bookingId,
		String status,
		long showId,
		MovieResponse movie,
		String cinemaName,
		String area,
		String cityId,
		String screen,
		LocalDate date,
		String startTime,
		Instant startsAt,
		String language,
		String format,
		List<SeatLine> seats,
		List<ItemLine> items,
		BigDecimal ticketsAmount,
		BigDecimal fnbAmount,
		BigDecimal subtotal,
		BigDecimal convenienceFee,
		BigDecimal gst,
		BigDecimal discount,
		BigDecimal total,
		String couponCode,
		String couponLabel,
		String couponNotice,
		Instant holdExpiresAt,
		String email,
		String qrCode,
		BigDecimal refundAmount,
		boolean cancellable,
		Instant createdAt) {

	public record SeatLine(String id, String row, int number, String tier, BigDecimal price) {
	}

	public record ItemLine(String id, String name, BigDecimal price, int qty) {
	}

}
