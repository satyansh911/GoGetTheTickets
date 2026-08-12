package com.satyansh.gogetthetickets.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "cast_members")
public class CastMember {

	@Id
	private Long id;

	private int position;

	private String name;

	private String role;

	/** Crew (director, music, ...) rather than on-screen cast. */
	private boolean crew;

	@Column(name = "photo_url")
	private String photoUrl;

	protected CastMember() {
	}

	public String getName() {
		return name;
	}

	public String getRole() {
		return role;
	}

	public boolean isCrew() {
		return crew;
	}

	public String getPhotoUrl() {
		return photoUrl;
	}

}
