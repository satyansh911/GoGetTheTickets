import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, matchPath } from 'react-router'
import { Icon, Logo, Mark } from '../components/Svg'
import { Button, IconButton } from '../components/ui'
import { initials } from '../lib/format'
import { AuthDialog } from '../overlays/AuthDialog'
import { CityPicker } from '../overlays/CityPicker'
import { SearchOverlay } from '../overlays/SearchOverlay'
import { useAuth } from '../state/auth'
import { useCity } from '../state/queries'
import { useUi } from '../state/ui'
import { SlotsContext, type Slots } from './shell'

const TOP_LEVEL: Record<string, string> = { '/': 'home', '/movies': 'movies', '/bookings': 'bookings', '/profile': 'profile' }

function routeName(pathname: string): string {
  if (TOP_LEVEL[pathname]) return TOP_LEVEL[pathname]
  if (matchPath('/shows/:id/seats', pathname)) return 'seats'
  if (matchPath('/checkout/:id', pathname)) return 'checkout'
  if (matchPath('/checkout/:id/pay', pathname)) return 'payment'
  if (matchPath('/movies/:id/showtimes', pathname)) return 'shows'
  if (matchPath('/movies/:id', pathname)) return 'movie'
  if (matchPath('/tickets/:id', pathname)) return 'ticket'
  if (matchPath('/bookings/:id', pathname)) return 'booking'
  return 'page'
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const ui = useUi()
  const [slots, setSlots] = useState<Slots>({ mbar: null, dock: null, overlay: null, main: null })
  // One stable ref callback per slot. A new callback each render would make React detach
  // and re-attach the ref every time, updating state and rendering forever.
  const refs = useMemo(() => {
    const make = (key: keyof Slots) => (el: HTMLElement | null) => setSlots(s => (s[key] === el ? s : { ...s, [key]: el }))
    return { mbar: make('mbar'), dock: make('dock'), overlay: make('overlay'), main: make('main') }
  }, [])
  const slot = (key: keyof Slots) => refs[key]
  const route = routeName(pathname)
  const topLevel = route in { home: 1, movies: 1, bookings: 1, profile: 1 }

  // New page starts at the top.
  useEffect(() => {
    slots.main?.scrollTo({ top: 0 })
  }, [pathname, slots.main])

  // "/" focuses search, as the desktop search box hints.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      if (e.key === '/' && !typing && !ui.overlay) {
        e.preventDefault()
        ui.openSearch()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ui])

  return (
    <SlotsContext.Provider value={slots}>
      <div className="g-app" data-route={route}>
        <header className="g-top">
          <DesktopHeader route={route} />
          {topLevel ? <TopMobileBar route={route} /> : null}
          <div ref={slot('mbar')} style={{ display: 'contents' }} />
        </header>
        <main className={`g-main${route === 'seats' ? ' is-fixed' : ''}`} tabIndex={-1} ref={slot('main')}>
          {children}
        </main>
        <div className="g-dockslot" ref={slot('dock')} />
        <nav className="g-bnavslot" aria-label="Primary">{topLevel ? <BottomNav route={route} /> : null}</nav>
        <div className="g-overlayslot" ref={slot('overlay')} />
        <div className="g-toasts" aria-live="polite">
          {ui.toasts.map(t => (
            <div key={t.id} className={`g-toast g-toast--${t.tone || 'neutral'}${t.leaving ? ' is-leaving' : ''}`} role="status">
              <Icon name={t.icon || { success: 'checkCircle', warning: 'alert', danger: 'alertCircle', neutral: 'info' }[t.tone || 'neutral']} size={18} />
              <span className="g-toast__text">{t.text}</span>
            </div>
          ))}
        </div>
        {ui.overlay?.type === 'auth' ? <AuthDialog mode={ui.overlay.mode} onDone={ui.overlay.onDone} /> : null}
        {ui.overlay?.type === 'city' ? <CityPicker /> : null}
        {ui.overlay?.type === 'search' ? <SearchOverlay /> : null}
      </div>
    </SlotsContext.Provider>
  )
}

function AvatarButton() {
  const { user } = useAuth()
  const ui = useUi()
  const navigate = useNavigate()
  if (user) {
    return <button type="button" className="g-avatar" onClick={() => navigate('/profile')} aria-label={`Profile: ${user.name}`}>{initials(user.name)}</button>
  }
  return <Button label="Sign in" variant="secondary" size="sm" onClick={() => ui.openAuth()} />
}

function DesktopHeader({ route }: { route: string }) {
  const navigate = useNavigate()
  const ui = useUi()
  const city = useCity()
  const links: Array<[string, string, string]> = [['home', '/', 'Home'], ['movies', '/movies', 'Movies'], ['bookings', '/bookings', 'My bookings']]
  return (
    <div className="g-hdr g-only-d">
      <div className="g-wrap g-hdr__in">
        <button type="button" className="g-hdr__logo" onClick={() => navigate('/')} aria-label="GoGetTheTickets home"><Logo /></button>
        <button type="button" className="g-citybtn" onClick={ui.openCity}><Icon name="pin" size={16} /><span>{city.name}</span><Icon name="chevDown" size={16} /></button>
        <nav className="g-hdr__nav">
          {links.map(([id, to, label]) => (
            <button key={id} type="button" className={`g-hdr__link${route === id ? ' is-active' : ''}`} onClick={() => navigate(to)}>{label}</button>
          ))}
        </nav>
        <button type="button" className="g-searchbox" onClick={ui.openSearch}><Icon name="search" size={18} /><span>Search movies, cinemas, languages…</span><kbd>/</kbd></button>
        <AvatarButton />
      </div>
    </div>
  )
}

function TopMobileBar({ route }: { route: string }) {
  const ui = useUi()
  const { user } = useAuth()
  const city = useCity()
  const titles: Record<string, string> = { movies: 'Movies', bookings: 'My bookings', profile: 'Profile' }
  return (
    <div className="g-mbar g-only-m">
      {route === 'home' ? (
        <button type="button" className="g-mbar__city" onClick={ui.openCity}>
          <Mark size={32} />
          <span><small>Your city</small><b>{city.name}<Icon name="chevDown" size={16} /></b></span>
        </button>
      ) : <h1 className="g-mbar__title g-mbar__title--big">{titles[route]}</h1>}
      <span className="g-mbar__actions">
        {route === 'home' ? <IconButton icon="search" label="Search" onClick={ui.openSearch} /> : null}
        {user ? <AvatarButton /> : <IconButton icon="user" label="Sign in" onClick={() => ui.openAuth()} />}
      </span>
    </div>
  )
}

function BottomNav({ route }: { route: string }) {
  const navigate = useNavigate()
  const ui = useUi()
  const items: Array<[string, string, string, () => void]> = [
    ['home', 'home', 'Home', () => navigate('/')],
    ['search', 'search', 'Search', ui.openSearch],
    ['bookings', 'ticket', 'Tickets', () => navigate('/bookings')],
    ['profile', 'user', 'Profile', () => navigate('/profile')],
  ]
  return (
    <div className="g-bnav g-only-m">
      {items.map(([id, icon, label, go]) => {
        const on = route === id
        return (
          <button key={id} type="button" className={`g-bnav__item${on ? ' is-active' : ''}`} aria-current={on ? 'page' : undefined} onClick={go}>
            <span className="g-bnav__icon"><Icon name={icon} size={22} /></span>{label}
          </button>
        )
      })}
    </div>
  )
}

export function Footer() {
  const ui = useUi()
  const navigate = useNavigate()
  const soon = (what: string) => () => ui.toast({ icon: 'info', text: `${what} is coming soon` })
  const col = (title: string, items: Array<[string, () => void]>) => (
    <div className="g-foot__col">
      <h4>{title}</h4>
      {items.map(([label, go]) => <button key={label} type="button" onClick={go}>{label}</button>)}
    </div>
  )
  return (
    <footer className="g-foot">
      <div className="g-wrap">
        <div className="g-foot__top">
          <div className="g-foot__brand"><Logo /><p>Book movies in seconds. Pick the perfect seat, add popcorn, walk in with a QR.</p></div>
          {col('Movies', [['Now showing', () => navigate('/movies')], ['Coming soon', () => navigate('/movies?tab=soon')], ['IMAX & 4DX', () => navigate('/movies?format=IMAX')], ['Cinemas', ui.openSearch]])}
          {col('Help', [['FAQs', soon('FAQs')], ['Cancellation policy', soon('The cancellation policy page')], ['Contact us', soon('Contact')]])}
          {col('Company', [['About', soon('About')], ['GitHub', () => window.open('https://github.com/satyansh911/GoGetTheTickets', '_blank', 'noopener')], ['Press', soon('Press')]])}
        </div>
        <div className="g-foot__bottom"><span>© 2026 GoGetTheTickets · Demo project</span><span>All movies, cinemas and people shown are fictional. Payments are simulated.</span></div>
      </div>
    </footer>
  )
}
