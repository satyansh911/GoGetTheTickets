package com.satyansh.gogetthetickets.booking;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.satyansh.gogetthetickets.auth.SecurityConfig;
import com.satyansh.gogetthetickets.booking.dto.BookingResponse;
import com.satyansh.gogetthetickets.catalog.dto.MovieResponse;

/** The HTTP contract: auth, status codes and error bodies. The service is mocked. */
@WebMvcTest(value = BookingController.class, properties = "app.jwt.secret=test-secret-test-secret-test-secret-32")
@Import(SecurityConfig.class)
class BookingControllerTest {

	@Autowired
	private MockMvc mvc;

	@MockitoBean
	private BookingService service;

	@Test
	void holdingSeatsRequiresSignIn() throws Exception {
		mvc.perform(post("/api/shows/42/holds").contentType(MediaType.APPLICATION_JSON).content("{\"seatIds\":[\"C7\"]}"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
	}

	@Test
	void holdUsesTheSignedInUserAndReturns201() throws Exception {
		when(service.hold(eq(7L), eq(42L), any())).thenReturn(sample("HELD"));

		mvc.perform(post("/api/shows/42/holds").with(jwt().jwt(j -> j.subject("7")))
				.contentType(MediaType.APPLICATION_JSON).content("{\"seatIds\":[\"C7\",\"C8\"]}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.bookingId").value("GGTTEST123"))
				.andExpect(jsonPath("$.seats[0].id").value("C7"));
		verify(service).hold(7L, 42L, List.of("C7", "C8"));
	}

	@Test
	void takenSeatsAre409AndNamed() throws Exception {
		when(service.hold(anyLong(), anyLong(), any())).thenThrow(new SeatsUnavailableException(List.of("C8")));

		mvc.perform(post("/api/shows/42/holds").with(jwt().jwt(j -> j.subject("7")))
				.contentType(MediaType.APPLICATION_JSON).content("{\"seatIds\":[\"C7\",\"C8\"]}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("SEATS_UNAVAILABLE"))
				.andExpect(jsonPath("$.error").value("Seat C8 was just taken by someone else"))
				.andExpect(jsonPath("$.details.seats[0]").value("C8"));
	}

	@Test
	void tooManySeatsIsAValidationError() throws Exception {
		mvc.perform(post("/api/shows/42/holds").with(jwt().jwt(j -> j.subject("7")))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"seatIds\":[\"A1\",\"A2\",\"A3\",\"A4\",\"A5\",\"A6\",\"A7\",\"A8\",\"A9\",\"A10\",\"A11\"]}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.fields.seatIds").value("You can book up to 10 seats at a time"));
	}

	@Test
	void paymentNeedsAnIdempotencyKey() throws Exception {
		mvc.perform(post("/api/bookings/GGTTEST123/payments").with(jwt().jwt(j -> j.subject("7")))
				.contentType(MediaType.APPLICATION_JSON).content(upiPayment()))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("IDEMPOTENCY_KEY_REQUIRED"));
	}

	@Test
	void declinedPaymentIs402AndStillReturnsTheBooking() throws Exception {
		when(service.pay(eq(7L), eq("GGTTEST123"), eq("k1"), any()))
				.thenReturn(new BookingService.PaymentOutcome(sample("HELD"), false, "DEMO_DECLINED"));

		mvc.perform(post("/api/bookings/GGTTEST123/payments").with(jwt().jwt(j -> j.subject("7")))
				.header("Idempotency-Key", "k1").contentType(MediaType.APPLICATION_JSON).content(upiPayment()))
				.andExpect(status().isPaymentRequired())
				.andExpect(jsonPath("$.code").value("PAYMENT_DECLINED"))
				.andExpect(jsonPath("$.details.status").value("HELD"));
	}

	@Test
	void bookingsListIsPrivate() throws Exception {
		mvc.perform(get("/api/bookings")).andExpect(status().isUnauthorized());
	}

	private static String upiPayment() {
		return "{\"method\":\"UPI\",\"email\":\"fan@example.com\",\"upiId\":\"fan@okbank\"}";
	}

	private static BookingResponse sample(String status) {
		MovieResponse movie = new MovieResponse("orbit-of-ashes", "Orbit of Ashes", "UA", 162, List.of("Sci-Fi"), List.of("English"),
				List.of("IMAX"), LocalDate.of(2026, 9, 18), "NOW_SHOWING", 9.1, "61.5K", "...", null, null, null, 1,
				new MovieResponse.Art("orbit", "IN IMAX", List.of("Orbit of", "Ashes"), new MovieResponse.Palette("#000", "#111", "#fff")), null);
		return new BookingResponse("GGTTEST123", status, 42, movie, "Orion Multiplex: Lakeside", "Powai", "mumbai", "Audi 3",
				LocalDate.of(2026, 9, 29), "19:40", Instant.parse("2026-09-29T14:10:00Z"), "English", "IMAX",
				List.of(new BookingResponse.SeatLine("C7", "C", 7, "CLASSIC", BigDecimal.valueOf(180)),
						new BookingResponse.SeatLine("C8", "C", 8, "CLASSIC", BigDecimal.valueOf(180))),
				List.of(), BigDecimal.valueOf(360), BigDecimal.ZERO, BigDecimal.valueOf(360), BigDecimal.valueOf(60),
				new BigDecimal("10.80"), BigDecimal.ZERO, new BigDecimal("430.80"), null, null, null,
				Instant.parse("2026-09-29T13:00:00Z"), null, "ggt://ticket/GGTTEST123", BigDecimal.valueOf(360), false,
				Instant.parse("2026-09-29T12:50:00Z"));
	}

}
