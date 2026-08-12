package com.satyansh.gogetthetickets.catalog;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MovieRepository extends JpaRepository<Movie, String> {

	List<Movie> findAllByOrderByReleaseDateDesc();

	List<Movie> findByStatus(MovieStatus status);

	@EntityGraph(attributePaths = "cast")
	Optional<Movie> findWithCastById(String id);

	@EntityGraph(attributePaths = "cast")
	List<Movie> findAllWithCastBy();

}
