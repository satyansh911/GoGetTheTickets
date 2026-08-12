create table users (
    id            bigserial primary key,
    name          varchar(100) not null,
    email         varchar(255) not null,
    password_hash varchar(100) not null,
    created_at    timestamptz  not null default now()
);
create unique index users_email_key on users (lower(email));

create table cities (
    id         varchar(40) primary key,
    name       varchar(60) not null unique,
    icon       varchar(20),
    popular    boolean     not null default false,
    sort_order int         not null default 0
);

create table cinemas (
    id          bigserial primary key,
    city_id     varchar(40)  not null references cities (id),
    name        varchar(120) not null,
    chain       varchar(80)  not null,
    area        varchar(80)  not null,
    distance_km numeric(4, 1) not null,
    amenities   varchar(100) not null,
    formats     varchar(40)  not null,
    screens     int          not null
);
create index cinemas_city_idx on cinemas (city_id);

create table movies (
    id               varchar(60)  primary key,
    title            varchar(120) not null,
    certificate      varchar(2)   not null,
    runtime_minutes  int          not null,
    genres           varchar(200) not null,
    languages        varchar(200) not null,
    formats          varchar(40)  not null,
    release_date     date         not null,
    status           varchar(20)  not null,
    rating           numeric(3, 1),
    votes            varchar(12)  not null,
    synopsis         text         not null,
    trailer_url      varchar(300),
    poster_url       varchar(300),
    backdrop_url     varchar(300),
    featured_rank    int,
    art_motif        varchar(20)  not null,
    art_kicker       varchar(60)  not null,
    art_poster_lines varchar(80)  not null,
    art_palette      varchar(40)  not null
);

create table cast_members (
    id        bigserial primary key,
    movie_id  varchar(60)  not null references movies (id),
    position  int          not null,
    name      varchar(100) not null,
    role      varchar(100) not null,
    crew      boolean      not null default false,
    photo_url varchar(300)
);
create index cast_members_movie_idx on cast_members (movie_id);

create table shows (
    id        bigserial primary key,
    movie_id  varchar(60) not null references movies (id),
    cinema_id bigint      not null references cinemas (id),
    screen    varchar(20) not null,
    starts_at timestamptz not null,
    show_date date        not null,
    language  varchar(20) not null,
    format    varchar(10) not null,
    unique (cinema_id, screen, starts_at)
);
create index shows_movie_date_idx on shows (movie_id, show_date);

create table food_items (
    id         varchar(40)  primary key,
    name       varchar(80)  not null,
    size_label varchar(60)  not null,
    price      numeric(8, 2) not null,
    art        varchar(20)  not null,
    tag        varchar(30),
    sort_order int          not null
);

create table coupons (
    code               varchar(20)  primary key,
    label              varchar(120) not null,
    kind               varchar(20)  not null,
    amount             numeric(8, 2) not null,
    max_discount       numeric(8, 2),
    first_booking_only boolean      not null default false,
    active             boolean      not null default true
);

create table bookings (
    id              varchar(12)   primary key,
    user_id         bigint        not null references users (id),
    show_id         bigint        not null references shows (id),
    status          varchar(20)   not null,
    hold_expires_at timestamptz,
    tickets_amount  numeric(10, 2) not null,
    fnb_amount      numeric(10, 2) not null default 0,
    convenience_fee numeric(10, 2) not null,
    gst             numeric(10, 2) not null,
    discount        numeric(10, 2) not null default 0,
    total           numeric(10, 2) not null,
    coupon_code     varchar(20) references coupons (code),
    email           varchar(255),
    created_at      timestamptz   not null default now(),
    confirmed_at    timestamptz,
    cancelled_at    timestamptz,
    version         int           not null default 0
);
create index bookings_user_idx on bookings (user_id, created_at desc);
create index bookings_active_holds_idx on bookings (hold_expires_at) where status = 'HELD';

create table booking_seats (
    booking_id varchar(12)  not null references bookings (id),
    seat_id    varchar(4)   not null,
    tier       varchar(10)  not null,
    price      numeric(8, 2) not null,
    primary key (booking_id, seat_id)
);

create table booking_items (
    booking_id   varchar(12)  not null references bookings (id),
    food_item_id varchar(40)  not null references food_items (id),
    name         varchar(80)  not null,
    price        numeric(8, 2) not null,
    qty          int          not null check (qty between 1 and 10),
    primary key (booking_id, food_item_id)
);

-- The final guarantee against double-selling: one row per sold seat per show.
-- Redis holds keep people from colliding during checkout; this key makes a
-- double sale impossible even if a hold is lost.
create table booked_seats (
    show_id    bigint      not null references shows (id),
    seat_id    varchar(4)  not null,
    booking_id varchar(12) not null references bookings (id),
    primary key (show_id, seat_id)
);

create table payments (
    id              bigserial primary key,
    booking_id      varchar(12)   not null references bookings (id),
    idempotency_key varchar(80)   not null unique,
    method          varchar(20)   not null,
    status          varchar(20)   not null,
    amount          numeric(10, 2) not null,
    failure_code    varchar(40),
    created_at      timestamptz   not null default now()
);
create index payments_booking_idx on payments (booking_id);
