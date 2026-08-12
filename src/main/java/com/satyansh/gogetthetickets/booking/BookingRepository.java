package com.satyansh.gogetthetickets.booking;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface BookingRepository extends JpaRepository<Booking, String> {

	@EntityGraph(attributePaths = { "show", "show.movie", "show.cinema" })
	Optional<Booking> findWithShowById(String id);

	@EntityGraph(attributePaths = { "show", "show.movie", "show.cinema" })
	List<Booking> findByUserIdAndStatusIn(Long userId, Collection<BookingStatus> statuses);

	List<Booking> findByUserIdAndShowIdAndStatus(Long userId, Long showId, BookingStatus status);

	long countByUserIdAndStatus(Long userId, BookingStatus status);

	/** Booking IDs of the user's live holds on a show, so their own held seats don't look taken to them. */
	@Query("""
			select b.id from Booking b
			where b.userId = :userId and b.show.id = :showId and b.status = 'HELD' and b.holdExpiresAt > :now""")
	List<String> findActiveHoldIds(Long userId, Long showId, Instant now);

	/** Marks lapsed holds EXPIRED. Their Redis keys have already expired on the same timer. */
	@Modifying
	@Query("update Booking b set b.status = 'EXPIRED' where b.status = 'HELD' and b.holdExpiresAt < :now")
	int expireHolds(Instant now);

}
