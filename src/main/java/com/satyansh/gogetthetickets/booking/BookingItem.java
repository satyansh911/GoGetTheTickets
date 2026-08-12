package com.satyansh.gogetthetickets.booking;

import java.math.BigDecimal;
import java.util.Objects;

import jakarta.persistence.Embeddable;

/** A food or drink line on a booking; name and price are copied so later menu changes don't alter it. */
@Embeddable
public class BookingItem {

	private String foodItemId;

	private String name;

	private BigDecimal price;

	private int qty;

	protected BookingItem() {
	}

	public BookingItem(String foodItemId, String name, BigDecimal price, int qty) {
		this.foodItemId = foodItemId;
		this.name = name;
		this.price = price;
		this.qty = qty;
	}

	public String getFoodItemId() {
		return foodItemId;
	}

	public String getName() {
		return name;
	}

	public BigDecimal getPrice() {
		return price;
	}

	public int getQty() {
		return qty;
	}

	public BigDecimal lineTotal() {
		return price.multiply(BigDecimal.valueOf(qty));
	}

	@Override
	public boolean equals(Object o) {
		return o instanceof BookingItem other && Objects.equals(foodItemId, other.foodItemId);
	}

	@Override
	public int hashCode() {
		return Objects.hashCode(foodItemId);
	}

}
