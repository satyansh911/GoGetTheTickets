package com.satyansh.gogetthetickets.show;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

import com.satyansh.gogetthetickets.catalog.Cinema;
import com.satyansh.gogetthetickets.catalog.Movie;
import com.satyansh.gogetthetickets.common.AppTime;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "shows")
public class Show {

	@Id
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "movie_id")
	private Movie movie;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "cinema_id")
	private Cinema cinema;

	/** Auditorium name, e.g. "Audi 3". */
	private String screen;

	private Instant startsAt;

	/** Calendar date of the show in IST (denormalised from startsAt for date queries). */
	private LocalDate showDate;

	private String language;

	private String format;

	protected Show() {
	}

	public Long getId() {
		return id;
	}

	public Movie getMovie() {
		return movie;
	}

	public Cinema getCinema() {
		return cinema;
	}

	public String getScreen() {
		return screen;
	}

	public Instant getStartsAt() {
		return startsAt;
	}

	public LocalDate getShowDate() {
		return showDate;
	}

	public LocalTime getLocalStartTime() {
		return startsAt.atZone(AppTime.ZONE).toLocalTime();
	}

	public String getLanguage() {
		return language;
	}

	public String getFormat() {
		return format;
	}

}
