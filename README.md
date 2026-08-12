# GoGetTheTickets

A movie ticket booking app: browse what's playing in your city, pick a showtime, choose seats on a live seat map, add food, apply a coupon, pay (simulated) and get a QR ticket. Built to handle the hard part of ticketing correctly: **two people can never buy the same seat**, even when they click at the same instant.

**Backend:** Java 21 · Spring Boot 4 (Web MVC, Data JPA, Security, Validation, Actuator) · PostgreSQL + Flyway · Redis · JWT
**Frontend:** React 19 · TypeScript · Vite · TanStack Query · React Router
**Quality & delivery:** JUnit 5 · Mockito · MockMvc · Testcontainers · Playwright (manual e2e) · Docker · GitHub Actions · Render

> All movies, cinemas and people are fictional, and payments are simulated. The UI follows a custom design system (dark and light themes, desktop and mobile).

## Features

- **Discovery:** 39 cities, a featured carousel, Now Showing / Coming Soon, filters by language, genre and format, and search across movies, cast and cinemas.
- **Showtimes:** a 7-day date strip, filters by language, format and time of day, and availability on every showtime (available / filling fast / sold out).
- **Seat selection:** Recliner, Prime and Classic tiers with aisles and wheelchair seats.
  - Picking one seat fills the seats beside it.
  - The map refreshes every few seconds, and if someone takes a seat you selected, you're told immediately.
  - Pinch or ⌘-scroll to zoom.
- **Checkout:** a 10-minute seat hold with a countdown, food and drinks, coupons (`GGTFIRST`: first booking only; `POPCORN50`: needs food), and a live price breakdown.
- **Payment (demo):** UPI, card and netbanking forms, success and decline paths, and an idempotent retry.
- **Tickets:** a QR ticket, an "Add to calendar" (.ics) download, and My Bookings (upcoming / past).
- **Cancellation:** allowed until 2 hours before the show. You're refunded everything except the fee and GST, and the seats are released.
- **Accounts:** sign up / sign in (BCrypt + JWT), plus a profile page with dark / light / auto theme.

## How double-booking is prevented

Two layers, each covering the other's weak spot.

**1. Redis holds (fast, temporary).** Choosing seats creates one key per seat with a 10-minute TTL:

```
hold:{showId}:{seatId} → bookingId      (expires on its own if checkout is abandoned)
```

All seats in a request are held by **one Lua script**, which Redis runs atomically. Either every seat is held or none are, and the response names the seats that were taken so the UI can mark them. Confirm and release are also scripts that only touch keys the booking still owns.

**2. Postgres (permanent, the source of truth).** On payment, sold seats are inserted into `booked_seats`, whose primary key is `(show_id, seat_id)`. The database refuses a second sale of the same seat outright, even if Redis lost a hold (eviction, restart). It's a plain `INSERT` on purpose: JPA's `save()` would *merge*, and a merge of an existing row becomes an `UPDATE` that silently reassigns the seat.

**Ordering matters.**
- A hold checks `booked_seats` *after* taking the Redis lock.
- A payment writes `booked_seats` *before* deleting its Redis keys.

So once a hold succeeds, any earlier sale of those seats is already visible to it.

**Other safeguards:**
- **Idempotent payments:** every attempt carries an `Idempotency-Key` stored under a unique constraint, so a double click or network retry never charges twice.
- **Optimistic locking:** `@Version` on bookings means two concurrent changes to one booking can't both win.
- **Rollback cleanup:** if a hold's database transaction rolls back, a transaction hook releases the Redis keys straight away instead of leaving the seats blocked for 10 minutes.

## Booking lifecycle

```
HELD ──pay──▶ CONFIRMED ──cancel (≥2h before show)──▶ CANCELLED
 ├─ timer runs out ──▶ EXPIRED      (a scheduled job tidies the status; Redis already freed the seats)
 └─ user re-picks seats ──▶ RELEASED
```

A declined payment leaves the booking `HELD`, so the user can retry until the timer runs out.

## Architecture

```
React SPA ──/api──▶ Controllers ──▶ Services (business rules) ──▶ Repositories (JPA) ──▶ PostgreSQL
                                             │
                                             └──▶ SeatHoldStore (Lua scripts) ──────────▶ Redis
```

| Package | Responsibility |
|---|---|
| `auth` | Users, BCrypt passwords, stateless JWT auth via Spring Security's resource server |
| `catalog` | Cities, cinemas, movies and cast, food menu, offers, search |
| `show` | Shows, seat layout and tiers, a scheduler that keeps a rolling week of showtimes, showtimes/seat-map endpoints |
| `booking` | Holds, pricing, coupons, payments, cancellation, the hold-expiry job |
| `common` | Error handling (`{"error", "code", "fields", "details"}`), SPA fallback |

- **Migrations:** Flyway owns the schema (`db/migration`). Hibernate only validates it.
- **Show generation:** shows are generated per screen like a real cinema: back to back, runtime plus cleaning time, 9 AM to midnight. Generation is deterministic, and a unique key makes concurrent runs harmless.
- **Simulated walk-in sales:** a fresh demo would otherwise show empty halls, so `DemoOccupancy` marks a stable, hash-based share of seats as sold. It can be turned off with `booking.demo-occupancy=false`.

### API

| Method & path | Auth | Purpose |
|---|---|---|
| `GET /api/cities`, `/api/movies`, `/api/movies/{id}`, `/api/food`, `/api/offers` | – | Catalog |
| `GET /api/search?q=&city=` | – | Movies (title/genre/language/format/cast) and cinemas |
| `GET /api/movies/{id}/showtimes?city=&date=` | – | Next 7 days, cinemas nearest first |
| `GET /api/shows/{id}`, `/api/shows/{id}/seats` | optional | Show details with tier availability; live seat map |
| `POST /api/auth/signup`, `/api/auth/login`; `GET /api/auth/me` | –, –, ✓ | Accounts |
| `POST /api/shows/{id}/holds` | ✓ | Hold seats all-or-nothing → `409 SEATS_UNAVAILABLE` names taken seats |
| `GET /api/bookings?scope=upcoming\|past`, `GET /api/bookings/{id}` | ✓ | My bookings |
| `PUT /api/bookings/{id}/items`, `PUT`/`DELETE /api/bookings/{id}/coupon` | ✓ | Food and coupons (`410 HOLD_EXPIRED` once the timer ends) |
| `POST /api/bookings/{id}/payments` + `Idempotency-Key` | ✓ | `200` confirmed, `402 PAYMENT_DECLINED` (seats stay held) |
| `DELETE /api/bookings/{id}/hold`, `POST /api/bookings/{id}/cancel` | ✓ | Release a hold; cancel a booking |

## Running locally

Needs Java 21, Node 22+ and Docker.

```bash
# Backend with throwaway Postgres + Redis (Testcontainers starts them)
./mvnw spring-boot:test-run            # API on http://localhost:8080

# Frontend with hot reload (proxies /api to :8080)
cd frontend && npm install && npm run dev   # http://localhost:5173
```

Prefer long-lived databases? Run `docker compose up -d` (Postgres, Redis, and Redis Commander on :8081 to watch holds appear and expire), then `./mvnw spring-boot:run`.

## Tests

```bash
./mvnw test
```

| Test | Covers |
|---|---|
| `BookingFlowIntegrationTest` | Real Postgres + Redis. Covers: <br>• **200 users racing for the same seats: exactly one wins** <br>• overlapping requests are all-or-nothing <br>• idempotent payment <br>• a declined payment keeps the hold <br>• an expired hold can't be paid <br>• **a lost Redis hold still can't cause a double sale** <br>• cancellation rules <br>• the schedule never double-books a screen |
| `BookingControllerTest` | The HTTP contract: 401 without a token, 201/402/409 bodies, validation messages, the Idempotency-Key requirement |
| `PricingTest` | Fee, GST rounding, coupon caps and rules |

CI runs the backend suite plus the frontend lint and build on every push.

## Deploying (Render + Neon)

1. Create a free Postgres database on [neon.tech](https://neon.tech) and copy its host, database name, user and password.
2. On [render.com](https://render.com): **New → Blueprint** → select this repo. [render.yaml](render.yaml) creates the Docker web service and a Redis-compatible Key Value instance, and generates `JWT_SECRET`.
3. When Render asks, fill in:
   - `DATABASE_URL`: `jdbc:postgresql://<neon-host>/<db>?sslmode=require`
   - `DATABASE_USERNAME` and `DATABASE_PASSWORD`
4. The first deploy runs the Flyway migrations and schedules a week of shows.

The Docker image builds the frontend and bakes it into the Spring Boot jar, so it's one service at one URL. JVM flags are tuned for 512 MB: about 390 MB resident after 4,000 requests in testing. Render's free tier sleeps after 15 minutes idle, so the first request after that takes about 30–60 seconds.

## Known limitations

- Payments are simulated. A real integration (e.g. Razorpay) would confirm bookings from a signed webhook.
- Search is a simple substring match. Postgres full-text search, or a search engine, would scale better.
- There's no admin UI: movies and cinemas come from migrations.
