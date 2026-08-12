package com.satyansh.gogetthetickets.booking;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;

class PricingTest {

	private static final Coupon TWENTY_PERCENT_UP_TO_150 = new Coupon("GGTFIRST", "20% off", Coupon.Kind.TICKET_PERCENT,
			BigDecimal.valueOf(20), BigDecimal.valueOf(150), true);
	private static final Coupon FIFTY_OFF_FOOD = new Coupon("POPCORN50", "₹50 off food", Coupon.Kind.FNB_FLAT,
			BigDecimal.valueOf(50), null, false);

	@Test
	void totalsTicketsFoodFeeAndGstOnFee() {
		// 2 × Prime ₹280, 1 × Movie Combo ₹560. Fee ₹30 × 2 = ₹60; GST 18% of ₹60 = ₹10.80.
		Pricing.Quote q = Pricing.quote(seats(280, 280), List.of(item(560, 1)), null);

		assertThat(q.tickets()).isEqualByComparingTo("560");
		assertThat(q.fnb()).isEqualByComparingTo("560");
		assertThat(q.convenienceFee()).isEqualByComparingTo("60");
		assertThat(q.gst()).isEqualByComparingTo("10.80");
		assertThat(q.total()).isEqualByComparingTo("1190.80");
	}

	@Test
	void ticketPercentCouponIsCapped() {
		// 20% of 4 × ₹450 = ₹360, capped at ₹150.
		Pricing.Quote q = Pricing.quote(seats(450, 450, 450, 450), List.of(), TWENTY_PERCENT_UP_TO_150);

		assertThat(q.discount()).isEqualByComparingTo("150");
	}

	@Test
	void ticketPercentCouponRoundsToWholeRupees() {
		// 20% of ₹180 = ₹36.
		assertThat(Pricing.quote(seats(180), List.of(), TWENTY_PERCENT_UP_TO_150).discount()).isEqualByComparingTo("36");
	}

	@Test
	void foodCouponNeedsFoodAndNeverExceedsIt() {
		assertThat(Pricing.discount(FIFTY_OFF_FOOD, BigDecimal.valueOf(560), BigDecimal.ZERO)).isZero();
		assertThat(Pricing.discount(FIFTY_OFF_FOOD, BigDecimal.valueOf(560), BigDecimal.valueOf(30))).isEqualByComparingTo("30");
		assertThat(Pricing.discount(FIFTY_OFF_FOOD, BigDecimal.valueOf(560), BigDecimal.valueOf(290))).isEqualByComparingTo("50");
	}

	@Test
	void refundExcludesFeeAndGst() {
		Pricing.Quote q = Pricing.quote(seats(280, 280), List.of(), null);
		assertThat(q.total().subtract(q.convenienceFee()).subtract(q.gst())).isEqualByComparingTo("560");
	}

	private static List<BookingSeat> seats(int... prices) {
		List<BookingSeat> seats = new java.util.ArrayList<>();
		for (int i = 0; i < prices.length; i++) {
			seats.add(new BookingSeat("E" + (i + 1), "PRIME", BigDecimal.valueOf(prices[i])));
		}
		return seats;
	}

	private static BookingItem item(int price, int qty) {
		return new BookingItem("movie-combo", "Movie Combo", BigDecimal.valueOf(price), qty);
	}

}
