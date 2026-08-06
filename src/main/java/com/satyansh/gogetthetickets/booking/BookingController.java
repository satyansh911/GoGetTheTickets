package com.satyansh.gogetthetickets.booking;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.satyansh.gogetthetickets.booking.dto.HoldResponse;
import com.satyansh.gogetthetickets.booking.dto.SeatResponse;
import com.satyansh.gogetthetickets.booking.dto.SessionResponse;
import com.satyansh.gogetthetickets.booking.dto.UserRequest;

import jakarta.validation.Valid;

@RestController
public class BookingController {

	private final BookingService service;

	public BookingController(BookingService service) {
		this.service = service;
	}

	@GetMapping("/movies/{movieId}/seats")
	public List<SeatResponse> listSeats(@PathVariable String movieId) {
		return service.listBookings(movieId).stream().map(SeatResponse::from).toList();
	}

	@PostMapping("/movies/{movieId}/seats/{seatId}/hold")
	@ResponseStatus(HttpStatus.CREATED)
	public HoldResponse holdSeat(@PathVariable String movieId, @PathVariable String seatId,
			@Valid @RequestBody UserRequest request) {
		return HoldResponse.from(service.hold(movieId, seatId, request.userId()));
	}

	@PutMapping("/sessions/{sessionId}/confirm")
	public SessionResponse confirmSession(@PathVariable String sessionId,
			@Valid @RequestBody UserRequest request) {
		return SessionResponse.from(service.confirm(sessionId, request.userId()));
	}

	@DeleteMapping("/sessions/{sessionId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void releaseSession(@PathVariable String sessionId, @Valid @RequestBody UserRequest request) {
		service.release(sessionId, request.userId());
	}

}
