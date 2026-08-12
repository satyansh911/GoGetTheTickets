package com.satyansh.gogetthetickets.catalog.dto;

import java.time.LocalDate;
import java.util.List;

import com.satyansh.gogetthetickets.catalog.Movie;

/**
 * @param art    inputs for the generated poster/backdrop art, used when there's no image URL
 * @param cast   only on the details endpoint; null in lists
 */
public record MovieResponse(
		String id,
		String title,
		String certificate,
		int runtimeMinutes,
		List<String> genres,
		List<String> languages,
		List<String> formats,
		LocalDate releaseDate,
		String status,
		Double rating,
		String votes,
		String synopsis,
		String trailerUrl,
		String posterUrl,
		String backdropUrl,
		Integer featuredRank,
		Art art,
		List<CastResponse> cast) {

	public record Art(String motif, String kicker, List<String> posterLines, Palette palette) {
	}

	public record Palette(String a, String b, String c) {
	}

	public record CastResponse(String name, String role, boolean crew, String photoUrl) {
	}

	public static MovieResponse summary(Movie m) {
		return of(m, null);
	}

	public static MovieResponse withCast(Movie m) {
		return of(m, m.getCast().stream().map(c -> new CastResponse(c.getName(), c.getRole(), c.isCrew(), c.getPhotoUrl())).toList());
	}

	private static MovieResponse of(Movie m, List<CastResponse> cast) {
		List<String> p = m.getArtPalette();
		Art art = new Art(m.getArtMotif(), m.getArtKicker(), m.getArtPosterLines(), new Palette(p.get(0), p.get(1), p.get(2)));
		return new MovieResponse(m.getId(), m.getTitle(), m.getCertificate(), m.getRuntimeMinutes(), m.getGenres(),
				m.getLanguages(), m.getFormats(), m.getReleaseDate(), m.getStatus().name(),
				m.getRating() == null ? null : m.getRating().doubleValue(), m.getVotes(), m.getSynopsis(),
				m.getTrailerUrl(), m.getPosterUrl(), m.getBackdropUrl(), m.getFeaturedRank(), art, cast);
	}

}
