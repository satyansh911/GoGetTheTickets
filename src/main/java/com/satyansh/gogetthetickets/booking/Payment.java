package com.satyansh.gogetthetickets.booking;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One payment attempt, successful or not, kept as a record of what happened. */
@Entity
@Table(name = "payments")
public class Payment {

	public enum Status {
		SUCCEEDED,
		FAILED
	}

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String bookingId;

	private String method;

	@Enumerated(EnumType.STRING)
	private Status status;

	private BigDecimal amount;

	private String failureCode;

	private Instant createdAt;

	protected Payment() {
	}

	public Payment(String bookingId, String method, Status status, BigDecimal amount, String failureCode, Instant createdAt) {
		this.bookingId = bookingId;
		this.method = method;
		this.status = status;
		this.amount = amount;
		this.failureCode = failureCode;
		this.createdAt = createdAt;
	}

	public String getBookingId() {
		return bookingId;
	}

	public Status getStatus() {
		return status;
	}

	public String getFailureCode() {
		return failureCode;
	}

}
