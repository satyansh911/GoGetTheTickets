import { useState } from 'react'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Svg'
import { Button, Field, Segmented } from '../components/ui'
import { ApiError } from '../lib/api'
import { useAuth } from '../state/auth'
import { useUi } from '../state/ui'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type Errors = { name?: string; email?: string; password?: string; form?: string }

export function AuthDialog({ mode: initialMode, onDone }: { mode: 'signin' | 'signup'; onDone?: () => void }) {
  const ui = useUi()
  const auth = useAuth()
  const [mode, setMode] = useState(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)
  const up = mode === 'signup'

  async function submit() {
    if (loading) return
    const er: Errors = {}
    if (up && !name.trim()) er.name = 'Tell us your name'
    if (!EMAIL.test(email.trim())) er.email = email ? 'Enter a valid email address' : 'Email is required'
    if (up ? password.length < 8 : !password) er.password = password ? 'Password must be at least 8 characters' : 'Password is required'
    setErrors(er)
    if (Object.keys(er).length) return

    setLoading(true)
    try {
      const user = up ? await auth.signUp(name.trim(), email.trim(), password) : await auth.signIn(email.trim(), password)
      ui.closeOverlay()
      ui.toast({ tone: 'success', text: <>{up ? 'Welcome to GoGetTheTickets, ' : 'Welcome back, '}<b>{user.name.split(' ')[0]}</b></> })
      onDone?.()
    } catch (e) {
      const err = e instanceof ApiError ? e : null
      if (err?.code === 'EMAIL_TAKEN') setErrors({ email: err.message })
      else if (err?.fields && Object.keys(err.fields).length) setErrors(err.fields)
      else setErrors({ form: err?.message || 'Something went wrong. Try again.' })
      setLoading(false)
    }
  }

  const pwToggle = (
    <button type="button" className="g-input__btn g-input__eye" aria-label={`${showPw ? 'Hide' : 'Show'} password`} onClick={() => setShowPw(s => !s)}>
      <Icon name={showPw ? 'eyeOff' : 'eye'} size={18} />
    </button>
  )

  return (
    <Dialog title={up ? 'Join GoGetTheTickets' : 'Welcome back'} subtitle={up ? 'Faster checkout and all your tickets in one place' : 'Sign in to book faster'}
      onClose={ui.closeOverlay}>
      <Segmented items={[{ id: 'signin', label: 'Sign in' }, { id: 'signup', label: 'Create account' }]} active={mode}
        onChange={m => { setMode(m); setErrors({}) }} />
      <div className="g-authform">
        {errors.form ? <div className="g-alert g-alert--danger"><Icon name="alertCircle" size={18} /><span>{errors.form}</span></div> : null}
        {up ? <Field label="Full name" value={name} onChange={setName} onEnter={submit} placeholder="Your name" icon="user" error={errors.name}
          autoComplete="name" autoFocus disabled={loading} /> : null}
        <Field label="Email" type="email" value={email} onChange={setEmail} onEnter={submit} placeholder="you@example.com" icon="mail" error={errors.email}
          autoComplete="email" autoFocus={!up} disabled={loading} />
        <Field label="Password" type={showPw ? 'text' : 'password'} value={password} onChange={setPassword} onEnter={submit}
          placeholder={up ? 'At least 8 characters' : 'Your password'} icon="lock" error={errors.password} trailing={pwToggle}
          hint={up ? 'Use 8 or more characters.' : null} autoComplete={up ? 'new-password' : 'current-password'} disabled={loading} />
        {up ? null : (
          <button type="button" className="g-link g-forgot" onClick={() => ui.toast({ icon: 'mail', text: 'Password reset is coming soon' })}>Forgot password?</button>
        )}
        <Button label={up ? 'Create account' : 'Sign in'} size="lg" block loading={loading} loadingLabel={up ? 'Creating account…' : 'Signing in…'} onClick={submit} />
        <p className="g-finep g-center">Your password is stored as a BCrypt hash. This is a demo project; payments are simulated.</p>
      </div>
    </Dialog>
  )
}
