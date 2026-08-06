package com.satyansh.gogetthetickets.booking;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum BookingStatus {
	@JsonProperty("held")
	HELD,

	@JsonProperty("confirmed")
	CONFIRMED
}
