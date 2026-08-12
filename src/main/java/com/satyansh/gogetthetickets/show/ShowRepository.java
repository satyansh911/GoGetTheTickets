package com.satyansh.gogetthetickets.show;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ShowRepository extends JpaRepository<Show, Long> {

	@EntityGraph(attributePaths = { "movie", "cinema" })
	Optional<Show> findWithDetailsById(Long id);

	/** Upcoming shows of a movie in a city on one date, nearest cinema first. */
	@Query("""
			select s from Show s join fetch s.cinema c
			where s.movie.id = :movieId and c.cityId = :cityId and s.showDate = :date and s.startsAt > :after
			order by c.distanceKm, c.id, s.startsAt""")
	List<Show> findForMovieInCity(String movieId, String cityId, LocalDate date, Instant after);

	@Query("""
			select distinct s.showDate from Show s
			where s.movie.id = :movieId and s.cinema.cityId = :cityId
			  and s.showDate between :from and :to and s.startsAt > :after""")
	List<LocalDate> findDatesWithShows(String movieId, String cityId, LocalDate from, LocalDate to, Instant after);

	/** The same movie at the same cinema on the same day, for the showtime switcher on the seat page. */
	@Query("""
			select s from Show s
			where s.movie.id = :movieId and s.cinema.id = :cinemaId and s.showDate = :date and s.startsAt > :after
			order by s.startsAt""")
	List<Show> findSiblings(String movieId, Long cinemaId, LocalDate date, Instant after);

	@Query("select distinct s.showDate from Show s where s.showDate between :from and :to")
	List<LocalDate> findScheduledDates(LocalDate from, LocalDate to);

}
