package com.satyansh.gogetthetickets.catalog.dto;

import com.satyansh.gogetthetickets.catalog.City;

public record CityResponse(String id, String name, String icon, boolean popular) {

	public static CityResponse from(City c) {
		return new CityResponse(c.getId(), c.getName(), c.getIcon(), c.isPopular());
	}

}
