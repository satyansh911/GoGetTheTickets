package com.satyansh.gogetthetickets.booking;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponRepository extends JpaRepository<Coupon, String> {

	List<Coupon> findByActiveTrueOrderByCode();

	Optional<Coupon> findByCodeAndActiveTrue(String code);

}
