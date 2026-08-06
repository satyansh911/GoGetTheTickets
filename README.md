# GoGetTheTickets

A cinema seat-booking backend in **Java 21 / Spring Boot**, built around the hard part of ticketing: making sure two people can never buy the same seat.

A seat is **held** with a short-lived reservation, then **confirmed** into a permanent booking or **released** back to the pool. Concurrency safety comes from Redis rather than in-process locks, so the guarantee still holds with several app instances behind a load balancer.

**Stack:** Spring Boot 4 (Web MVC, Data Redis, Validation, Actuator) · Redis · JUnit 5, Mockito, Testcontainers · Docker · GitHub Actions · Render

## How it works

Two keys per hold:

```
seat:{movieId}:{seatId}   → sessionId      the lock: whoever set it owns the seat
session:{sessionId}       → booking JSON   the details (user, status, expiry)
```

- **Hold:** `SET seat:... NX PX 120000`. `NX` ("only if it doesn't exist") succeeds for exactly one caller, so a race between users clicking the same seat is decided by Redis in a single step. There's no mutex and no read-then-write window. The TTL means an abandoned checkout frees the seat on its own, with no cleanup job.
- **Confirm:** a compare-and-set. It succeeds only if the seat key *still* holds this session's ID, and then removes the TTL (`PERSIST`) so the booking never expires.
- **Release:** the same check, and it also refuses if the seat has no TTL (already confirmed).

Each multi-step write is a small **Lua script**, which Redis runs atomically: no other client's command can run between its steps. See [RedisBookingStore.java](src/main/java/com/satyansh/gogetthetickets/booking/RedisBookingStore.java).

### Why confirm needs compare-and-set

Without it: Alice holds A1 → her hold expires → Bob holds A1 → Alice clicks *Confirm* late → a plain `SET` overwrites Bob's hold, and Bob loses a seat he legitimately holds. The CAS check sees that the seat now belongs to Bob's session and rejects Alice's confirm. The test `lateConfirmCannotStealASeatReHeldBySomeoneElse` reproduces exactly this.

## Request flow

```
HTTP request
  → BookingController        routing, JSON ↔ DTOs, @Valid input checks
  → BookingService           business rules: movie/seat exists, caller owns the session,
                             allowed transitions (held → confirmed, held → released)
  → BookingStore (interface)
  → RedisBookingStore        atomic Redis operations, nothing else
errors
  → GlobalExceptionHandler   exception → HTTP status + {"error": "..."}
```

Spring creates each of these objects once and passes (injects) them into each other's constructors. That is dependency injection, so no class creates its own dependencies. Because the service depends on the `BookingStore` *interface*, the unit tests can give it a mock instead of Redis.

## Layout

```
src/main/java/com/satyansh/gogetthetickets/
  GoGetTheTicketsApplication.java   entry point
  movie/                            movie catalog, GET /movies
  booking/
    BookingController.java          HTTP endpoints
    BookingService.java             business rules
    BookingStore.java               storage interface
    RedisBookingStore.java          Redis implementation (Lua scripts)
    Booking.java, BookingStatus.java
    *Exception.java                 each maps to an HTTP status
    dto/                            request/response shapes
  common/                           error response + global exception handler
src/main/resources/
  application.properties            config (port, Redis URL, hold TTL)
  static/index.html                 browser UI
```

## API

| Method | Route | Success | Errors |
|---|---|---|---|
| `GET` | `/movies` | 200 list of movies and hall sizes | |
| `GET` | `/movies/{movieId}/seats` | 200 taken seats | 404 unknown movie |
| `POST` | `/movies/{movieId}/seats/{seatId}/hold` | 201 session + `expires_at` | 400 invalid seat, 404 unknown movie, **409 seat taken** |
| `PUT` | `/sessions/{sessionId}/confirm` | 200 confirmed booking (idempotent) | **403 not your session**, 404 unknown/expired |
| `DELETE` | `/sessions/{sessionId}` | 204 | 403, 404, 409 already confirmed |
| `GET` | `/actuator/health` | 200 if the app and Redis are up | 503 |

Hold, confirm and release take `{"user_id": "..."}`. Errors are always `{"error": "message"}`.

```bash
curl -X POST localhost:8080/movies/inception/seats/A1/hold \
  -H 'Content-Type: application/json' -d '{"user_id":"alice"}'
# 201 {"session_id":"3ed9…","movie_id":"inception","seat_id":"A1","expires_at":"2026-09-27T10:02:00Z"}
```

## Running locally

Needs Java 21 and Docker.

```bash
brew install openjdk@21
export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"   # add to ~/.zshrc
```

**One command** (starts a throwaway Redis in Docker automatically):

```bash
./mvnw spring-boot:test-run
```

**Or with a long-lived Redis** (keeps data between restarts; Redis Commander at http://localhost:8081 shows the keys live):

```bash
docker compose up -d
./mvnw spring-boot:run
```

Then open http://localhost:8080. Try two browser windows (each gets its own user ID) and click the same seat.

## Tests

```bash
./mvnw test
```

| Test class | What it covers | Needs Docker |
|---|---|---|
| `BookingServiceTest` | Business rules with a mocked store (Mockito): ownership, idempotent confirm, invalid seats, lapsed holds | No |
| `BookingControllerTest` | HTTP layer (`@WebMvcTest` + MockMvc): status codes, snake_case JSON, validation errors | No |
| `RedisBookingStoreTest` | Real Redis via Testcontainers: TTL expiry, CAS confirm, release rules and the concurrency test | Yes |

`concurrentHoldsOnOneSeatExactlyOneWins` fires 1,000 holds at the same seat at the same instant (virtual threads released together by a `CountDownLatch`) and asserts exactly one succeeds.

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs the whole suite on every push.

## Deploying (Render)

[render.yaml](render.yaml) describes the whole setup: a Docker web service plus a managed Redis-compatible Key Value instance, with the connection URL wired in as `REDIS_URL`.

1. Push this repo to GitHub.
2. On [render.com](https://render.com): **New → Blueprint** → select the repo → **Apply**.
3. The first build takes a few minutes. The app is then live at `https://gogetthetickets-XXXX.onrender.com`.

Free-tier notes: the web service sleeps after ~15 minutes idle (the first request after that takes ~30–60 s), and free Key Value data doesn't survive a restart. Both are fine for a demo.

## Known limitations

- `user_id` comes from the request body and isn't authenticated. A real system would take it from a login token (e.g. Spring Security + JWT).
- One seat per request. Booking a group of seats all-or-nothing would need a multi-key script.
- The movie catalog is hard-coded. A real system would store it in a database such as PostgreSQL.
