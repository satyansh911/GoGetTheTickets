import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { HoldBar, HoldExpiredDialog, OrderSummary, useHoldCountdown, whenLabel } from '../components/booking'
import { FoodArt, Icon } from '../components/Svg'
import { Badge, Button, Chip, EmptyState, Field, Skel, Stepper } from '../components/ui'
import { BackBar, Dock, useTitle } from '../layout/shell'
import { api, ApiError } from '../lib/api'
import { inr } from '../lib/format'
import type { Booking } from '../lib/types'
import { useAuth } from '../state/auth'
import { EMAIL, holdGone, readEmail, saveEmail, useBooking } from '../state/booking'
import { useFood, useOffers } from '../state/queries'
import { useUi } from '../state/ui'
import { RequireSignIn } from './RequireSignIn'

export function Checkout() {
  return <RequireSignIn title="Review & pay"><CheckoutInner /></RequireSignIn>
}

function CheckoutInner() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const ui = useUi()
  const { user } = useAuth()
  const { data: booking, error, set } = useBooking(id)
  const { data: food = [] } = useFood()
  const { data: offers = [] } = useOffers()
  const [typedEmail, setEmail] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [couponError, setCouponError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [serverSaysExpired, setExpired] = useState(false)
  const left = useHoldCountdown(booking?.status === 'HELD' ? booking.holdExpiresAt : null)
  const expired = serverSaysExpired || holdGone(booking) || left === 0
  // Until the user types, suggest the email from this checkout, the booking or the account.
  const email = typedEmail ?? (readEmail(id) || booking?.email || user?.email || '')
  useTitle('Review & pay')

  useEffect(() => {
    if (booking?.status === 'CONFIRMED') navigate(`/tickets/${id}`, { replace: true })
  }, [booking, id, navigate])

  if (error instanceof ApiError && error.status === 404) {
    return <div className="g-wrap g-narrow"><EmptyState icon="ticket" title="Booking not found" text="This checkout doesn't exist or belongs to another account." actions={<Button label="Browse movies" onClick={() => navigate('/movies')} />} /></div>
  }
  if (!booking) return <div className="g-wrap g-checkout"><div className="g-checkout__main g-skelstack"><Skel w="100%" h={180} r="var(--radius-lg)" /><Skel w="100%" h={260} r="var(--radius-lg)" /></div></div>

  const b = booking
  async function run(action: () => Promise<Booking>, onError?: (e: ApiError) => void) {
    setBusy(true)
    try {
      const next = await action()
      set(next)
      return next
    } catch (e) {
      const err = e as ApiError
      if (err.code === 'HOLD_EXPIRED') setExpired(true)
      else if (onError) onError(err)
      else ui.toast({ tone: 'danger', text: err.message })
      return null
    } finally {
      setBusy(false)
    }
  }

  const qty = (foodId: string) => b.items.find(i => i.id === foodId)?.qty ?? 0
  async function setQty(foodId: string, n: number) {
    const items = food.map(f => ({ id: f.id, qty: f.id === foodId ? n : qty(f.id) })).filter(i => i.qty > 0)
    const previousCode = b.couponCode
    const next = await run(() => api.setItems(id, items))
    if (next?.couponNotice && previousCode) {
      setCode(previousCode)
      setCouponError(next.couponNotice)
    }
  }

  async function applyCoupon(raw = code) {
    const c = raw.trim().toUpperCase()
    if (!c) return
    setCode(c)
    const next = await run(() => api.applyCoupon(id, c), e => setCouponError(e.message))
    if (next) {
      setCouponError(null)
      ui.toast({ tone: 'success', icon: 'tag', text: <><b>{c}</b> applied — you saved {inr(next.discount)}</> })
    }
  }

  async function removeCoupon() {
    if (await run(() => api.removeCoupon(id))) {
      setCode('')
      setCouponError(null)
    }
  }

  function toPayment() {
    if (!EMAIL.test(email.trim())) {
      setEmailError(email ? 'Enter a valid email address' : 'We need an email to send your tickets')
      document.querySelector<HTMLInputElement>('input[type=email]')?.focus()
      return
    }
    saveEmail(id, email.trim())
    navigate(`/checkout/${id}/pay`)
  }

  const payCta = <Button label={`Pay ${inr(b.total)}`} size="lg" block icon="lock" className="g-summary__cta" onClick={toPayment} />
  const coupon = b.couponCode ? (
    <div className="g-coupon-applied">
      <Icon name="tag" size={18} />
      <div><b>{b.couponCode} applied</b><span>You saved {inr(b.discount)}{b.couponLabel ? ` · ${b.couponLabel}` : ''}</span></div>
      <button type="button" className="g-link" onClick={removeCoupon} disabled={busy}>Remove</button>
    </div>
  ) : (
    <>
      <Field value={code} onChange={v => { setCode(v.toUpperCase()); setCouponError(null) }} onEnter={() => applyCoupon()} placeholder="Enter coupon code" icon="tag"
        error={couponError} autoComplete="off" uppercase
        trailing={<button type="button" className="g-input__btn" disabled={!code.trim() || busy} onClick={() => applyCoupon()}>APPLY</button>} />
      <div className="g-chips g-chips--wrap g-coupon-sugg">
        <span className="g-subtle g-small">Try:</span>
        {offers.map(o => <Chip key={o.code} label={o.code} icon="tag" onClick={() => applyCoupon(o.code)} />)}
      </div>
    </>
  )

  return (
    <>
      <BackBar title="Review & pay" sub={`${b.cinemaName.split(':')[0]} · ${whenLabel(b)}`} onBack={() => navigate(`/shows/${b.showId}/seats?count=${b.seats.length}`)} />
      {left != null ? <HoldBar secondsLeft={left} /> : null}
      <div className="g-wrap g-checkout">
        <div className="g-checkout__main">
          <div className="g-only-m"><OrderSummary booking={b} /></div>
          <section className="g-section">
            <h2 className="g-h3" style={{ marginBottom: 2 }}>Add food & drinks</h2>
            <p className="g-muted g-small" style={{ marginBottom: 14 }}>Delivered to your seat · skip the queue</p>
            <div className="g-fnbgrid">
              {food.map(f => {
                const q = qty(f.id)
                return (
                  <div key={f.id} className={`g-fnb${q ? ' is-added' : ''}`}>
                    <div className="g-fnb__art"><FoodArt kind={f.art} />{f.tag ? <Badge text={f.tag} tone="accent" /> : null}</div>
                    <div className="g-fnb__body">
                      <b className="g-fnb__name">{f.name}</b>
                      <span className="g-fnb__size">{f.size}</span>
                      <div className="g-fnb__row">
                        <span className="g-fnb__price g-num">{inr(f.price)}</span>
                        <Stepper value={q} max={10} addLabel="Add" disabled={busy} onChange={n => setQty(f.id, n)} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
          <section className="g-section"><h2 className="g-h3">Offers & coupons</h2><div className="g-card">{coupon}</div></section>
          <section className="g-section">
            <h2 className="g-h3">Contact details</h2>
            <div className="g-card">
              <Field label="Email for your tickets" type="email" value={email} onChange={v => { setEmail(v); setEmailError(null) }} onEnter={toPayment}
                placeholder="you@example.com" icon="mail" error={emailError} hint="We'll send your QR ticket and invoice here." autoComplete="email" />
            </div>
          </section>
          <p className="g-finep">By paying you agree to the cancellation policy: cancel up to 2 hours before showtime for a refund of tickets and food. Convenience fee and GST are non-refundable.</p>
        </div>
        <aside className="g-checkout__side g-only-d"><div className="g-sticky"><OrderSummary booking={b} items cta={payCta} /></div></aside>
      </div>
      <Dock>
        <div className="g-dock__info"><b className="g-num">{inr(b.total)}</b><span>{b.seats.length} ticket{b.seats.length > 1 ? 's' : ''}{b.fnbAmount ? ' + food' : ''} · incl. fees</span></div>
        <Button label={`Pay ${inr(b.total)}`} icon="lock" onClick={toPayment} />
      </Dock>
      {expired ? <HoldExpiredDialog booking={b} /> : null}
    </>
  )
}
