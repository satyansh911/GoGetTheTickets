import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { copyBookingId, downloadCalendar, TicketCard, whenLabel } from '../components/booking'
import { Dialog } from '../components/Dialog'
import { Icon, PosterArt } from '../components/Svg'
import { Badge, Button, EmptyState, Skel, Tabs } from '../components/ui'
import { BackBar, useTitle } from '../layout/shell'
import { api, ApiError } from '../lib/api'
import { fmtDate, inr, time12 } from '../lib/format'
import type { Booking } from '../lib/types'
import { useAuth } from '../state/auth'
import { useUi } from '../state/ui'
import { useBooking } from '../state/booking'
import { shareLink } from '../lib/share'
import { RequireSignIn } from './RequireSignIn'

export function Bookings() {
  useTitle('My bookings')
  const navigate = useNavigate()
  const ui = useUi()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'past' ? 'past' : 'upcoming'
  const upcoming = useQuery({ queryKey: ['bookings', 'upcoming'], queryFn: () => api.bookings('upcoming'), enabled: !!user })
  const past = useQuery({ queryKey: ['bookings', 'past'], queryFn: () => api.bookings('past'), enabled: !!user })
  const current = tab === 'upcoming' ? upcoming : past
  const list = user ? current.data : []

  return (
    <div className="g-wrap g-narrow g-bookings">
      <h1 className="g-pagetitle g-only-d">My bookings</h1>
      {!user ? (
        <div className="g-signinbanner"><Icon name="user" size={18} /><span>Sign in to see your bookings from any device.</span><Button label="Sign in" size="sm" variant="secondary" onClick={() => ui.openAuth()} /></div>
      ) : null}
      <Tabs items={[{ id: 'upcoming', label: 'Upcoming', count: user ? upcoming.data?.length : 0 }, { id: 'past', label: 'Past', count: user ? past.data?.length : 0 }]}
        active={tab} onChange={t => setParams(t === 'past' ? { tab: 'past' } : {}, { replace: true })} />
      <div className="g-blist">
        {!list ? (
          [1, 2].map(k => <Skel key={k} w="100%" h={120} r="var(--radius-lg)" />)
        ) : list.length ? list.map(b => (
          <button key={b.bookingId} type="button" className="g-bcard" onClick={() => navigate(`/bookings/${b.bookingId}`)}>
            <span className="g-bcard__poster"><PosterArt movie={b.movie} noText /></span>
            <span className="g-bcard__body">
              <span className="g-bcard__status">
                {b.status === 'CANCELLED' ? <Badge text="Cancelled" tone="danger" /> : tab === 'past' ? <Badge text="Watched" /> : <Badge text="Confirmed" tone="success" icon="check" />}
              </span>
              <b className="g-bcard__title">{b.movie.title}</b>
              <span className="g-bcard__when">{fmtDate(b.date, 'day')} · {time12(b.startTime)}</span>
              <span className="g-bcard__where">{b.cinemaName}</span>
              <span className="g-bcard__seats">{b.seats.length} seat{b.seats.length > 1 ? 's' : ''}: {b.seats.map(s => s.id).join(', ')} · {b.format}</span>
            </span>
            <span className="g-bcard__chev"><Icon name="chevRight" size={20} /></span>
          </button>
        )) : tab === 'upcoming' ? (
          <EmptyState tone="accent" icon="ticket" title="No upcoming bookings" text="Your next movie night starts here. Tickets you book will show up in this tab."
            actions={<Button label="Browse movies" iconRight="arrowRight" onClick={() => navigate('/movies')} />} />
        ) : (
          <EmptyState icon="history" title="No past bookings" text="Movies you have watched will appear here." />
        )}
      </div>
    </div>
  )
}

export function BookingDetail() {
  return <RequireSignIn title="Booking details"><BookingDetailInner /></RequireSignIn>
}

function BookingDetailInner() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const ui = useUi()
  const queryClient = useQueryClient()
  const { data: b, error, set } = useBooking(id)
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [openedAt] = useState(() => Date.now())
  useTitle('Booking details')
  // An unpaid hold belongs in checkout, not here.
  useEffect(() => {
    if (b?.status === 'HELD') navigate(`/checkout/${b.bookingId}`, { replace: true })
  }, [b, navigate])

  const bar = <BackBar title="Booking details" onBack={() => navigate('/bookings')} />
  if (error instanceof ApiError && error.status === 404) {
    return <>{bar}<div className="g-wrap g-narrow"><EmptyState icon="ticket" title="Booking not found" text="It doesn't exist, or it belongs to another account." actions={<Button label="My bookings" onClick={() => navigate('/bookings')} />} /></div></>
  }
  if (!b || b.status === 'HELD') return <>{bar}<div className="g-wrap g-narrow g-bookingdetail"><Skel w="100%" h={420} r="var(--radius-lg)" /></div></>

  const upcoming = new Date(b.startsAt).getTime() > openedAt
  async function cancel() {
    setCancelling(true)
    try {
      const next = await api.cancel(id)
      set(next)
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setConfirming(false)
      ui.toast({ tone: 'success', text: <>Booking cancelled. Refund of <b>{inr(next.refundAmount)}</b> initiated</> })
    } catch (e) {
      ui.toast({ tone: 'danger', text: (e as ApiError).message })
    } finally {
      setCancelling(false)
    }
  }

  return (
    <>
      {bar}
      <div className="g-wrap g-narrow g-bookingdetail">
        <h1 className="g-pagetitle g-only-d">Booking details</h1>
        {b.status === 'CANCELLED' ? (
          <div className="g-alert g-alert--danger"><Icon name="info" size={18} /><div><b>This booking was cancelled</b><span>Refund of {inr(b.refundAmount)} sent to the original payment method. It can take 5–7 working days to appear.</span></div></div>
        ) : null}
        <div className="g-confirm__grid">
          <TicketCard booking={b} onCopy={() => copyBookingId(b.bookingId, ui.toast)} />
          <div className="g-confirm__actions">
            {b.status === 'CONFIRMED' && upcoming ? (
              <>
                <Button label="Add to calendar" variant="secondary" icon="calendar" block onClick={() => { downloadCalendar(b); ui.toast({ tone: 'success', icon: 'calendar', text: 'Calendar event downloaded' }) }} />
                <Button label="Share" variant="secondary" icon="share" block onClick={() => shareLink(`${b.movie.title} — my tickets`, ui.toast)} />
              </>
            ) : null}
            {b.cancellable ? (
              <>
                <Button label="Cancel booking" variant="danger" icon="x" block onClick={() => setConfirming(true)} />
                <p className="g-finep">Cancel up to 2 hours before showtime. You'll get {inr(b.refundAmount)} back; the convenience fee and GST are non-refundable.</p>
              </>
            ) : null}
            <PaymentCard booking={b} />
          </div>
        </div>
      </div>
      {confirming ? (
        <Dialog title="Cancel this booking?" onClose={() => !cancelling && setConfirming(false)}
          footer={<><Button label="Keep booking" variant="outline" disabled={cancelling} onClick={() => setConfirming(false)} /><Button label="Yes, cancel" variant="danger" loading={cancelling} loadingLabel="Cancelling…" onClick={cancel} /></>}>
          <div className="g-cancelsum">
            <div className="g-cancelsum__poster"><PosterArt movie={b.movie} noText /></div>
            <div><b>{b.movie.title}</b><span>{whenLabel(b)}</span><span>{b.seats.map(s => s.id).join(', ')} · {b.cinemaName}</span></div>
          </div>
          <div className="g-breakdown">
            <div><span>Amount paid</span><span className="g-num">{inr(b.total)}</span></div>
            <div><span>Non-refundable fee + GST</span><span className="g-num">{inr(b.convenienceFee + b.gst, { minus: true })}</span></div>
            <div className="g-breakdown__total"><span>You'll get back</span><span className="g-num">{inr(b.refundAmount)}</span></div>
          </div>
          <p className="g-finep">Your seats will be released immediately. This can't be undone.</p>
        </Dialog>
      ) : null}
    </>
  )
}

function PaymentCard({ booking: b }: { booking: Booking }) {
  return (
    <div className="g-card">
      <h3 className="g-card__title">Payment</h3>
      <div className="g-breakdown">
        <div><span>Tickets</span><span className="g-num">{inr(b.ticketsAmount)}</span></div>
        {b.fnbAmount ? <div><span>Food & beverages</span><span className="g-num">{inr(b.fnbAmount)}</span></div> : null}
        <div><span>Convenience fee</span><span className="g-num">{inr(b.convenienceFee)}</span></div>
        <div><span>GST</span><span className="g-num">{inr(b.gst)}</span></div>
        {b.discount ? <div><span className="g-success">Discount</span><span className="g-num g-success">{inr(b.discount, { minus: true })}</span></div> : null}
        <div className="g-breakdown__total"><span>Total</span><span className="g-num">{inr(b.total)}</span></div>
      </div>
    </div>
  )
}
