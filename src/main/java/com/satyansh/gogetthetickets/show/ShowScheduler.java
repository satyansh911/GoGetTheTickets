package com.satyansh.gogetthetickets.show;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.satyansh.gogetthetickets.catalog.Cinema;
import com.satyansh.gogetthetickets.catalog.CinemaRepository;
import com.satyansh.gogetthetickets.catalog.Movie;
import com.satyansh.gogetthetickets.catalog.MovieRepository;
import com.satyansh.gogetthetickets.catalog.MovieStatus;
import com.satyansh.gogetthetickets.common.AppTime;

/**
 * Keeps a rolling week of showtimes. On startup and every night it fills in any of the next
 * seven days that have no shows yet, so the schedule is always bookable.
 *
 * Each screen is packed like a real one: first show around 9 AM, then back to back with
 * 20–35 minutes for cleaning, last start by 11:45 PM. Generation is seeded by cinema, date and
 * screen, so re-running it produces the same schedule, and the unique key on
 * (cinema, screen, start) makes a concurrent run from a second instance harmless.
 */
@Component
public class ShowScheduler {

	private static final Logger log = LoggerFactory.getLogger(ShowScheduler.class);
	private static final int DAYS_AHEAD = 7;
	private static final LocalTime FIRST_SHOW = LocalTime.of(9, 0);
	private static final LocalTime LAST_START = LocalTime.of(23, 45);

	private final MovieRepository movies;
	private final CinemaRepository cinemas;
	private final ShowRepository shows;
	private final JdbcTemplate jdbc;
	private final Clock clock;
	private final boolean enabled;

	public ShowScheduler(MovieRepository movies, CinemaRepository cinemas, ShowRepository shows, JdbcTemplate jdbc,
			Clock clock, @Value("${shows.scheduler.enabled:true}") boolean enabled) {
		this.movies = movies;
		this.cinemas = cinemas;
		this.shows = shows;
		this.jdbc = jdbc;
		this.clock = clock;
		this.enabled = enabled;
	}

	@EventListener(ApplicationReadyEvent.class)
	public void onStartup() {
		if (enabled) {
			ensureUpcomingShows();
		}
	}

	@Scheduled(cron = "0 5 0 * * *", zone = "Asia/Kolkata")
	public void nightly() {
		if (enabled) {
			ensureUpcomingShows();
		}
	}

	/** Returns how many shows were created. */
	@Transactional
	public int ensureUpcomingShows() {
		LocalDate today = AppTime.today(clock);
		Set<LocalDate> scheduled = new HashSet<>(shows.findScheduledDates(today, today.plusDays(DAYS_AHEAD - 1)));
		List<Movie> nowShowing = movies.findByStatus(MovieStatus.NOW_SHOWING);
		List<Cinema> allCinemas = cinemas.findAll();

		int created = 0;
		for (int d = 0; d < DAYS_AHEAD; d++) {
			LocalDate date = today.plusDays(d);
			if (scheduled.contains(date)) {
				continue;
			}
			List<Object[]> rows = new ArrayList<>();
			for (Cinema cinema : allCinemas) {
				rows.addAll(scheduleCinema(cinema, date, nowShowing));
			}
			jdbc.batchUpdate("""
					insert into shows (movie_id, cinema_id, screen, starts_at, show_date, language, format)
					values (?, ?, ?, ?, ?, ?, ?)
					on conflict (cinema_id, screen, starts_at) do nothing""", rows);
			created += rows.size();
		}
		if (created > 0) {
			log.info("Scheduled {} shows up to {}", created, today.plusDays(DAYS_AHEAD - 1));
		}
		return created;
	}

	private List<Object[]> scheduleCinema(Cinema cinema, LocalDate date, List<Movie> nowShowing) {
		List<Object[]> rows = new ArrayList<>();
		List<String> screenFormats = screenFormats(cinema);
		for (int s = 0; s < screenFormats.size(); s++) {
			String format = screenFormats.get(s);
			List<Movie> eligible = nowShowing.stream().filter(m -> m.getFormats().contains(format)).toList();
			if (eligible.isEmpty()) {
				continue;
			}
			Random rng = new Random(cinema.getId() * 7919L + date.toEpochDay() * 31L + s);
			LocalTime time = FIRST_SHOW.plusMinutes(5L * rng.nextInt(13));
			while (!time.isAfter(LAST_START)) {
				Movie movie = eligible.get(rng.nextInt(eligible.size()));
				List<String> langs = movie.getLanguages();
				String language = rng.nextDouble() < 0.6 ? langs.get(0) : langs.get(rng.nextInt(langs.size()));
				Timestamp startsAt = Timestamp.from(date.atTime(time).atZone(AppTime.ZONE).toInstant());
				rows.add(new Object[] { movie.getId(), cinema.getId(), "Audi " + (s + 1), startsAt, Date.valueOf(date), language, format });

				int gap = movie.getRuntimeMinutes() + 20 + rng.nextInt(16);
				int rounded = (gap + 4) / 5 * 5;
				LocalTime next = time.plusMinutes(rounded);
				if (next.isBefore(time)) {
					break; // wrapped past midnight
				}
				time = next;
			}
		}
		return rows;
	}

	/** Premium formats get one screen each; every other screen is 2D. */
	private static List<String> screenFormats(Cinema cinema) {
		List<String> formats = new ArrayList<>();
		for (String premium : List.of("IMAX", "4DX", "3D")) {
			if (cinema.getFormats().contains(premium) && formats.size() < cinema.getScreens() - 1) {
				formats.add(premium);
			}
		}
		while (formats.size() < cinema.getScreens()) {
			formats.add("2D");
		}
		return formats;
	}

}
