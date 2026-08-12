package com.satyansh.gogetthetickets.catalog;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "food_items")
public class FoodItem {

	@Id
	private String id;

	private String name;

	@Column(name = "size_label")
	private String sizeLabel;

	private BigDecimal price;

	/** Illustration key the UI draws. */
	private String art;

	/** Optional badge, e.g. "Bestseller". */
	private String tag;

	@Column(name = "sort_order")
	private int sortOrder;

	protected FoodItem() {
	}

	public String getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public String getSizeLabel() {
		return sizeLabel;
	}

	public BigDecimal getPrice() {
		return price;
	}

	public String getArt() {
		return art;
	}

	public String getTag() {
		return tag;
	}

}
