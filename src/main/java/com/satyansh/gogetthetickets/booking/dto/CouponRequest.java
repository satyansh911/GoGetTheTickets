package com.satyansh.gogetthetickets.booking.dto;

import jakarta.validation.constraints.NotBlank;

public record CouponRequest(@NotBlank(message = "Enter a coupon code") String code) {
}
