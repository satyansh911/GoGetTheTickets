package com.satyansh.gogetthetickets.show;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.satyansh.gogetthetickets.booking.SeatInventory;
import com.satyansh.gogetthetickets.booking.SeatInventory.SeatStatus;
import com.satyansh.gogetthetickets.catalog.Cinema;
import com.satyansh.gogetthetickets.catalog.MovieRepository;
import com.satyansh.gogetthetickets.catalog.dto.CinemaResponse;
import com.satyansh.gogetthetickets.catalog.dto.MovieResponse;
import com.satyansh.gogetthetickets.common.AppTime;
import com.satyansh.gogetthetickets.common.NotFoundException;
import com.satyansh.gogetthetickets.show.dto.SeatMapResponse;
import com.satyansh.gogetthetickets.show.dto.ShowDetailsResponse;
import com.satyansh.gogetthetickets.show.dto.ShowDetailsResponse.TierResponse;
import com.satyansh.gogetthetickets.show.dto.ShowSummary;
import com.satyansh.gogetthetickets.show.dto.ShowtimesResponse;
import com.satyansh.gogetthetickets.show.dto.ShowtimesResponse.CinemaShowtimes;
import com.satyansh.gogetthetickets.show.dto.ShowtimesResponse.DateOption;

@Service
public class ShowService {

	private static final int DAYS = 7;

	private final ShowRepository shows;
	private final MovieRepository movies;
	private final SeatInventory inventory;
	private final Clock clock;

	public ShowService(ShowRepository shows, MovieRepository movies, SeatInventory inventory, Clock clock) {
		this.shows = shows;
		this.movies = movies;
		this.inventory = inventory;
		this.clock = clock;
	}

	/** A movie's upcoming shows in a city on one day. With no date, the first day that has shows. */
	@Transactional(readOnly = true)
	public ShowtimesResponse showtimes(String movieId, String cityId, LocalDate date) {
		if (!movies.existsById(movieId)) {
			throw new NotFoundException("Movie");
		}
		LocalDate today = AppTime.today(clock);
		Instant now = clock.instant();
		Set<LocalDate> withShows = new HashSet<>(shows.findDatesWithShows(movieId, cityId, today, today.plusDays(DAYS - 1), now));

		List<DateOption> dates = new ArrayList<>();
		for (int i = 0; i < DAYS; i++) {
			LocalDate d = today.plusDays(i);
			dates.add(new DateOption(d, withShows.contains(d)));
		}
		LocalDate day = date != null ? date
				: dates.stream().filter(DateOption::hasShows).map(DateOption::date).findFirst().orElse(today);

		List<Show> list = shows.findForMovieInCity(movieId, cityId, day, now);
		Map<Long, Integer> sold = inventory.soldCounts(list.stream().map(Show::getId).toList());
		Map<Long, CinemaShowtimes> byCinema = new LinkedHashMap<>();
		for (Show s : list) {
			Cinema c = s.getCinema();
			byCinema.computeIfAbsent(c.getId(), id -> new CinemaShowtimes(CinemaResponse.from(c), new ArrayList<>()))
					.shows().add(ShowSummary.from(s, sold.get(s.getId())));
		}
		return new ShowtimesResponse(dates, day, List.copyOf(byCinema.values()));
	}

	@Transactional(readOnly = true)
	public ShowDetailsResponse details(long showId, Long viewerId) {
		Show show = find(showId);
		Map<String, SeatStatus> statuses = inventory.statuses(showId, viewerId);

		List<TierResponse> tiers = new ArrayList<>();
		for (SeatTier tier : SeatTier.values()) {
			List<SeatLayout.Seat> seats = SeatLayout.seats().stream().filter(s -> s.tier() == tier).toList();
			int free = (int) seats.stream().filter(s -> statuses.get(s.id()) == SeatStatus.AVAILABLE).count();
			tiers.add(new TierResponse(tier.name(), tier.label(), tier.price(), tier.rows(), tier.blocks(), tier.wide(), seats.size(), free));
		}
		int sold = (int) statuses.values().stream().filter(s -> s == SeatStatus.BOOKED).count();

		List<Show> siblings = shows.findSiblings(show.getMovie().getId(), show.getCinema().getId(), show.getShowDate(), clock.instant());
		Map<Long, Integer> siblingSold = inventory.soldCounts(siblings.stream().map(Show::getId).toList());
		List<ShowSummary> others = siblings.stream().map(s -> ShowSummary.from(s, siblingSold.get(s.getId()))).toList();

		ShowSummary self = ShowSummary.from(show, sold);
		return new ShowDetailsResponse(show.getId(), MovieResponse.summary(show.getMovie()), CinemaResponse.from(show.getCinema()),
				show.getScreen(), show.getShowDate(), self.startTime(), show.getStartsAt(), show.getLanguage(), show.getFormat(),
				self.availability(), tiers, others);
	}

	@Transactional(readOnly = true)
	public SeatMapResponse seatMap(long showId, Long viewerId) {
		find(showId);
		Map<String, SeatStatus> statuses = inventory.statuses(showId, viewerId);
		Map<String, SeatMapResponse.Row> rows = new LinkedHashMap<>();
		for (SeatLayout.Seat seat : SeatLayout.seats()) {
			rows.computeIfAbsent(seat.row(), r -> new SeatMapResponse.Row(r, seat.tier().name(), new ArrayList<>()))
					.seats().add(new SeatMapResponse.Seat(seat.id(), seat.row(), seat.number(), seat.tier().name(),
							seat.tier().price(), statuses.get(seat.id()).name(), seat.wheelchair()));
		}
		return new SeatMapResponse(showId, List.copyOf(rows.values()));
	}

	private Show find(long showId) {
		return shows.findWithDetailsById(showId).orElseThrow(() -> new NotFoundException("Show"));
	}

}
