package com.satyansh.gogetthetickets.catalog;

import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.satyansh.gogetthetickets.booking.CouponRepository;
import com.satyansh.gogetthetickets.catalog.dto.CinemaResponse;
import com.satyansh.gogetthetickets.catalog.dto.CityResponse;
import com.satyansh.gogetthetickets.catalog.dto.FoodItemResponse;
import com.satyansh.gogetthetickets.catalog.dto.MovieResponse;
import com.satyansh.gogetthetickets.common.NotFoundException;

/** Read-only catalog: cities, movies, food menu, offers and search. */
@RestController
@RequestMapping("/api")
public class CatalogController {

	private final CityRepository cities;
	private final MovieRepository movies;
	private final CinemaRepository cinemas;
	private final FoodItemRepository food;
	private final CouponRepository coupons;

	public CatalogController(CityRepository cities, MovieRepository movies, CinemaRepository cinemas,
			FoodItemRepository food, CouponRepository coupons) {
		this.cities = cities;
		this.movies = movies;
		this.cinemas = cinemas;
		this.food = food;
		this.coupons = coupons;
	}

	@GetMapping("/cities")
	public List<CityResponse> cities() {
		return cities.findAllByOrderBySortOrderAscNameAsc().stream().map(CityResponse::from).toList();
	}

	@GetMapping("/movies")
	public List<MovieResponse> movies() {
		return movies.findAllByOrderByReleaseDateDesc().stream().map(MovieResponse::summary).toList();
	}

	@GetMapping("/movies/{id}")
	public MovieResponse movie(@PathVariable String id) {
		return movies.findWithCastById(id).map(MovieResponse::withCast).orElseThrow(() -> new NotFoundException("Movie"));
	}

	@GetMapping("/food")
	public List<FoodItemResponse> food() {
		return food.findAllByOrderBySortOrder().stream().map(FoodItemResponse::from).toList();
	}

	public record OfferResponse(String code, String label) {
	}

	@GetMapping("/offers")
	public List<OfferResponse> offers() {
		return coupons.findByActiveTrueOrderByCode().stream().map(c -> new OfferResponse(c.getCode(), c.getLabel())).toList();
	}

	public record SearchResponse(List<MovieResponse> movies, List<CinemaResponse> cinemas) {
	}

	/** Matches movies by title, genre, language, format or cast, and cinemas in the city by name or area. */
	@GetMapping("/search")
	public SearchResponse search(@RequestParam String q, @RequestParam(defaultValue = "mumbai") String city) {
		String needle = q.trim().toLowerCase(Locale.ROOT);
		if (needle.isEmpty()) {
			return new SearchResponse(List.of(), List.of());
		}
		List<MovieResponse> movieHits = movies.findAllWithCastBy().stream()
				.filter(m -> Stream.of(Stream.of(m.getTitle()), m.getGenres().stream(), m.getLanguages().stream(),
						m.getFormats().stream(), m.getCast().stream().map(CastMember::getName))
						.flatMap(s -> s)
						.anyMatch(text -> text.toLowerCase(Locale.ROOT).contains(needle)))
				.map(MovieResponse::summary)
				.toList();
		List<CinemaResponse> cinemaHits = cinemas.search(city, needle).stream().limit(10).map(CinemaResponse::from).toList();
		return new SearchResponse(movieHits, cinemaHits);
	}

}
