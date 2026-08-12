package com.satyansh.gogetthetickets.catalog.dto;

import java.util.List;

import com.satyansh.gogetthetickets.catalog.Cinema;

public record CinemaResponse(long id, String name, String chain, String area, String cityId, double distanceKm,
		List<String> amenities) {

	public static CinemaResponse from(Cinema c) {
		return new CinemaResponse(c.getId(), c.getName(), c.getChain(), c.getArea(), c.getCityId(),
				c.getDistanceKm().doubleValue(), c.getAmenities());
	}

}
