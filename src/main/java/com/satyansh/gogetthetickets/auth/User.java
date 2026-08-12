package com.satyansh.gogetthetickets.auth;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String name;

	private String email;

	@Column(name = "password_hash")
	private String passwordHash;

	@Column(name = "created_at")
	private Instant createdAt;

	protected User() {
	}

	public User(String name, String email, String passwordHash, Instant createdAt) {
		this.name = name;
		this.email = email;
		this.passwordHash = passwordHash;
		this.createdAt = createdAt;
	}

	public Long getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public String getEmail() {
		return email;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

}
