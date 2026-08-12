import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { Icon, ScreenCurve } from '../components/Svg'
import { Button, EmptyState, IconButton, SeatLegend, ShowChip, Skel } from '../components/ui'
import { BackBar, Dock, useTitle } from '../layout/shell'
import { api, ApiError } from '../lib/api'
import { dayLabel, inr, time12 } from '../lib/format'
import type { Seat, SeatMap, ShowDetails, TierInfo } from '../lib/types'
import { CountPicker } from '../overlays/CountPicker'
import { useAuth } from '../state/auth'
import { useUi } from '../state/ui'
import { NotFound } from './NotFound'

/** Keyed by show, so switching showtime starts a fresh selection. */
export function Seats() {
  return <SeatsForShow key={useParams().id} />
}

function SeatsForShow() {
  const showId = Number(useParams().id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const ui = useUi()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const count = Math.min(10, Math.max(1, Number(params.get('count')) || 2))
  const [selected, setSelected] = useState<string[]>([])
  const [flash, setFlash] = useState<string[]>([])
  const [countOpen, setCountOpen] = useState(false)
  const [holding, setHolding] = useState(false)

  const showQ = useQuery({ queryKey: ['show', showId], queryFn: () => api.show(showId), enabled: Number.isFinite(showId) })
  // Poll so seats others take show up while you choose.
  const seatsQ = useQuery({ queryKey: ['seats', showId, user?.id ?? null], queryFn: () => api.seats(showId), enabled: Number.isFinite(showId), refetchInterval: 4000 })
  const show = showQ.data
  const map = seatsQ.data
  useTitle(show ? `Pick seats · ${show.movie.title}` : 'Pick seats')


  const byId = useCallback((m: SeatMap | undefined) => {
    const out = new Map<string, Seat>()
    m?.rows.forEach(r => r.seats.forEach(s => out.set(s.id, s)))
    return out
  }, [])

  const taken = useCallback((ids: string[]) => {
    if (!ids.length) return
    setSelected(s => s.filter(id => !ids.includes(id)))
    setFlash(ids)
    setTimeout(() => setFlash([]), 1600)
    ui.toast({ tone: 'warning', duration: 4600, text: <>{ids.length === 1 ? <>Seat <b>{ids[0]}</b> was</> : <>Seats <b>{ids.join(', ')}</b> were</>} just taken by someone else. Pick another seat.</> })
  }, [ui])

  // A refresh shows one of our picks is no longer free: drop it and say so.
  useEffect(() => {
    const seats = byId(map)
    const lost = selected.filter(id => seats.get(id) && seats.get(id)!.status !== 'AVAILABLE')
    if (lost.length) taken(lost)
  }, [map]) // eslint-disable-line react-hooks/exhaustive-deps

  if ((showQ.error instanceof ApiError && showQ.error.status === 404) || !Number.isFinite(showId)) return <NotFound />

  const back = () => (show ? navigate(`/movies/${show.movie.id}/showtimes?date=${show.date}`) : navigate(-1))
  const sub = show ? `${show.cinema.chain} · ${dayLabel(show.date)}, ${time12(show.startTime)}` : undefined
  const countChip = (
    <button type="button" className="g-countchip" onClick={() => setCountOpen(true)}>
      {count} ticket{count > 1 ? 's' : ''}<Icon name="edit" size={14} />
    </button>
  )
  const header = <BackBar title={show?.movie.title ?? 'Pick seats'} sub={sub} actions={countChip} onBack={back} />

  if (!show || !map) return <>{header}<SeatsSkeleton /></>

  const tiers = new Map(show.tiers.map(t => [t.id, t]))
  const free = show.tiers.reduce((n, t) => n + t.available, 0)
  if (free === 0 && !selected.length) return <>{header}<SoldOut show={show} count={count} /></>

  const seats = byId(map)
  const pickedSeats = selected.map(id => seats.get(id)).filter((s): s is Seat => !!s)
  const need = count - pickedSeats.length

  function toggle(seat: Seat) {
    if (selected.includes(seat.id)) {
      setSelected(selected.filter(id => id !== seat.id))
      return
    }
    if (seat.status !== 'AVAILABLE') return
    // Tap one seat and we fill the ones beside it, within the same block (no jumping aisles).
    let next = selected.length >= count ? [] : [...selected]
    const row = map!.rows.find(r => r.row === seat.row)!
    const tier = tiers.get(row.tier)!
    const idx = row.seats.findIndex(s => s.id === seat.id)
    let blockEnd = 0
    let acc = 0
    for (const b of tier.blocks) { acc += b; if (idx < acc) { blockEnd = acc; break } }
    let remaining = count - next.length
    for (let i = idx; i < blockEnd && remaining > 0; i++) {
      const s = row.seats[i]
      if (s.status !== 'AVAILABLE' || next.includes(s.id)) break
      next = [...next, s.id]
      remaining--
    }
    setSelected(next)
  }

  async function proceed() {
    if (pickedSeats.length !== count || holding) return
    setHolding(true)
    try {
      const booking = await api.hold(showId, selected)
      queryClient.setQueryData(['booking', booking.bookingId], booking)
      navigate(`/checkout/${booking.bookingId}`)
    } catch (e) {
      const err = e as ApiError
      if (err.code === 'SEATS_UNAVAILABLE') {
        taken(((err.details as { seats?: string[] })?.seats) ?? [])
        seatsQ.refetch()
      } else if (err.code === 'SHOW_STARTED') {
        ui.toast({ tone: 'warning', text: err.message })
        back()
      } else if (err.status !== 401) {
        ui.toast({ tone: 'danger', text: err.message })
      }
    } finally {
      setHolding(false)
    }
  }

  const onProceed = () => (user ? proceed() : ui.openAuth('signin', proceed))
  const total = pickedSeats.reduce((s, x) => s + x.price, 0)
  const tierCounts = new Map<string, number>()
  pickedSeats.forEach(s => tierCounts.set(s.tier, (tierCounts.get(s.tier) ?? 0) + 1))
  const tierText = [...tierCounts].map(([t, n]) => `${n} × ${tiers.get(t as TierInfo['id'])!.label}`).join(', ')
  const others = show.otherShows.filter(s => s.availability !== 'SOLD_OUT')

  return (
    <>
      {header}
      <div className="g-seats">
        <div className="g-seats__top">
          <div className="g-wrap">
            <div className="g-seats__head g-only-d">
              <div>
                <h1 className="g-h2">{show.movie.title}</h1>
                <p className="g-muted">{show.cinema.name} · {show.screen} · {dayLabel(show.date)}, {time12(show.startTime)} · {show.language} {show.format}</p>
              </div>
              {countChip}
            </div>
            <div className="g-chips g-seats__shows">
              {others.map(s => <ShowChip key={s.id} show={s} selected={s.id === show.id} onClick={() => s.id !== show.id && navigate(`/shows/${s.id}/seats?count=${count}`, { replace: true })} />)}
            </div>
          </div>
        </div>
        <SeatCanvas map={map} tiers={tiers} selected={selected} flash={flash} onSeat={toggle} />
        <div className="g-seats__legend"><div className="g-wrap"><SeatLegend /><span className="g-seats__hint g-only-m">Pinch to zoom · drag to pan</span></div></div>
      </div>
      <Dock desktop>
        <div className="g-dock__info">
          {pickedSeats.length ? (
            <><b className="g-seatlist">{pickedSeats.map(s => <span key={s.id}>{s.id}</span>)}</b><span>{tierText}{need > 0 ? ` · pick ${need} more` : ''}</span></>
          ) : (
            <><b>Select {count} seat{count > 1 ? 's' : ''}</b><span>Tap a seat — we'll fill the ones beside it</span></>
          )}
        </div>
        <div className="g-dock__cta">
          {pickedSeats.length ? <span className="g-dock__total g-num">{inr(total)}</span> : null}
          <Button label={need > 0 && pickedSeats.length ? `Select ${need} more` : 'Proceed'} disabled={need !== 0} loading={holding} loadingLabel="Holding seats…"
            iconRight={need === 0 ? 'arrowRight' : undefined} onClick={onProceed} />
        </div>
      </Dock>
      {countOpen ? (
        <CountPicker showId={showId} initial={count} onClose={() => setCountOpen(false)}
          onConfirm={n => { setCountOpen(false); if (selected.length > n) setSelected([]); setParams({ count: String(n) }, { replace: true }); ui.toast({ icon: 'seat', text: <>Pick <b>{n}</b> seat{n > 1 ? 's' : ''}</> }) }} />
      ) : null}
    </>
  )
}

function SeatCanvas({ map, tiers, selected, flash, onSeat }: {
  map: SeatMap; tiers: Map<string, TierInfo>; selected: string[]; flash: string[]; onSeat: (s: Seat) => void
}) {
  const vp = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLDivElement>(null)
  const zoom = useRef<number | null>(null)
  const fit = useRef(1)
  const [label, setLabel] = useState('100%')

  const apply = useCallback(() => {
    if (!cv.current || zoom.current == null) return
    cv.current.style.setProperty('zoom', String(zoom.current))
    setLabel(Math.round((zoom.current / (fit.current || 1)) * 100) + '%')
  }, [])

  const setZoom = useCallback((z: number) => {
    const v = vp.current
    const min = fit.current * 0.9
    const max = Math.max(2, fit.current * 2.6)
    const old = zoom.current ?? 1
    const next = Math.max(min, Math.min(max, z))
    if (!v) return
    const cx = (v.scrollLeft + v.clientWidth / 2) / old
    const cy = (v.scrollTop + v.clientHeight / 2) / old
    zoom.current = next
    apply()
    v.scrollLeft = cx * next - v.clientWidth / 2
    v.scrollTop = cy * next - v.clientHeight / 2
  }, [apply])

  // Fit the hall to the viewport on first render and on resize.
  useLayoutEffect(() => {
    const fitNow = () => {
      const v = vp.current
      const c = cv.current
      if (!v || !c) return
      c.style.setProperty('zoom', '1')
      fit.current = Math.min(1, (v.clientWidth - 8) / c.scrollWidth)
      const fitH = (v.clientHeight - 8) / c.scrollHeight
      zoom.current = Math.min(1, Math.max(fit.current, Math.min(fitH, fit.current * 1.6)))
      apply()
      v.scrollLeft = (v.scrollWidth - v.clientWidth) / 2
    }
    fitNow()
    window.addEventListener('resize', fitNow)
    return () => window.removeEventListener('resize', fitNow)
  }, [apply])

  // Pinch to zoom on touch; ctrl/⌘ + wheel (trackpad pinch) on desktop.
  useEffect(() => {
    const v = vp.current
    if (!v) return
    const pts = new Map<number, { x: number; y: number }>()
    let d0 = 0
    let z0 = 1
    const dist = () => {
      const [a, b] = [...pts.values()]
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
    }
    const down = (e: PointerEvent) => { pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 2) { d0 = dist(); z0 = zoom.current ?? 1 } }
    const move = (e: PointerEvent) => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 2 && d0) setZoom(z0 * dist() / d0) }
    const up = (e: PointerEvent) => { pts.delete(e.pointerId); if (pts.size < 2) d0 = 0 }
    const wheel = (e: WheelEvent) => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); setZoom((zoom.current ?? 1) * (e.deltaY < 0 ? 1.1 : 0.9)) }
    v.addEventListener('pointerdown', down)
    v.addEventListener('pointermove', move)
    v.addEventListener('pointerup', up)
    v.addEventListener('pointercancel', up)
    v.addEventListener('pointerleave', up)
    v.addEventListener('wheel', wheel, { passive: false })
    return () => {
      v.removeEventListener('pointerdown', down)
      v.removeEventListener('pointermove', move)
      v.removeEventListener('pointerup', up)
      v.removeEventListener('pointercancel', up)
      v.removeEventListener('pointerleave', up)
      v.removeEventListener('wheel', wheel)
    }
  }, [setZoom])

  const tierStarts = new Set(map.rows.filter((r, i) => i === 0 || map.rows[i - 1].tier !== r.tier).map(r => r.row))
  return (
    <>
      <div className="g-seatvp" ref={vp}>
        <div className="g-seatcanvas" ref={cv}>
          <div className="g-seatmap">
            {map.rows.map(r => {
              const tier = tiers.get(r.tier)!
              let i = 0
              return (
                <div key={r.row} style={{ display: 'contents' }}>
                  {tierStarts.has(r.row) ? <div className="g-seatmap__tier"><span className="g-seatmap__tierlabel">{tier.label} · {inr(tier.price)}</span></div> : null}
                  <div className="g-seatrow">
                    <span className="g-seatrow__label">{r.row}</span>
                    <div className="g-seatrow__seats">
                      {tier.blocks.map((b, bi) => {
                        const block = r.seats.slice(i, i + b)
                        i += b
                        return (
                          <span key={bi} style={{ display: 'contents' }}>
                            {bi ? <span className="g-seatrow__aisle" aria-hidden="true" /> : null}
                            {block.map(s => <SeatButton key={s.id} seat={s} tier={tier} selected={selected.includes(s.id)} flash={flash.includes(s.id)} onClick={() => onSeat(s)} />)}
                          </span>
                        )
                      })}
                    </div>
                    <span className="g-seatrow__label">{r.row}</span>
                  </div>
                </div>
              )
            })}
            <div className="g-screen"><ScreenCurve /><span className="g-screen__label">All eyes this way</span></div>
          </div>
        </div>
      </div>
      <div className="g-zoom">
        <IconButton icon="zoomOut" label="Zoom out" variant="soft" onClick={() => setZoom((zoom.current ?? 1) * 0.8)} />
        <button type="button" className="g-zoom__lbl" title="Fit to screen" onClick={() => { zoom.current = fit.current; apply() }}>{label}</button>
        <IconButton icon="zoomIn" label="Zoom in" variant="soft" onClick={() => setZoom((zoom.current ?? 1) * 1.25)} />
      </div>
    </>
  )
}

const STATUS_WORDS = { AVAILABLE: 'available', HELD: 'held by someone else', BOOKED: 'booked' }

function SeatButton({ seat, tier, selected, flash, onClick }: { seat: Seat; tier: TierInfo; selected: boolean; flash: boolean; onClick: () => void }) {
  const state = selected ? 'selected' : seat.status.toLowerCase()
  const disabled = seat.status !== 'AVAILABLE' && !selected
  const label = `${seat.id}, ${tier.label} ${inr(seat.price)}, ${selected ? 'selected' : STATUS_WORDS[seat.status]}${seat.wheelchair ? ', wheelchair accessible' : ''}`
  return (
    <button type="button" className={`g-seat g-seat--${state}${seat.wheelchair ? ' g-seat--wc' : ''}${tier.wide ? ' g-seat--wide' : ''}${flash ? ' is-flash' : ''}`}
      disabled={disabled} aria-pressed={selected} aria-label={label} onClick={onClick}>
      {seat.wheelchair ? <Icon name="wheelchair" size={14} /> : <span>{seat.number}</span>}
    </button>
  )
}

function SoldOut({ show, count }: { show: ShowDetails; count: number }) {
  const navigate = useNavigate()
  const others = show.otherShows.filter(s => s.availability !== 'SOLD_OUT' && s.id !== show.id)
  return (
    <div className="g-wrap g-narrow">
      <EmptyState art={<div className="g-housefull">{Array.from({ length: 24 }, (_, i) => <i key={i} />)}</div>}
        title="Housefull! This show just sold out"
        text={`Every seat for ${time12(show.startTime)} has been booked. Try another showtime — they are going fast.`}
        actions={<Button label="See all showtimes" icon="clock" onClick={() => navigate(`/movies/${show.movie.id}/showtimes?date=${show.date}`)} />} />
      {others.length ? (
        <div className="g-card g-soldalt">
          <h3 className="g-card__title">Other shows at {show.cinema.chain}</h3>
          <div className="g-chips g-chips--wrap">{others.map(s => <ShowChip key={s.id} show={s} onClick={() => navigate(`/shows/${s.id}/seats?count=${count}`, { replace: true })} />)}</div>
        </div>
      ) : null}
    </div>
  )
}

function SeatsSkeleton() {
  const rows = [12, 12, 18, 18, 18, 18, 18, 18, 18, 18]
  return (
    <div className="g-seats" aria-busy="true">
      <div className="g-seats__top"><div className="g-wrap"><div className="g-chips">{[1, 2, 3, 4].map(k => <Skel key={k} w={100} h={54} r="8px" />)}</div></div></div>
      <div className="g-seatvp g-seatvp--skel">
        <div className="g-seatcanvas">
          <div className="g-seatmap">
            {rows.map((n, r) => (
              <div key={r} style={{ display: 'contents' }}>
                <div className="g-seatrow"><div className="g-seatrow__seats">{Array.from({ length: n }, (_, i) => <Skel key={i} w={n === 12 ? 46 : 28} h={28} r="7px" />)}</div></div>
                {r === 1 || r === 6 ? <div style={{ height: 24 }} /> : null}
              </div>
            ))}
            <div className="g-screen"><Skel w="100%" h={10} r="6px" /></div>
          </div>
        </div>
      </div>
    </div>
  )
}
