package com.satyansh.gogetthetickets.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "cities")
public class City {

	@Id
	private String id;

	private String name;

	/** Landmark glyph name for popular-city tiles; null for the rest. */
	private String icon;

	private boolean popular;

	@Column(name = "sort_order")
	private int sortOrder;

	protected City() {
	}

	public String getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public String getIcon() {
		return icon;
	}

	public boolean isPopular() {
		return popular;
	}

}
