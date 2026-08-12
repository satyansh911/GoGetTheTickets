import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { dayLabel, fmtDate, inr, mmss, time12 } from '../lib/format'
import type { Booking } from '../lib/types'
import { Dialog } from './Dialog'
import { Icon, PosterArt, Qr } from './Svg'
import { Badge, Button, Cert, EmptyState } from './ui'

const TIER_LABEL: Record<string, string> = { RECLINER: 'Recliner', PRIME: 'Prime', CLASSIC: 'Classic' }

/** Seconds left on a hold, ticking every second; null when there is no hold. */
export function useHoldCountdown(holdExpiresAt: string | null | undefined): number | null {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!holdExpiresAt) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [holdExpiresAt])
  if (!holdExpiresAt) return null
  return Math.max(0, (new Date(holdExpiresAt).getTime() - now) / 1000)
}

export function HoldBar({ secondsLeft }: { secondsLeft: number }) {
  return (
    <div className="g-stickybar">
      <div className={`g-holdbar${secondsLeft < 120 ? ' is-urgent' : ''}`} role="timer">
        <Icon name="clock" size={18} />
        <span>Seats held for <b className="g-num">{mmss(secondsLeft)}</b></span>
        <span className="g-holdbar__hint">Complete payment before the timer runs out</span>
      </div>
    </div>
  )
}

export function seatGroups(b: Booking): Array<[string, string[]]> {
  const groups = new Map<string, string[]>()
  b.seats.forEach(s => groups.set(s.tier, [...(groups.get(s.tier) ?? []), s.id]))
  return [...groups]
}

export function OrderSummary({ booking: b, items, cta }: { booking: Booking; items?: boolean; cta?: ReactNode }) {
  const rows: Array<{ key: string; label: ReactNode; value: ReactNode }> = [{ key: 'tickets', label: `Tickets (${b.seats.length})`, value: inr(b.ticketsAmount) }]
  if (b.fnbAmount) rows.push({ key: 'fnb', label: 'Food & beverages', value: inr(b.fnbAmount) })
  rows.push({ key: 'fee', label: <>Convenience fee <span className="g-subtle">₹30 × {b.seats.length}</span></>, value: inr(b.convenienceFee) })
  rows.push({ key: 'gst', label: <>GST <span className="g-subtle">18% on fee</span></>, value: inr(b.gst) })
  if (b.discount) rows.push({ key: 'discount', label: <span className="g-success">Discount · {b.couponCode}</span>, value: <span className="g-success">{inr(b.discount, { minus: true })}</span> })
  return (
    <div className="g-card g-summary">
      <div className="g-summary__movie">
        <div className="g-summary__poster"><PosterArt movie={b.movie} noText /></div>
        <div>
          <h3 className="g-card__title">{b.movie.title}</h3>
          <p className="g-summary__tags"><Cert c={b.movie.certificate} /><span>{b.language} · {b.format}</span></p>
        </div>
      </div>
      <dl className="g-dl g-dl--tight">
        <div><dt>Cinema</dt><dd>{b.cinemaName}, {b.area}</dd></div>
        <div><dt>Screen</dt><dd>{b.screen}</dd></div>
        <div><dt>Date & time</dt><dd>{fmtDate(b.date, 'day')}, {time12(b.startTime)}</dd></div>
        <div><dt>Seats</dt><dd>{seatGroups(b).map(([tier, ids]) => <span key={tier} className="g-seatgroup"><em>{TIER_LABEL[tier]}</em> {ids.join(', ')}</span>)}</dd></div>
      </dl>
      {items && b.items.length ? (
        <div className="g-summary__items">{b.items.map(i => <div key={i.id}><span>{i.qty} × {i.name}</span><span className="g-num">{inr(i.price * i.qty)}</span></div>)}</div>
      ) : null}
      <hr className="g-divider" />
      <div className="g-breakdown">
        {rows.map(r => <div key={r.key}><span>{r.label}</span><span className="g-num">{r.value}</span></div>)}
        <div className="g-breakdown__total"><span>Total</span><span className="g-num">{inr(b.total)}</span></div>
      </div>
      {cta}
    </div>
  )
}

export function TicketCard({ booking: b, onCopy }: { booking: Booking; onCopy: () => void }) {
  const cancelled = b.status === 'CANCELLED'
  return (
    <article className={`g-ticket${cancelled ? ' is-cancelled' : ''}`}>
      <div className="g-ticket__top">
        <div className="g-ticket__poster"><PosterArt movie={b.movie} noText /></div>
        <div className="g-ticket__title">
          {cancelled ? <Badge text="Cancelled" tone="danger" icon="x" /> : null}
          <h2>{b.movie.title}</h2>
          <p><Cert c={b.movie.certificate} /><span>{b.language} · {b.format}</span></p>
        </div>
      </div>
      <dl className="g-ticket__grid">
        <div className="g-span2"><dt>Cinema</dt><dd>{b.cinemaName}, {b.area}</dd></div>
        <div><dt>Date</dt><dd>{fmtDate(b.date, 'day')}</dd></div>
        <div><dt>Time</dt><dd>{time12(b.startTime)}</dd></div>
        <div><dt>Screen</dt><dd>{b.screen}</dd></div>
        <div><dt>Seats ({b.seats.length})</dt><dd>{seatGroups(b).map(([, ids]) => ids.join(', ')).join(' · ')}</dd></div>
      </dl>
      <div className="g-ticket__tear" aria-hidden="true" />
      <div className="g-ticket__bottom">
        <div className="g-ticket__qr"><Qr text={b.bookingId} size={116} /></div>
        <div className="g-ticket__id">
          <span>Booking ID</span>
          <button type="button" className="g-ticket__code" onClick={onCopy}>{b.bookingId}<Icon name="copy" size={14} /></button>
          <p>{cancelled ? 'This ticket is no longer valid.' : 'Show this QR at the entrance. Arrive 15 min early for security.'}</p>
        </div>
      </div>
      {b.items.length ? (
        <div className="g-ticket__items">
          <Icon name="popcorn" size={18} />
          <div>{b.items.map(i => <span key={i.id}>{i.qty} × {i.name}</span>)}<small>Collect at counter 2 or order to seat</small></div>
        </div>
      ) : null}
      <div className="g-ticket__total"><span>{cancelled ? 'Refunded' : 'Total paid'}</span><b className="g-num">{inr(cancelled ? b.refundAmount : b.total)}</b></div>
    </article>
  )
}

/** Shown when the 10-minute hold runs out; can't be dismissed, only acted on. */
export function HoldExpiredDialog({ booking }: { booking: Booking }) {
  const navigate = useNavigate()
  const seats = booking.seats.map(s => s.id).join(', ')
  return (
    <Dialog title={null} locked onClose={() => {}}
      footer={<>
        <Button label="Change showtime" variant="outline" onClick={() => navigate(`/movies/${booking.movie.id}/showtimes?date=${booking.date}`, { replace: true })} />
        <Button label="Pick seats again" icon="seat" onClick={() => navigate(`/shows/${booking.showId}/seats?count=${booking.seats.length}`, { replace: true })} />
      </>}>
      <EmptyState icon="clock" tone="warning" title="Your hold expired" className="g-empty--flush"
        text={<>We held seats <b>{seats}</b> for 10 minutes, then released them so others could book. The show may still have seats — pick again to continue.</>} />
    </Dialog>
  )
}

export async function copyBookingId(id: string, toast: (t: { icon?: string; text: ReactNode }) => void) {
  try {
    await navigator.clipboard.writeText(id)
    toast({ icon: 'copy', text: <>Booking ID <b>{id}</b> copied</> })
  } catch {
    toast({ icon: 'copy', text: <>Booking ID: <b>{id}</b></> })
  }
}

/** Downloads an .ics calendar event for the show. */
export function downloadCalendar(b: Booking) {
  const start = new Date(b.startsAt)
  const end = new Date(start.getTime() + (b.movie.runtimeMinutes + 15) * 60_000)
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const esc = (s: string) => s.replace(/[\\,;]/g, m => '\\' + m)
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GoGetTheTickets//EN', 'BEGIN:VEVENT',
    `UID:${b.bookingId}@gogetthetickets`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(`${b.movie.title} (${b.language} ${b.format})`)}`,
    `LOCATION:${esc(`${b.cinemaName}, ${b.area} · ${b.screen}`)}`,
    `DESCRIPTION:${esc(`Seats ${b.seats.map(s => s.id).join(', ')} · Booking ${b.bookingId}`)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Movie in 1 hour', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${b.movie.id}-${b.date}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const whenLabel = (b: Booking) => `${dayLabel(b.date)}, ${time12(b.startTime)}`
