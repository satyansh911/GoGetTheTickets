package com.satyansh.gogetthetickets.booking;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collection;

/**
 * Price calculation, kept free of I/O so it can be tested on its own.
 *
 * Total = tickets + food + convenience fee (₹30 per ticket) + 18% GST on the fee − discount.
 * All money is BigDecimal rounded to paise; doubles would drift.
 */
public final class Pricing {

	public static final BigDecimal FEE_PER_TICKET = BigDecimal.valueOf(30);
	public static final BigDecimal GST_RATE = new BigDecimal("0.18");

	public record Quote(BigDecimal tickets, BigDecimal fnb, BigDecimal convenienceFee, BigDecimal gst,
			BigDecimal discount, BigDecimal total) {

		public BigDecimal subtotal() {
			return tickets.add(fnb);
		}

	}

	private Pricing() {
	}

	public static Quote quote(Collection<BookingSeat> seats, Collection<BookingItem> items, Coupon coupon) {
		BigDecimal tickets = seats.stream().map(BookingSeat::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add);
		BigDecimal fnb = items.stream().map(BookingItem::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
		BigDecimal fee = FEE_PER_TICKET.multiply(BigDecimal.valueOf(seats.size()));
		BigDecimal gst = fee.multiply(GST_RATE).setScale(2, RoundingMode.HALF_UP);
		BigDecimal discount = coupon == null ? BigDecimal.ZERO : discount(coupon, tickets, fnb);
		BigDecimal total = tickets.add(fnb).add(fee).add(gst).subtract(discount).setScale(2, RoundingMode.HALF_UP);
		return new Quote(scale(tickets), scale(fnb), scale(fee), gst, scale(discount), total);
	}

	/** What a coupon takes off this order; zero when the order doesn't qualify. */
	public static BigDecimal discount(Coupon coupon, BigDecimal tickets, BigDecimal fnb) {
		return switch (coupon.getKind()) {
			case TICKET_PERCENT -> {
				BigDecimal off = tickets.multiply(coupon.getAmount()).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
				yield coupon.getMaxDiscount() == null ? off : off.min(coupon.getMaxDiscount());
			}
			case FNB_FLAT -> fnb.signum() > 0 ? coupon.getAmount().min(fnb) : BigDecimal.ZERO;
		};
	}

	private static BigDecimal scale(BigDecimal v) {
		return v.setScale(2, RoundingMode.HALF_UP);
	}

}
