package com.satyansh.gogetthetickets.booking;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface BookedSeatRepository extends JpaRepository<BookedSeat, BookedSeat.Key> {

	/**
	 * A plain INSERT on purpose. {@code save()} would merge, and a merge of an existing row
	 * turns into an UPDATE, silently handing an already-sold seat to a second booking.
	 * An INSERT fails on the primary key instead.
	 */
	@Modifying
	@Query(value = "insert into booked_seats (show_id, seat_id, booking_id) values (:showId, :seatId, :bookingId)", nativeQuery = true)
	void insert(long showId, String seatId, String bookingId);

	@Modifying
	@Query("delete from BookedSeat b where b.bookingId = :bookingId")
	int deleteByBooking(String bookingId);

	@Query("select b.seatId from BookedSeat b where b.showId = :showId")
	List<String> findSeatIds(long showId);

	@Query("select b.seatId from BookedSeat b where b.showId = :showId and b.seatId in :seatIds")
	List<String> findSeatIdsAmong(long showId, Collection<String> seatIds);

	interface ShowCount {
		Long getShowId();

		long getBooked();
	}

	@Query("select b.showId as showId, count(b) as booked from BookedSeat b where b.showId in :showIds group by b.showId")
	List<ShowCount> countByShow(Collection<Long> showIds);

}
