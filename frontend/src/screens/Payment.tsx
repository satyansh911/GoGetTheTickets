import { useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { HoldBar, HoldExpiredDialog, OrderSummary, useHoldCountdown } from '../components/booking'
import { Icon } from '../components/Svg'
import { Button, EmptyState, Field, Segmented, Skel } from '../components/ui'
import { BackBar, Dock, Portal, useTitle } from '../layout/shell'
import { api, ApiError, type PaymentBody } from '../lib/api'
import { inr } from '../lib/format'
import type { Booking } from '../lib/types'
import { useAuth } from '../state/auth'
import { useUi } from '../state/ui'
import { holdGone, readEmail, useBooking } from '../state/booking'
import { RequireSignIn } from './RequireSignIn'

type Method = 'upi' | 'card' | 'netbanking'
const BANKS: Array<[string, string]> = [['deccan', 'Bank of Deccan'], ['coastal', 'Coastal Co-operative Bank'], ['himalaya', 'Himalaya National Bank'], ['sahyadri', 'Sahyadri Bank'], ['ganga', 'Ganga Gramin Bank']]
const STEPS = ['Contacting your bank', 'Confirming your seats', 'Generating tickets']
const UPI = /^[\w.-]{2,}@[a-zA-Z]{2,}$/

export function Payment() {
  return <RequireSignIn title="Payment"><PaymentInner /></RequireSignIn>
}

function PaymentInner() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const ui = useUi()
  const { user } = useAuth()
  const { data: booking, set } = useBooking(id)
  const [method, setMethod] = useState<Method>('upi')
  const [outcome, setOutcome] = useState<'ok' | 'fail'>('ok')
  const [upi, setUpi] = useState('')
  const [card, setCard] = useState({ number: '4111 1111 1111 1111', expiry: '12/29', cvv: '', name: '' })
  const [bank, setBank] = useState('deccan')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState<number | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const [serverSaysExpired, setExpired] = useState(false)
  const left = useHoldCountdown(booking?.status === 'HELD' ? booking.holdExpiresAt : null)
  // While a payment is in flight the server decides; don't pre-empt it at 00:00.
  const expired = serverSaysExpired || holdGone(booking) || (left === 0 && step == null)
  useTitle('Payment')

  const email = readEmail(id) || booking?.email || user?.email || ''
  useEffect(() => {
    if (booking?.status === 'CONFIRMED' && step == null) navigate(`/tickets/${id}`, { replace: true })
  }, [booking, id, navigate, step])

  if (!booking) return <div className="g-wrap g-checkout"><div className="g-checkout__main g-skelstack"><Skel w="100%" h={80} r="var(--radius-lg)" /><Skel w="100%" h={300} r="var(--radius-lg)" /></div></div>
  const b: Booking = booking

  function validate(): Record<string, string> {
    const er: Record<string, string> = {}
    if (method === 'upi' && !UPI.test(upi.trim())) er.upiId = upi ? 'That UPI ID looks incomplete — try name@bank' : 'Enter your UPI ID'
    if (method === 'card') {
      if (card.number.replace(/\s/g, '').length !== 16) er['card.number'] = 'Card number must be 16 digits'
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) er['card.expiry'] = 'Use MM/YY'
      if (!/^\d{3}$/.test(card.cvv)) er['card.cvv'] = '3 digits'
    }
    return er
  }

  async function pay() {
    const er = validate()
    setErrors(er)
    if (Object.keys(er).length || step != null) return
    if (!email) {
      navigate(`/checkout/${id}`)
      return
    }
    const body: PaymentBody = {
      method: method === 'upi' ? 'UPI' : method === 'card' ? 'CARD' : 'NETBANKING',
      email,
      ...(method === 'upi' ? { upiId: upi.trim() } : {}),
      ...(method === 'card' ? { card } : {}),
      ...(method === 'netbanking' ? { bank } : {}),
      ...(outcome === 'fail' ? { simulate: 'FAIL' as const } : {}),
    }
    setFailed(null)
    setStep(0)
    const timers = [700, 1500].map((ms, i) => setTimeout(() => setStep(s => (s == null ? s : Math.max(s, i + 1))), ms))
    const minDelay = new Promise(r => setTimeout(r, 2300))
    try {
      const [confirmed] = await Promise.all([api.pay(id, body), minDelay])
      setStep(3)
      set(confirmed)
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      navigate(`/tickets/${id}`, { replace: true })
    } catch (e) {
      await minDelay
      const err = e as ApiError
      if (err.code === 'PAYMENT_DECLINED') {
        if (err.details) set(err.details as Booking)
        setFailed(err.message)
      } else if (err.code === 'HOLD_EXPIRED') {
        setExpired(true)
      } else if (err.code === 'VALIDATION_FAILED') {
        setErrors(err.fields)
      } else {
        ui.toast({ tone: 'danger', text: err.message })
      }
    } finally {
      timers.forEach(clearTimeout)
      setStep(null)
    }
  }

  const demo = (
    <div className="g-demobanner">
      <Icon name="shield" size={20} />
      <div><b>Demo payment</b><span>No real money moves. Any details work — or pick an outcome to preview.</span></div>
      <Segmented items={[{ id: 'ok', label: 'Succeed' }, { id: 'fail', label: 'Fail' }]} active={outcome} onChange={setOutcome} />
    </div>
  )
  const bar = <BackBar title="Payment" sub={`${inr(b.total)} · Demo`} onBack={() => navigate(`/checkout/${id}`)} />

  if (failed) {
    return (
      <>
        {bar}
        {left != null ? <HoldBar secondsLeft={left} /> : null}
        <div className="g-wrap g-narrow">
          {demo}
          <EmptyState icon="alertCircle" tone="danger" title="Payment failed"
            text={<>{failed.replace(' No money was deducted.', '')} <b>No money was deducted.</b> Your seats are still held — try again or use another method.</>}
            actions={<><Button label={`Retry ${inr(b.total)}`} icon="refresh" onClick={pay} /><Button label="Use another method" variant="outline" onClick={() => setFailed(null)} /></>} />
        </div>
        {expired ? <HoldExpiredDialog booking={b} /> : null}
      </>
    )
  }

  const methodBlock = (m: Method, icon: string, title: string, sub: string, body: ReactNode) => {
    const on = method === m
    return (
      <div className={`g-paymethod${on ? ' is-active' : ''}`}>
        <button type="button" className="g-paymethod__head" aria-expanded={on} onClick={() => setMethod(m)}>
          <span className={`g-radio${on ? ' is-on' : ''}`} />
          <span className="g-paymethod__icon"><Icon name={icon} size={20} /></span>
          <span className="g-paymethod__txt"><b>{title}</b><span>{sub}</span></span>
        </button>
        {on ? <div className="g-paymethod__body">{body}</div> : null}
      </div>
    )
  }
  const setCardField = (k: keyof typeof card) => (v: string) => { setCard(c => ({ ...c, [k]: v })); setErrors({}) }

  const cta = <Button label={`Pay ${inr(b.total)}`} size="lg" block icon="lock" className="g-summary__cta" onClick={pay} />
  return (
    <>
      {bar}
      {left != null ? <HoldBar secondsLeft={left} /> : null}
      <div className="g-wrap g-checkout">
        <div className="g-checkout__main">
          {demo}
          <h2 className="g-h3">Choose a payment method</h2>
          <div className="g-paymethods">
            {methodBlock('upi', 'phone', 'UPI', 'Pay with any UPI app',
              <Field label="UPI ID" value={upi} onChange={v => { setUpi(v); setErrors({}) }} onEnter={pay} placeholder="yourname@bank" error={errors.upiId}
                hint="Tip: an ID containing “fail” previews a declined payment." autoComplete="off" autoFocus />)}
            {methodBlock('card', 'card', 'Credit / debit card', 'Visa, Mastercard, RuPay',
              <div className="g-formgrid">
                <Field label="Card number" value={card.number} onChange={setCardField('number')} icon="card" error={errors['card.number']} inputMode="numeric" className="g-span2" />
                <Field label="Expiry" value={card.expiry} onChange={setCardField('expiry')} placeholder="MM/YY" error={errors['card.expiry']} />
                <Field label="CVV" type="password" value={card.cvv} onChange={setCardField('cvv')} placeholder="•••" error={errors['card.cvv']} inputMode="numeric" maxLength={3} />
                <Field label="Name on card" value={card.name} onChange={setCardField('name')} placeholder="As printed on card" className="g-span2" />
              </div>)}
            {methodBlock('netbanking', 'bank', 'Netbanking', 'All major banks',
              <div className="g-banklist">
                {BANKS.map(([bid, name]) => (
                  <button key={bid} type="button" className={`g-bank${bank === bid ? ' is-on' : ''}`} onClick={() => setBank(bid)}>
                    <span className={`g-radio${bank === bid ? ' is-on' : ''}`} /><Icon name="bank" size={18} />{name}
                  </button>
                ))}
              </div>)}
          </div>
          <p className="g-finep"><Icon name="lock" size={14} /> Card details are checked for format only and never stored. This is a demo: no payment provider is called.</p>
        </div>
        <aside className="g-checkout__side g-only-d"><div className="g-sticky"><OrderSummary booking={b} items cta={cta} /></div></aside>
      </div>
      <Dock>
        <div className="g-dock__info"><b className="g-num">{inr(b.total)}</b><span>Demo payment · {{ upi: 'UPI', card: 'Card', netbanking: 'Netbanking' }[method]}</span></div>
        <Button label="Pay now" icon="lock" onClick={pay} />
      </Dock>
      {step != null ? <Processing step={step} total={b.total} /> : null}
      {expired ? <HoldExpiredDialog booking={b} /> : null}
    </>
  )
}

function Processing({ step, total }: { step: number; total: number }) {
  return (
    <Portal to="overlay">
      <div className="g-layer g-layer--center">
        <div className="g-scrim" />
        <div className="g-processing" role="alertdialog" aria-live="assertive" aria-label="Processing payment">
          <div className="g-processing__ring"><span className="g-spinner g-spinner--xl" /><Icon name="lock" size={22} /></div>
          <h2 className="g-h3">Processing {inr(total)}</h2>
          <p className="g-muted">Don't close this window or press back.</p>
          <ol className="g-steps">
            {STEPS.map((s, i) => (
              <li key={s} className={i < step ? 'is-done' : i === step ? 'is-now' : ''}>
                {i < step ? <Icon name="checkCircle" size={18} /> : i === step ? <span className="g-spinner" /> : <i />}{s}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Portal>
  )
}
