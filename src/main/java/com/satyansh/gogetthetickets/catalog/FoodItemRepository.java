package com.satyansh.gogetthetickets.catalog;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FoodItemRepository extends JpaRepository<FoodItem, String> {

	List<FoodItem> findAllByOrderBySortOrder();

}
