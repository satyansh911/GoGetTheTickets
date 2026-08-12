import type { CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router'
import { copyBookingId, downloadCalendar, TicketCard } from '../components/booking'
import { Icon } from '../components/Svg'
import { Button, Skel } from '../components/ui'
import { BackBar, useTitle } from '../layout/shell'
import { useAuth } from '../state/auth'
import { useUi } from '../state/ui'
import { useBooking } from '../state/booking'
import { shareLink } from '../lib/share'
import { RequireSignIn } from './RequireSignIn'

const CONFETTI_COLOURS = ['accent', 'success', 'access', 'warning', 'danger']

export function Ticket() {
  return <RequireSignIn title="Your ticket"><TicketInner /></RequireSignIn>
}

function TicketInner() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const ui = useUi()
  const { user } = useAuth()
  const { data: b } = useBooking(id)
  useTitle('Booking confirmed')

  const bar = <BackBar title="Your ticket" onBack={() => navigate('/')} />
  if (!b) return <>{bar}<div className="g-wrap g-confirm"><Skel w="100%" h={420} r="var(--radius-lg)" /></div></>

  return (
    <>
      {bar}
      <div className="g-wrap g-confirm">
        <div className="g-celebrate">
          <div className="g-confetti" aria-hidden="true">
            {Array.from({ length: 28 }, (_, i) => (
              <i key={i} style={{ '--x': `${(i * 37) % 100}%`, '--d': `${(i * 53) % 600}ms`, '--r': `${(i * 71) % 360}deg`, background: `var(--${CONFETTI_COLOURS[i % 5]})` } as CSSProperties} />
            ))}
          </div>
          <div className="g-celebrate__icon"><Icon name="check" size={36} /></div>
          <h1 className="g-celebrate__title">Booking confirmed!</h1>
          <p className="g-muted">Enjoy the show{user ? `, ${user.name.split(' ')[0]}` : ''}. Your ticket is saved to <b className="g-ink">{b.email}</b></p>
        </div>
        <div className="g-confirm__grid">
          <TicketCard booking={b} onCopy={() => copyBookingId(b.bookingId, ui.toast)} />
          <div className="g-confirm__actions">
            <Button label="Add to calendar" variant="secondary" icon="calendar" block onClick={() => { downloadCalendar(b); ui.toast({ tone: 'success', icon: 'calendar', text: 'Calendar event downloaded' }) }} />
            <Button label="Share" variant="secondary" icon="share" block onClick={() => shareLink(`${b.movie.title} — my tickets`, ui.toast)} />
            <Button label="View my bookings" icon="ticket" block onClick={() => navigate('/bookings', { replace: true })} />
            <div className="g-card g-tipcard"><Icon name="info" size={18} /><p>Plans changed? Cancel from <b>My bookings</b> up to 2 hours before the show.</p></div>
          </div>
        </div>
      </div>
    </>
  )
}
