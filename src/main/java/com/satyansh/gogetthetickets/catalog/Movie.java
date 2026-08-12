package com.satyansh.gogetthetickets.catalog;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.satyansh.gogetthetickets.common.StringListConverter;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

@Entity
@Table(name = "movies")
public class Movie {

	@Id
	private String id;

	private String title;

	private String certificate;

	@Column(name = "runtime_minutes")
	private int runtimeMinutes;

	@Convert(converter = StringListConverter.class)
	private List<String> genres;

	/** First language is the original; the rest are dubs. */
	@Convert(converter = StringListConverter.class)
	private List<String> languages;

	@Convert(converter = StringListConverter.class)
	private List<String> formats;

	@Column(name = "release_date")
	private LocalDate releaseDate;

	@Enumerated(EnumType.STRING)
	private MovieStatus status;

	private BigDecimal rating;

	/** Rating count, or "interested" count before release, pre-formatted like "48.2K". */
	private String votes;

	private String synopsis;

	@Column(name = "trailer_url")
	private String trailerUrl;

	@Column(name = "poster_url")
	private String posterUrl;

	@Column(name = "backdrop_url")
	private String backdropUrl;

	/** Position in the home carousel; null when not featured. */
	@Column(name = "featured_rank")
	private Integer featuredRank;

	// Parameters for the generated poster art the UI draws when there's no poster image.
	@Column(name = "art_motif")
	private String artMotif;

	@Column(name = "art_kicker")
	private String artKicker;

	@Column(name = "art_poster_lines")
	@Convert(converter = StringListConverter.class)
	private List<String> artPosterLines;

	@Column(name = "art_palette")
	@Convert(converter = StringListConverter.class)
	private List<String> artPalette;

	@OneToMany(fetch = FetchType.LAZY)
	@JoinColumn(name = "movie_id")
	@OrderBy("position")
	private List<CastMember> cast;

	protected Movie() {
	}

	public String getId() {
		return id;
	}

	public String getTitle() {
		return title;
	}

	public String getCertificate() {
		return certificate;
	}

	public int getRuntimeMinutes() {
		return runtimeMinutes;
	}

	public List<String> getGenres() {
		return genres;
	}

	public List<String> getLanguages() {
		return languages;
	}

	public List<String> getFormats() {
		return formats;
	}

	public LocalDate getReleaseDate() {
		return releaseDate;
	}

	public MovieStatus getStatus() {
		return status;
	}

	public BigDecimal getRating() {
		return rating;
	}

	public String getVotes() {
		return votes;
	}

	public String getSynopsis() {
		return synopsis;
	}

	public String getTrailerUrl() {
		return trailerUrl;
	}

	public String getPosterUrl() {
		return posterUrl;
	}

	public String getBackdropUrl() {
		return backdropUrl;
	}

	public Integer getFeaturedRank() {
		return featuredRank;
	}

	public String getArtMotif() {
		return artMotif;
	}

	public String getArtKicker() {
		return artKicker;
	}

	public List<String> getArtPosterLines() {
		return artPosterLines;
	}

	public List<String> getArtPalette() {
		return artPalette;
	}

	public List<CastMember> getCast() {
		return cast;
	}

}
