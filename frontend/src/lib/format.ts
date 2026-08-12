// Formatting rules from the design system: Indian digit grouping, ₹ with no space,
// paise only when non-zero, 12-hour times, dates like "Sun, 27 Sep".

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function inr(n: number, opts?: { minus?: boolean }): string {
  const frac = Math.round(n * 100) % 100 !== 0
  const f = new Intl.NumberFormat('en-IN', { minimumFractionDigits: frac ? 2 : 0, maximumFractionDigits: 2 }).format(n)
  return (opts?.minus ? '−' : '') + '₹' + f
}

export const pad = (n: number) => (n < 10 ? '0' : '') + n

export function mmss(sec: number): string {
  const s = Math.max(0, Math.ceil(sec))
  return pad(Math.floor(s / 60)) + ':' + pad(s % 60)
}

export const runtime = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`

/** "19:40" → "7:40 PM" */
export function time12(hhmm: string): string {
  const [hs, m] = hhmm.split(':')
  const h = +hs
  return ((h + 11) % 12) + 1 + ':' + m + ' ' + (h < 12 ? 'AM' : 'PM')
}

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isoDate(d: Date): string {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

/** Today's date in India, where every show is. */
export function todayIst(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

export function fmtDate(iso: string, style?: 'short' | 'day'): string {
  const d = parseDate(iso)
  if (style === 'short') return d.getDate() + ' ' + MONTHS[d.getMonth()]
  if (style === 'day') return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()]
  return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear()
}

/** "Today" or "Sun, 27 Sep" */
export const dayLabel = (iso: string) => (iso === todayIst() ? 'Today' : fmtDate(iso, 'day'))

export function timeOfDay(hhmm: string): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = +hhmm.split(':')[0]
  return h < 12 ? 'morning' : h < 16 ? 'afternoon' : h < 20 ? 'evening' : 'night'
}

export const metaLine = (m: { certificate: string; runtimeMinutes: number; genres: string[] }) =>
  `${m.certificate} · ${runtime(m.runtimeMinutes)} · ${m.genres.join(', ')}`

export function initials(name: string): string {
  return name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
