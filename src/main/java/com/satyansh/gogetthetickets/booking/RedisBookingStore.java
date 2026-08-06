package com.satyansh.gogetthetickets.booking;

import java.time.Duration;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Repository;

import tools.jackson.databind.json.JsonMapper;

/**
 * Redis-backed {@link BookingStore}.
 *
 * <pre>
 * seat:{movieId}:{seatId}  → sessionId      the lock: whoever set it owns the seat
 * session:{sessionId}      → booking JSON   the details
 * </pre>
 *
 * While a seat is held both keys carry a TTL, so an abandoned checkout frees the seat with no
 * cleanup job. Confirming strips the TTL. Each multi-step write runs as a Lua script, which
 * Redis executes atomically: no other command can run between its steps.
 */
@Repository
public class RedisBookingStore implements BookingStore {

	// SET NX succeeds for exactly one caller, which is what decides a race for the same seat.
	private static final RedisScript<Long> HOLD = RedisScript.of("""
			if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[3]) then
			  redis.call('SET', KEYS[2], ARGV[2], 'PX', ARGV[3])
			  return 1
			end
			return 0
			""", Long.class);

	// Compare-and-set: only confirm if the seat still belongs to this session. Without the
	// check, a hold that expired (and was re-held by someone else) could be overwritten.
	private static final RedisScript<Long> CONFIRM = RedisScript.of("""
			if redis.call('GET', KEYS[1]) ~= ARGV[1] then
			  return 0
			end
			redis.call('PERSIST', KEYS[1])
			redis.call('SET', KEYS[2], ARGV[2])
			return 1
			""", Long.class);

	// Only a hold can be released. A confirmed seat has no TTL (PTTL = -1), which guards
	// against a release racing a confirm for the same session.
	private static final RedisScript<Long> RELEASE = RedisScript.of("""
			if redis.call('GET', KEYS[1]) ~= ARGV[1] or redis.call('PTTL', KEYS[1]) < 0 then
			  return 0
			end
			redis.call('DEL', KEYS[1], KEYS[2])
			return 1
			""", Long.class);

	private final StringRedisTemplate redis;
	private final JsonMapper json;

	public RedisBookingStore(StringRedisTemplate redis, JsonMapper json) {
		this.redis = redis;
		this.json = json;
	}

	@Override
	public boolean hold(Booking booking, Duration ttl) {
		Long result = redis.execute(HOLD,
				List.of(seatKey(booking), sessionKey(booking.sessionId())),
				booking.sessionId(), json.writeValueAsString(booking), String.valueOf(ttl.toMillis()));
		return result == 1L;
	}

	@Override
	public Optional<Booking> findBySessionId(String sessionId) {
		return Optional.ofNullable(redis.opsForValue().get(sessionKey(sessionId)))
				.map(this::parse);
	}

	@Override
	public List<Booking> findByMovie(String movieId, List<String> seatIds) {
		// Two MGETs (seat → session, session → details) rather than a SCAN over the whole keyspace.
		List<String> seatKeys = seatIds.stream().map(seatId -> seatKey(movieId, seatId)).toList();
		List<String> sessionKeys = redis.opsForValue().multiGet(seatKeys).stream()
				.filter(Objects::nonNull)
				.map(RedisBookingStore::sessionKey)
				.toList();
		if (sessionKeys.isEmpty()) {
			return List.of();
		}
		return redis.opsForValue().multiGet(sessionKeys).stream()
				.filter(Objects::nonNull) // expired between the two reads
				.map(this::parse)
				.toList();
	}

	@Override
	public boolean confirm(Booking confirmed) {
		Long result = redis.execute(CONFIRM,
				List.of(seatKey(confirmed), sessionKey(confirmed.sessionId())),
				confirmed.sessionId(), json.writeValueAsString(confirmed));
		return result == 1L;
	}

	@Override
	public boolean release(Booking held) {
		Long result = redis.execute(RELEASE,
				List.of(seatKey(held), sessionKey(held.sessionId())),
				held.sessionId());
		return result == 1L;
	}

	private Booking parse(String value) {
		return json.readValue(value, Booking.class);
	}

	private static String seatKey(Booking booking) {
		return seatKey(booking.movieId(), booking.seatId());
	}

	private static String seatKey(String movieId, String seatId) {
		return "seat:" + movieId + ":" + seatId;
	}

	private static String sessionKey(String sessionId) {
		return "session:" + sessionId;
	}

}
