import { useNavigate } from 'react-router'
import { Icon } from '../components/Svg'
import { Button, Segmented } from '../components/ui'
import { useTitle } from '../layout/shell'
import { initials, MONTHS } from '../lib/format'
import { useAuth } from '../state/auth'
import { usePrefs, type Theme } from '../state/prefs'
import { useUi } from '../state/ui'

export function Profile() {
  useTitle('Profile')
  const navigate = useNavigate()
  const ui = useUi()
  const { user, signOut } = useAuth()
  const prefs = usePrefs()

  const since = user ? new Date(user.memberSince) : null
  const head = user ? (
    <div className="g-profilehead">
      <span className="g-avatar g-avatar--xl">{initials(user.name)}</span>
      <div>
        <h1 className="g-h2">{user.name}</h1>
        <p className="g-muted">{user.email}</p>
        <p className="g-subtle g-small">Member since {MONTHS[since!.getMonth()]} {since!.getFullYear()} · {user.bookings} booking{user.bookings === 1 ? '' : 's'}</p>
      </div>
    </div>
  ) : (
    <div className="g-card g-signinprompt">
      <span className="g-avatar g-avatar--xl g-avatar--ghost"><Icon name="user" size={32} /></span>
      <div><h2 className="g-h3">Sign in for faster checkout</h2><p className="g-muted">Save your details and keep all your tickets in one place, on any device.</p></div>
      <div className="g-signinprompt__cta"><Button label="Sign in" onClick={() => ui.openAuth()} /><Button label="Create account" variant="outline" onClick={() => ui.openAuth('signup')} /></div>
    </div>
  )
  const soon = (what: string) => () => ui.toast({ icon: 'info', text: `${what} is coming soon` })
  const rows: Array<[string, string, () => void]> = [
    ['ticket', 'My bookings', () => navigate('/bookings')],
    ['card', 'Saved payment methods', soon('Saved payment methods')],
    ['bell', 'Notifications', soon('Notifications')],
    ['help', 'Help & support', soon('Help & support')],
  ]

  return (
    <div className="g-wrap g-narrow g-profile">
      {head}
      <div className="g-card">
        <h3 className="g-card__title">Appearance</h3>
        <p className="g-card__sub" style={{ marginBottom: 12 }}>Dark is our home turf — lights down, show on.</p>
        <Segmented<Theme> items={[{ id: 'dark', label: 'Dark', icon: 'moon' }, { id: 'light', label: 'Light', icon: 'sun' }, { id: 'system', label: 'Auto', icon: 'sparkle' }]}
          active={prefs.theme} onChange={prefs.setTheme} />
      </div>
      <div className="g-card g-card--flush g-menu">
        {rows.map(([icon, label, go]) => (
          <button key={label} type="button" className="g-menu__row" onClick={go}><Icon name={icon} size={20} /><span>{label}</span><Icon name="chevRight" size={18} /></button>
        ))}
      </div>
      {user ? <Button label="Sign out" variant="danger" icon="logout" block onClick={() => { signOut(); ui.toast({ icon: 'logout', text: 'Signed out' }) }} /> : null}
      <p className="g-finep g-center">GoGetTheTickets · Spring Boot + React demo · Payments are simulated</p>
    </div>
  )
}
