package com.satyansh.gogetthetickets.catalog.dto;

import java.math.BigDecimal;

import com.satyansh.gogetthetickets.catalog.FoodItem;

public record FoodItemResponse(String id, String name, String size, BigDecimal price, String art, String tag) {

	public static FoodItemResponse from(FoodItem f) {
		return new FoodItemResponse(f.getId(), f.getName(), f.getSizeLabel(), f.getPrice(), f.getArt(), f.getTag());
	}

}
