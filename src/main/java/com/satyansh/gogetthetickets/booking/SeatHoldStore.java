package com.satyansh.gogetthetickets.booking;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Component;

/**
 * Temporary seat holds in Redis: one key per seat, valued with the booking ID, with a TTL.
 *
 * <pre>
 * hold:{showId}:{seatId} → bookingId   (expires when the checkout timer does)
 * </pre>
 *
 * Every multi-seat operation is a Lua script, which Redis runs atomically, so a group of
 * seats is held all-or-nothing and no other client can slip in between the check and the
 * write. The {showId} hash tag keeps a show's keys in one slot so the scripts would also work
 * on Redis Cluster.
 */
@Component
public class SeatHoldStore {

	// Returns the 1-based positions of seats held by someone else; empty means everything was held.
	@SuppressWarnings("rawtypes")
	private static final RedisScript<List> HOLD = RedisScript.of("""
			local taken = {}
			for i, key in ipairs(KEYS) do
			  local owner = redis.call('GET', key)
			  if owner and owner ~= ARGV[1] then
			    table.insert(taken, i)
			  end
			end
			if #taken > 0 then
			  return taken
			end
			for _, key in ipairs(KEYS) do
			  redis.call('SET', key, ARGV[1], 'PX', ARGV[2])
			end
			return {}
			""", List.class);

	// Deletes only the keys this booking still owns, never someone else's newer hold.
	private static final RedisScript<Long> RELEASE = RedisScript.of("""
			local released = 0
			for _, key in ipairs(KEYS) do
			  if redis.call('GET', key) == ARGV[1] then
			    redis.call('DEL', key)
			    released = released + 1
			  end
			end
			return released
			""", Long.class);

	// Before charging: are all seats still ours? If so, make sure they outlive the payment.
	private static final RedisScript<Long> VERIFY_AND_EXTEND = RedisScript.of("""
			for _, key in ipairs(KEYS) do
			  if redis.call('GET', key) ~= ARGV[1] then
			    return 0
			  end
			end
			for _, key in ipairs(KEYS) do
			  if redis.call('PTTL', key) < tonumber(ARGV[2]) then
			    redis.call('PEXPIRE', key, ARGV[2])
			  end
			end
			return 1
			""", Long.class);

	private final StringRedisTemplate redis;

	public SeatHoldStore(StringRedisTemplate redis) {
		this.redis = redis;
	}

	/** Holds every seat for {@code bookingId}, or none. Returns the seats someone else holds. */
	@SuppressWarnings("unchecked")
	public List<String> hold(long showId, List<String> seatIds, String bookingId, Duration ttl) {
		List<Long> taken = redis.execute(HOLD, keys(showId, seatIds), bookingId, String.valueOf(ttl.toMillis()));
		List<String> conflicts = new ArrayList<>();
		for (Long position : taken) {
			conflicts.add(seatIds.get(position.intValue() - 1));
		}
		return conflicts;
	}

	public void release(long showId, Collection<String> seatIds, String bookingId) {
		redis.execute(RELEASE, keys(showId, seatIds), bookingId);
	}

	public boolean verifyAndExtend(long showId, Collection<String> seatIds, String bookingId, Duration atLeast) {
		return redis.execute(VERIFY_AND_EXTEND, keys(showId, seatIds), bookingId, String.valueOf(atLeast.toMillis())) == 1L;
	}

	/** Current holder of each held seat among {@code seatIds}. */
	public Map<String, String> holders(long showId, List<String> seatIds) {
		List<String> owners = redis.opsForValue().multiGet(keys(showId, seatIds));
		Map<String, String> result = new HashMap<>();
		for (int i = 0; i < seatIds.size(); i++) {
			if (owners.get(i) != null) {
				result.put(seatIds.get(i), owners.get(i));
			}
		}
		return result;
	}

	private static List<String> keys(long showId, Collection<String> seatIds) {
		return seatIds.stream().map(seatId -> "hold:{" + showId + "}:" + seatId).toList();
	}

}
