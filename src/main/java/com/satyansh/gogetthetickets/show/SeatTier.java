package com.satyansh.gogetthetickets.show;

import java.math.BigDecimal;
import java.util.List;

/**
 * Seating tiers, back of the hall first.
 *
 * @param blocks seats per block within a row; an aisle separates blocks
 * @param wide   recliners are drawn wider on the seat map
 */
public enum SeatTier {

	RECLINER("Recliner", 450, List.of("K", "J"), List.of(2, 8, 2), true),
	PRIME("Prime", 280, List.of("H", "G", "F", "E", "D"), List.of(4, 10, 4), false),
	CLASSIC("Classic", 180, List.of("C", "B", "A"), List.of(4, 10, 4), false);

	private final String label;
	private final BigDecimal price;
	private final List<String> rows;
	private final List<Integer> blocks;
	private final boolean wide;

	SeatTier(String label, int price, List<String> rows, List<Integer> blocks, boolean wide) {
		this.label = label;
		this.price = BigDecimal.valueOf(price);
		this.rows = rows;
		this.blocks = blocks;
		this.wide = wide;
	}

	public String label() {
		return label;
	}

	public BigDecimal price() {
		return price;
	}

	public List<String> rows() {
		return rows;
	}

	public List<Integer> blocks() {
		return blocks;
	}

	public int seatsPerRow() {
		return blocks.stream().mapToInt(Integer::intValue).sum();
	}

	public boolean wide() {
		return wide;
	}

}
