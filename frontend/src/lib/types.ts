// Shapes returned by the Spring Boot API (see the *Response records on the backend).

export type Certificate = 'U' | 'UA' | 'A'
export type Availability = 'AVAILABLE' | 'FILLING_FAST' | 'SOLD_OUT'
export type Tier = 'RECLINER' | 'PRIME' | 'CLASSIC'
export type SeatStatus = 'AVAILABLE' | 'HELD' | 'BOOKED'
export type BookingStatus = 'HELD' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'RELEASED'

export interface City {
  id: string
  name: string
  icon: string | null
  popular: boolean
}

export interface MovieArt {
  motif: string
  kicker: string
  posterLines: string[]
  palette: { a: string; b: string; c: string }
}

export interface CastMember {
  name: string
  role: string
  crew: boolean
  photoUrl: string | null
}

export interface Movie {
  id: string
  title: string
  certificate: Certificate
  runtimeMinutes: number
  genres: string[]
  languages: string[]
  formats: string[]
  releaseDate: string
  status: 'NOW_SHOWING' | 'COMING_SOON'
  rating: number | null
  votes: string
  synopsis: string
  trailerUrl: string | null
  posterUrl: string | null
  backdropUrl: string | null
  featuredRank: number | null
  art: MovieArt
  cast: CastMember[] | null
}

export interface Cinema {
  id: number
  name: string
  chain: string
  area: string
  cityId: string
  distanceKm: number
  amenities: Array<'parking' | 'food' | 'wheelchair'>
}

export interface ShowSummary {
  id: number
  date: string
  startTime: string
  startsAt: string
  language: string
  format: string
  screen: string
  availability: Availability
}

export interface Showtimes {
  dates: Array<{ date: string; hasShows: boolean }>
  date: string
  cinemas: Array<{ cinema: Cinema; shows: ShowSummary[] }>
}

export interface TierInfo {
  id: Tier
  label: string
  price: number
  rows: string[]
  blocks: number[]
  wide: boolean
  total: number
  available: number
}

export interface ShowDetails {
  id: number
  movie: Movie
  cinema: Cinema
  screen: string
  date: string
  startTime: string
  startsAt: string
  language: string
  format: string
  availability: Availability
  tiers: TierInfo[]
  otherShows: ShowSummary[]
}

export interface Seat {
  id: string
  row: string
  number: number
  tier: Tier
  price: number
  status: SeatStatus
  wheelchair: boolean
}

export interface SeatMap {
  showId: number
  rows: Array<{ row: string; tier: Tier; seats: Seat[] }>
}

export interface FoodItem {
  id: string
  name: string
  size: string
  price: number
  art: string
  tag: string | null
}

export interface Offer {
  code: string
  label: string
}

export interface Booking {
  bookingId: string
  status: BookingStatus
  showId: number
  movie: Movie
  cinemaName: string
  area: string
  cityId: string
  screen: string
  date: string
  startTime: string
  startsAt: string
  language: string
  format: string
  seats: Array<{ id: string; row: string; number: number; tier: Tier; price: number }>
  items: Array<{ id: string; name: string; price: number; qty: number }>
  ticketsAmount: number
  fnbAmount: number
  subtotal: number
  convenienceFee: number
  gst: number
  discount: number
  total: number
  couponCode: string | null
  couponLabel: string | null
  couponNotice: string | null
  holdExpiresAt: string | null
  email: string | null
  qrCode: string
  refundAmount: number
  cancellable: boolean
  createdAt: string
}

export interface User {
  id: number
  name: string
  email: string
  memberSince: string
  bookings: number
}

export interface SearchResults {
  movies: Movie[]
  cinemas: Cinema[]
}
