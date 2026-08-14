package com.satyansh.gogetthetickets.booking;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.satyansh.gogetthetickets.show.Show;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "bookings")
public class Booking {

	/** Public booking code shown on the ticket, e.g. GGT7K3X9QM. */
	@Id
	private String id;

	private Long userId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "show_id")
	private Show show;

	@Enumerated(EnumType.STRING)
	private BookingStatus status;

	private Instant holdExpiresAt;

	private BigDecimal ticketsAmount;

	private BigDecimal fnbAmount;

	private BigDecimal convenienceFee;

	private BigDecimal gst;

	private BigDecimal discount;

	private BigDecimal total;

	private String couponCode;

	private String email;

	private Instant createdAt;

	private Instant confirmedAt;

	private Instant cancelledAt;

	@ElementCollection(fetch = FetchType.EAGER)
	@CollectionTable(name = "booking_seats", joinColumns = @JoinColumn(name = "booking_id"))
	private Set<BookingSeat> seats = new HashSet<>();

	@ElementCollection(fetch = FetchType.EAGER)
	@CollectionTable(name = "booking_items", joinColumns = @JoinColumn(name = "booking_id"))
	private Set<BookingItem> items = new HashSet<>();

	protected Booking() {
	}

	public static Booking hold(String id, long userId, Show show, List<BookingSeat> seats, Instant now, Instant expiresAt) {
		Booking b = new Booking();
		b.id = id;
		b.userId = userId;
		b.show = show;
		b.status = BookingStatus.HELD;
		b.seats.addAll(seats);
		b.createdAt = now;
		b.holdExpiresAt = expiresAt;
		return b;
	}

	public boolean isActiveHold(Instant now) {
		return status == BookingStatus.HELD && holdExpiresAt != null && holdExpiresAt.isAfter(now);
	}

	/** The status the user should see: a HELD booking past its timer is expired even before the cleanup job runs. */
	public BookingStatus effectiveStatus(Instant now) {
		return status == BookingStatus.HELD && !isActiveHold(now) ? BookingStatus.EXPIRED : status;
	}

	public void replaceItems(List<BookingItem> newItems) {
		items.clear();
		items.addAll(newItems);
	}

	public void applyPrice(Pricing.Quote quote, String couponCode) {
		this.ticketsAmount = quote.tickets();
		this.fnbAmount = quote.fnb();
		this.convenienceFee = quote.convenienceFee();
		this.gst = quote.gst();
		this.discount = quote.discount();
		this.total = quote.total();
		this.couponCode = couponCode;
	}

	public void confirm(Instant now, String email) {
		this.status = BookingStatus.CONFIRMED;
		this.confirmedAt = now;
		this.holdExpiresAt = null;
		this.email = email;
	}

	public void release() {
		this.status = BookingStatus.RELEASED;
		this.holdExpiresAt = null;
	}

	public void cancel(Instant now) {
		this.status = BookingStatus.CANCELLED;
		this.cancelledAt = now;
	}

	/** Tickets and food come back on cancellation; the convenience fee and its GST don't. */
	public BigDecimal refundAmount() {
		return total.subtract(convenienceFee).subtract(gst);
	}

	public List<String> seatIds() {
		return seats.stream().map(BookingSeat::getSeatId).sorted().toList();
	}

	public String getId() {
		return id;
	}

	public Long getUserId() {
		return userId;
	}

	public Show getShow() {
		return show;
	}

	public BookingStatus getStatus() {
		return status;
	}

	public Instant getHoldExpiresAt() {
		return holdExpiresAt;
	}

	public BigDecimal getTicketsAmount() {
		return ticketsAmount;
	}

	public BigDecimal getFnbAmount() {
		return fnbAmount;
	}

	public BigDecimal getConvenienceFee() {
		return convenienceFee;
	}

	public BigDecimal getGst() {
		return gst;
	}

	public BigDecimal getDiscount() {
		return discount;
	}

	public BigDecimal getTotal() {
		return total;
	}

	public String getCouponCode() {
		return couponCode;
	}

	public String getEmail() {
		return email;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Set<BookingSeat> getSeats() {
		return seats;
	}

	public Set<BookingItem> getItems() {
		return items;
	}

}
