package com.satyansh.gogetthetickets.booking;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

/** One sold seat of one show. The (show, seat) primary key is what makes a double sale impossible. */
@Entity
@Table(name = "booked_seats")
@IdClass(BookedSeat.Key.class)
public class BookedSeat {

	@Id
	private Long showId;

	@Id
	private String seatId;

	private String bookingId;

	protected BookedSeat() {
	}

	public String getSeatId() {
		return seatId;
	}

	public static class Key implements Serializable {

		private Long showId;
		private String seatId;

		public Key() {
		}

		@Override
		public boolean equals(Object o) {
			return o instanceof Key k && Objects.equals(showId, k.showId) && Objects.equals(seatId, k.seatId);
		}

		@Override
		public int hashCode() {
			return Objects.hash(showId, seatId);
		}

	}

}
