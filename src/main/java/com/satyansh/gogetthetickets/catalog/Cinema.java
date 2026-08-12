package com.satyansh.gogetthetickets.catalog;

import java.math.BigDecimal;
import java.util.List;

import com.satyansh.gogetthetickets.common.StringListConverter;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "cinemas")
public class Cinema {

	@Id
	private Long id;

	@Column(name = "city_id")
	private String cityId;

	private String name;

	private String chain;

	private String area;

	@Column(name = "distance_km")
	private BigDecimal distanceKm;

	/** Any of: parking, food, wheelchair. */
	@Convert(converter = StringListConverter.class)
	private List<String> amenities;

	/** Projection formats its screens support: 2D, 3D, IMAX, 4DX. */
	@Convert(converter = StringListConverter.class)
	private List<String> formats;

	private int screens;

	protected Cinema() {
	}

	public Long getId() {
		return id;
	}

	public String getCityId() {
		return cityId;
	}

	public String getName() {
		return name;
	}

	public String getChain() {
		return chain;
	}

	public String getArea() {
		return area;
	}

	public BigDecimal getDistanceKm() {
		return distanceKm;
	}

	public List<String> getAmenities() {
		return amenities;
	}

	public List<String> getFormats() {
		return formats;
	}

	public int getScreens() {
		return screens;
	}

}
