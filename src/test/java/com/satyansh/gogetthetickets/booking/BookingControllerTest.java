package com.satyansh.gogetthetickets.booking;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/** HTTP layer: routing, JSON shape and status codes. The service is mocked. */
@WebMvcTest(BookingController.class)
class BookingControllerTest {

	private static final String ALICE = """
			{"user_id": "alice"}""";

	@Autowired
	private MockMvc mvc;

	@MockitoBean
	private BookingService service;

	@Test
	void holdReturns201WithSnakeCaseSession() throws Exception {
		when(service.hold("inception", "A1", "alice")).thenReturn(new Booking("s1", "inception", "A1", "alice",
				BookingStatus.HELD, Instant.parse("2026-09-27T10:02:00Z")));

		mvc.perform(post("/movies/inception/seats/A1/hold").contentType(MediaType.APPLICATION_JSON).content(ALICE))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.session_id").value("s1"))
				.andExpect(jsonPath("$.movie_id").value("inception"))
				.andExpect(jsonPath("$.seat_id").value("A1"))
				.andExpect(jsonPath("$.expires_at").value("2026-09-27T10:02:00Z"));
	}

	@Test
	void holdOnTakenSeatReturns409() throws Exception {
		when(service.hold(any(), any(), any())).thenThrow(new SeatUnavailableException("A1"));

		mvc.perform(post("/movies/inception/seats/A1/hold").contentType(MediaType.APPLICATION_JSON).content(ALICE))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.error").value("seat A1 is already taken"));
	}

	@Test
	void blankUserIdReturns400() throws Exception {
		mvc.perform(post("/movies/inception/seats/A1/hold").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"user_id": " "}"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("user_id is required"));
	}

	@Test
	void missingBodyReturns400() throws Exception {
		mvc.perform(post("/movies/inception/seats/A1/hold").contentType(MediaType.APPLICATION_JSON))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").exists());
	}

	@Test
	void nonJsonBodyReturns415NotServerError() throws Exception {
		mvc.perform(post("/movies/inception/seats/A1/hold").contentType(MediaType.APPLICATION_FORM_URLENCODED)
				.content("user_id=alice"))
				.andExpect(status().isUnsupportedMediaType())
				.andExpect(jsonPath("$.error").exists());
	}

	@Test
	void confirmBySomeoneElseReturns403() throws Exception {
		when(service.confirm("s1", "alice")).thenThrow(new NotSessionOwnerException());

		mvc.perform(put("/sessions/s1/confirm").contentType(MediaType.APPLICATION_JSON).content(ALICE))
				.andExpect(status().isForbidden());
	}

	@Test
	void confirmReturnsConfirmedSession() throws Exception {
		when(service.confirm("s1", "alice"))
				.thenReturn(new Booking("s1", "inception", "A1", "alice", BookingStatus.CONFIRMED, null));

		mvc.perform(put("/sessions/s1/confirm").contentType(MediaType.APPLICATION_JSON).content(ALICE))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("confirmed"));
	}

	@Test
	void releaseReturns204() throws Exception {
		mvc.perform(delete("/sessions/s1").contentType(MediaType.APPLICATION_JSON).content(ALICE))
				.andExpect(status().isNoContent());
	}

	@Test
	void releaseOfExpiredSessionReturns404() throws Exception {
		doThrow(new SessionNotFoundException()).when(service).release("s1", "alice");

		mvc.perform(delete("/sessions/s1").contentType(MediaType.APPLICATION_JSON).content(ALICE))
				.andExpect(status().isNotFound());
	}

	@Test
	void listSeatsMarksConfirmedSeats() throws Exception {
		when(service.listBookings("inception")).thenReturn(List.of(
				new Booking("s1", "inception", "A1", "alice", BookingStatus.HELD, Instant.now()),
				new Booking("s2", "inception", "B2", "bob", BookingStatus.CONFIRMED, null)));

		mvc.perform(get("/movies/inception/seats"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].seat_id").value("A1"))
				.andExpect(jsonPath("$[0].booked").value(true))
				.andExpect(jsonPath("$[0].confirmed").value(false))
				.andExpect(jsonPath("$[1].user_id").value("bob"))
				.andExpect(jsonPath("$[1].confirmed").value(true));
	}

}
