-- Payments no longer carry a per-attempt key: an already-paid booking simply isn't charged again.
-- Bookings no longer carry a version number for optimistic locking.
alter table payments drop column idempotency_key;
alter table bookings drop column version;
