package com.satyansh.gogetthetickets.booking;

import java.math.BigDecimal;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "coupons")
public class Coupon {

	public enum Kind {
		/** {@code amount}% off tickets, capped at {@code maxDiscount}. */
		TICKET_PERCENT,
		/** Flat {@code amount} off food and drinks; needs at least one item. */
		FNB_FLAT
	}

	@Id
	private String code;

	private String label;

	@Enumerated(EnumType.STRING)
	private Kind kind;

	private BigDecimal amount;

	private BigDecimal maxDiscount;

	private boolean firstBookingOnly;

	private boolean active;

	protected Coupon() {
	}

	public Coupon(String code, String label, Kind kind, BigDecimal amount, BigDecimal maxDiscount, boolean firstBookingOnly) {
		this.code = code;
		this.label = label;
		this.kind = kind;
		this.amount = amount;
		this.maxDiscount = maxDiscount;
		this.firstBookingOnly = firstBookingOnly;
		this.active = true;
	}

	public String getCode() {
		return code;
	}

	public String getLabel() {
		return label;
	}

	public Kind getKind() {
		return kind;
	}

	public BigDecimal getAmount() {
		return amount;
	}

	public BigDecimal getMaxDiscount() {
		return maxDiscount;
	}

	public boolean isFirstBookingOnly() {
		return firstBookingOnly;
	}

}
