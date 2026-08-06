package com.satyansh.gogetthetickets.movie;

import java.util.List;

import org.springframework.stereotype.Component;

/** Fixed list of movies and their hall sizes. */
@Component
public class MovieCatalog {

	private final List<Movie> movies = List.of(
			new Movie("inception", "Inception", 5, 8),
			new Movie("dune", "Dune: Part Two", 4, 6));

	public List<Movie> all() {
		return movies;
	}

	public Movie get(String id) {
		return movies.stream()
				.filter(m -> m.id().equals(id))
				.findFirst()
				.orElseThrow(() -> new MovieNotFoundException(id));
	}

}
