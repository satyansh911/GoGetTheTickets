# GoGetTheTickets

A cinema seat-booking service in Go, built around the hard part of ticketing: making sure two people can never buy the same seat.

Seats are held with a short-lived reservation, confirmed into a permanent booking, or released back to the pool. Concurrency safety comes from Redis rather than application-level locking, so the guarantee still holds with multiple server instances behind a load balancer.

## How it works

A seat hold is an atomic `SET NX` on a per-seat key with a TTL:

```
seat:{movieID}:{seatID}   → session JSON   (TTL set = held, TTL removed = confirmed)
session:{sessionID}       → seat key       (reverse lookup)
```

`SET NX` succeeds for exactly one caller, so the race between two users clicking the same seat is decided by Redis in a single round trip — no mutex, no read-then-write window, no coordination between app instances. The TTL means an abandoned checkout frees the seat automatically with no reaper job. Confirming a booking runs `PERSIST` to strip the TTL, making the hold permanent.

The reverse-lookup key exists so confirm and release can work from a session ID alone, without the client having to echo back the movie and seat.

## Layout

```
cmd/                        entry point, routing
internal/booking/
  domain.go                 core types
  service.go                business logic
  handler.go                HTTP handlers
  redis_store.go            Redis-backed store (default)
  memory_store.go           in-memory store
  concurrent_store.go       mutex-guarded store
internal/adapters/redis/    Redis client setup
static/                     browser UI
```

The store is an interface, so the Redis, in-memory, and mutex implementations are interchangeable behind the same service.

## Running it

Requires Go 1.25+ and a Redis instance on `localhost:6379`.

Start Redis via Docker:

```bash
docker compose up -d
```

This also brings up Redis Commander at http://localhost:8081 for inspecting keys. A natively installed Redis works just as well — the app only needs something listening on 6379.

Then run the server from the project root (static assets are resolved relative to the working directory):

```bash
go run ./cmd
```

The UI is at http://localhost:8080.

## API

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/movies` | List movies and hall dimensions |
| `GET` | `/movies/{movieID}/seats` | Seat status for a movie |
| `POST` | `/movies/{movieID}/seats/{seatID}/hold` | Hold a seat, returns a session |
| `PUT` | `/sessions/{sessionID}/confirm` | Convert a hold into a booking |
| `DELETE` | `/sessions/{sessionID}` | Release a held seat |

Hold, confirm, and release take a `{"user_id": "..."}` body.

```bash
curl -X POST http://localhost:8080/movies/inception/seats/A1/hold \
  -H 'Content-Type: application/json' -d '{"user_id":"alice"}'
```

A successful hold returns a session ID and an `expires_at` timestamp:

```json
{
  "session_id": "3ed91c3e-e77f-4240-8c89-8f3ff1a4937e",
  "movieID": "inception",
  "seat_id": "A1",
  "expires_at": "2026-08-05T01:07:58+05:30"
}
```

## Tests

```bash
go test ./...
```

`TestConcurrentBooking_ExactlyOneWins` fires concurrent booking attempts at a single seat and asserts exactly one succeeds — the property the whole design exists to guarantee.
