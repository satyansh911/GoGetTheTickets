package com.satyansh.gogetthetickets.movie;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MovieController {

	private final MovieCatalog catalog;

	public MovieController(MovieCatalog catalog) {
		this.catalog = catalog;
	}

	@GetMapping("/movies")
	public List<Movie> listMovies() {
		return catalog.all();
	}

}
