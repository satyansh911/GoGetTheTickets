import type {
  Booking, City, FoodItem, Movie, Offer, SearchResults, SeatMap, ShowDetails, Showtimes, User,
} from './types'

const TOKEN_KEY = 'ggt.token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Private mode or blocked storage: the session just won't survive a reload.
  }
}

/** An error response from the API: {"error", "code", "fields", "details"}. */
export class ApiError extends Error {
  status: number
  code: string | undefined
  fields: Record<string, string>
  details: unknown

  constructor(status: number, body: { error?: string; code?: string; fields?: Record<string, string>; details?: unknown }) {
    super(body.error || 'Something went wrong')
    this.status = status
    this.code = body.code
    this.fields = body.fields || {}
    this.details = body.details
  }
}

/** Fired on a 401 so the app can drop a stale token. */
export const UNAUTHORIZED_EVENT = 'ggt:unauthorized'

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, { error: "You seem to be offline, or our servers didn't respond.", code: 'NETWORK' })
  }
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    throw new ApiError(res.status, data)
  }
  return data as T
}

export interface PaymentBody {
  method: 'UPI' | 'CARD' | 'NETBANKING'
  email: string
  upiId?: string
  card?: { number: string; expiry: string; cvv: string; name: string }
  bank?: string
  simulate?: 'FAIL'
}

export const api = {
  cities: () => request<City[]>('GET', '/cities'),
  movies: () => request<Movie[]>('GET', '/movies'),
  movie: (id: string) => request<Movie>('GET', `/movies/${encodeURIComponent(id)}`),
  food: () => request<FoodItem[]>('GET', '/food'),
  offers: () => request<Offer[]>('GET', '/offers'),
  search: (q: string, city: string) =>
    request<SearchResults>('GET', `/search?q=${encodeURIComponent(q)}&city=${encodeURIComponent(city)}`),
  showtimes: (movieId: string, city: string, date?: string) =>
    request<Showtimes>('GET', `/movies/${encodeURIComponent(movieId)}/showtimes?city=${encodeURIComponent(city)}${date ? `&date=${date}` : ''}`),
  show: (id: number) => request<ShowDetails>('GET', `/shows/${id}`),
  seats: (id: number) => request<SeatMap>('GET', `/shows/${id}/seats`),

  signup: (name: string, email: string, password: string) =>
    request<{ token: string; user: User }>('POST', '/auth/signup', { name, email, password }),
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('POST', '/auth/login', { email, password }),
  me: () => request<User>('GET', '/auth/me'),

  hold: (showId: number, seatIds: string[]) => request<Booking>('POST', `/shows/${showId}/holds`, { seatIds }),
  booking: (id: string) => request<Booking>('GET', `/bookings/${id}`),
  bookings: (scope: 'upcoming' | 'past') => request<Booking[]>('GET', `/bookings?scope=${scope}`),
  releaseHold: (id: string) => request<void>('DELETE', `/bookings/${id}/hold`),
  setItems: (id: string, items: Array<{ id: string; qty: number }>) => request<Booking>('PUT', `/bookings/${id}/items`, { items }),
  applyCoupon: (id: string, code: string) => request<Booking>('PUT', `/bookings/${id}/coupon`, { code }),
  removeCoupon: (id: string) => request<Booking>('DELETE', `/bookings/${id}/coupon`),
  pay: (id: string, body: PaymentBody) => request<Booking>('POST', `/bookings/${id}/payments`, body),
  cancel: (id: string) => request<Booking>('POST', `/bookings/${id}/cancel`),
}
