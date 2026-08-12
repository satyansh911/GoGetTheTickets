package com.satyansh.gogetthetickets.catalog;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CinemaRepository extends JpaRepository<Cinema, Long> {

	@Query("""
			select c from Cinema c
			where c.cityId = :cityId
			  and (lower(c.name) like lower(concat('%', :q, '%')) or lower(c.area) like lower(concat('%', :q, '%')))
			order by c.distanceKm""")
	List<Cinema> search(String cityId, String q);

}
