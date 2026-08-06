package com.satyansh.gogetthetickets.common;

/** Error body shape the frontend expects: {@code {"error": "..."}}. */
public record ApiError(String error) {
}
