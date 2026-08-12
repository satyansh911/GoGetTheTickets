package com.satyansh.gogetthetickets.booking;

import java.math.BigDecimal;
import java.util.Objects;

import jakarta.persistence.Embeddable;

/** A seat on a booking, with the price it was sold at. */
@Embeddable
public class BookingSeat {

	private String seatId;

	private String tier;

	private BigDecimal price;

	protected BookingSeat() {
	}

	public BookingSeat(String seatId, String tier, BigDecimal price) {
		this.seatId = seatId;
		this.tier = tier;
		this.price = price;
	}

	public String getSeatId() {
		return seatId;
	}

	public String getTier() {
		return tier;
	}

	public BigDecimal getPrice() {
		return price;
	}

	@Override
	public boolean equals(Object o) {
		return o instanceof BookingSeat other && Objects.equals(seatId, other.seatId);
	}

	@Override
	public int hashCode() {
		return Objects.hashCode(seatId);
	}

}
