import type { ReactNode } from 'react'
import { fmtDate, inr, parseDate, DAYS, MONTHS, time12 } from '../lib/format'
import type { Movie, ShowSummary } from '../lib/types'
import { Icon, PosterArt } from './Svg'

// React versions of the design-system builders. Class names match the design's stylesheet 1:1.

type ButtonProps = {
  label?: ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'hero'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  iconRight?: string
  block?: boolean
  disabled?: boolean
  loading?: boolean
  loadingLabel?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  className?: string
}

export function Button({ label, variant = 'primary', size = 'md', icon, iconRight, block, disabled, loading, loadingLabel, onClick, type = 'button', className }: ButtonProps) {
  const cls = `g-btn g-btn--${variant} g-btn--${size}${block ? ' g-btn--block' : ''}${loading ? ' is-loading' : ''}${className ? ' ' + className : ''}`
  const iconSize = size === 'sm' ? 16 : 18
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} onClick={onClick}>
      {loading ? <span className="g-spinner" aria-hidden="true" /> : icon ? <Icon name={icon} size={iconSize} /> : null}
      <span className="g-btn__label">{loading && loadingLabel ? loadingLabel : label}</span>
      {iconRight && !loading ? <Icon name={iconRight} size={iconSize} /> : null}
    </button>
  )
}

export function IconButton({ icon, label, variant = 'ghost', size = 20, onClick, disabled, className, dot }: {
  icon: string; label: string; variant?: 'ghost' | 'soft' | 'hero'; size?: number; onClick?: () => void; disabled?: boolean; className?: string; dot?: boolean
}) {
  return (
    <button type="button" className={`g-iconbtn g-iconbtn--${variant}${className ? ' ' + className : ''}`} aria-label={label} title={label} onClick={onClick} disabled={disabled}>
      <Icon name={icon} size={size} />
      {dot ? <span className="g-iconbtn__dot" /> : null}
    </button>
  )
}

export function Chip({ label, selected, icon, count, removable, caret, disabled, onClick }: {
  label: string; selected?: boolean; icon?: string | null; count?: number | null; removable?: boolean; caret?: boolean; disabled?: boolean; onClick?: () => void
}) {
  return (
    <button type="button" className={`g-chip${selected ? ' is-selected' : ''}`} aria-pressed={!!selected} onClick={onClick} disabled={disabled}>
      {icon ? <Icon name={icon} size={16} /> : null}
      <span>{label}</span>
      {count ? <span className="g-chip__count">{count}</span> : null}
      {removable ? <Icon name="x" size={14} className="g-chip__x" /> : null}
      {caret ? <Icon name="chevDown" size={16} /> : null}
    </button>
  )
}

export function DatePill({ iso, selected, today, disabled, onClick }: { iso: string; selected?: boolean; today?: boolean; disabled?: boolean; onClick?: () => void }) {
  const d = parseDate(iso)
  return (
    <button type="button" className={`g-datepill${selected ? ' is-selected' : ''}`} aria-pressed={!!selected} disabled={disabled} onClick={onClick}>
      <span className="g-datepill__day">{today ? 'Today' : DAYS[d.getDay()]}</span>
      <span className="g-datepill__date">{d.getDate()}</span>
      <span className="g-datepill__mon">{MONTHS[d.getMonth()]}</span>
    </button>
  )
}

const AVAILABILITY_LABEL = { AVAILABLE: 'Available', FILLING_FAST: 'Filling fast', SOLD_OUT: 'Sold out' }

export function ShowChip({ show, selected, showLang, onClick }: { show: ShowSummary; selected?: boolean; showLang?: boolean; onClick?: () => void }) {
  const av = show.availability
  const sold = av === 'SOLD_OUT'
  return (
    <button type="button" className={`g-show g-show--${av.toLowerCase().replace('_', '-')}${selected ? ' is-selected' : ''}`} disabled={sold} onClick={onClick}
      aria-label={`${time12(show.startTime)}, ${show.language} ${show.format}, ${AVAILABILITY_LABEL[av]}`}>
      <span className="g-show__time">{time12(show.startTime)}</span>
      <span className="g-show__meta">
        {av === 'FILLING_FAST' ? <i className="g-show__flag" aria-hidden="true" /> : null}
        {sold ? 'Sold out' : showLang ? `${show.language.slice(0, 3)} · ${show.format}` : show.format}
      </span>
    </button>
  )
}

export function Badge({ text, tone = 'neutral', icon }: { text: string; tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'access' | 'hero'; icon?: string }) {
  return <span className={`g-badge g-badge--${tone}`}>{icon ? <Icon name={icon} size={12} /> : null}{text}</span>
}

export const Cert = ({ c }: { c: string }) => <span className={`g-cert g-cert--${c.toLowerCase()}`} title={`Certificate ${c}`}>{c}</span>

export function Rating({ movie, big }: { movie: Movie; big?: boolean }) {
  if (!movie.rating) {
    return <span className="g-rating g-rating--soon"><Icon name="heart" size={big ? 16 : 12} />{movie.votes} interested</span>
  }
  return (
    <span className={`g-rating${big ? ' g-rating--big' : ''}`}>
      <Icon name="star" size={big ? 18 : 12} />
      <b>{movie.rating.toFixed(1)}</b>
      {big ? <span>/10 · {movie.votes} ratings</span> : null}
    </span>
  )
}

export function PosterCard({ movie, size, onClick }: { movie: Movie; size?: 'lg' | 'fill'; onClick: () => void }) {
  const soon = movie.status === 'COMING_SOON'
  const langs = movie.languages.slice(0, 3).join(', ') + (movie.languages.length > 3 ? ` +${movie.languages.length - 3}` : '')
  return (
    <button type="button" className={`g-poster${size ? ' g-poster--' + size : ''}`} onClick={onClick} aria-label={movie.title}>
      <span className="g-poster__art">
        <PosterArt movie={movie} />
        {soon ? <span className="g-poster__date">{fmtDate(movie.releaseDate, 'short')}</span> : <span className="g-poster__rating"><Rating movie={movie} /></span>}
      </span>
      <span className="g-poster__title">{movie.title}</span>
      <span className="g-poster__meta"><Cert c={movie.certificate} /><span>{langs}</span></span>
    </button>
  )
}

export function RailHead({ title, link, onLink, children }: { title: string; link?: string; onLink?: () => void; children?: ReactNode }) {
  return (
    <div className="g-railhead">
      <h2 className="g-railhead__title">{title}</h2>
      {onLink ? <button type="button" className="g-link" onClick={onLink}>{link || 'See all'}<Icon name="chevRight" size={16} /></button> : null}
      {children}
    </div>
  )
}

export function Tabs<T extends string>({ items, active, onChange }: { items: Array<{ id: T; label: string; count?: number }>; active: T; onChange: (id: T) => void }) {
  return (
    <div className="g-tabs" role="tablist">
      {items.map(t => (
        <button key={t.id} type="button" role="tab" className={`g-tab${t.id === active ? ' is-active' : ''}`} aria-selected={t.id === active} onClick={() => onChange(t.id)}>
          {t.label}
          {t.count != null ? <span className="g-tab__count">{t.count}</span> : null}
        </button>
      ))}
    </div>
  )
}

export function Segmented<T extends string>({ items, active, onChange }: { items: Array<{ id: T; label: string; icon?: string }>; active: T; onChange: (id: T) => void }) {
  return (
    <div className="g-seg" role="radiogroup">
      {items.map(t => (
        <button key={t.id} type="button" role="radio" className={`g-seg__opt${t.id === active ? ' is-active' : ''}`} aria-checked={t.id === active} onClick={() => onChange(t.id)}>
          {t.icon ? <Icon name={t.icon} size={16} /> : null}
          {t.label}
        </button>
      ))}
    </div>
  )
}

type FieldProps = {
  label?: string
  type?: string
  value: string
  onChange: (v: string) => void
  onEnter?: () => void
  placeholder?: string
  icon?: string
  hint?: string | null
  error?: string | null
  success?: string | null
  trailing?: ReactNode
  disabled?: boolean
  autoFocus?: boolean
  autoComplete?: string
  inputMode?: 'numeric' | 'email' | 'text'
  maxLength?: number
  className?: string
  uppercase?: boolean
}

export function Field({ label, type = 'text', value, onChange, onEnter, placeholder, icon, hint, error, success, trailing, disabled, autoFocus, autoComplete, inputMode, maxLength, className, uppercase }: FieldProps) {
  const state = error ? ' is-error' : success ? ' is-success' : ''
  return (
    <label className={`g-field${state}${className ? ' ' + className : ''}`}>
      {label ? <span className="g-field__label">{label}</span> : null}
      <span className="g-input">
        {icon ? <Icon name={icon} size={18} className="g-input__icon" /> : null}
        <input type={type} value={value} placeholder={placeholder} disabled={disabled} autoFocus={autoFocus} autoComplete={autoComplete}
          inputMode={inputMode} maxLength={maxLength} aria-invalid={!!error} spellCheck={false}
          style={uppercase ? { textTransform: 'uppercase' } : undefined}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter() } }} />
        {trailing}
      </span>
      {error ? <span className="g-field__msg g-field__msg--error"><Icon name="alertCircle" size={14} />{error}</span>
        : success ? <span className="g-field__msg g-field__msg--success"><Icon name="checkCircle" size={14} />{success}</span>
          : hint ? <span className="g-field__msg">{hint}</span> : null}
    </label>
  )
}

export function Stepper({ value, max = 10, onChange, addLabel, disabled }: { value: number; max?: number; onChange: (v: number) => void; addLabel?: string; disabled?: boolean }) {
  if (!value && addLabel) {
    return <Button label={addLabel} variant="outline" size="sm" icon="plus" className="g-stepper-add" disabled={disabled} onClick={() => onChange(1)} />
  }
  return (
    <div className="g-stepper" role="group" aria-label="Quantity">
      <button type="button" className="g-stepper__btn" aria-label="Decrease" disabled={disabled || value <= 0} onClick={() => onChange(value - 1)}><Icon name="minus" size={16} /></button>
      <span className="g-stepper__val" aria-live="polite">{value}</span>
      <button type="button" className="g-stepper__btn" aria-label="Increase" disabled={disabled || value >= max} onClick={() => onChange(value + 1)}><Icon name="plus" size={16} /></button>
    </div>
  )
}

export function Skel({ w, h, r, className }: { w: number | string; h: number | string; r?: string; className?: string }) {
  return <span className={`g-skel${className ? ' ' + className : ''}`} style={{ width: typeof w === 'number' ? w + 'px' : w, height: typeof h === 'number' ? h + 'px' : h, borderRadius: r }} />
}

export function EmptyState({ icon = 'info', art, tone = 'neutral', title, text, actions, className }: {
  icon?: string; art?: ReactNode; tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger'; title: string; text: ReactNode; actions?: ReactNode; className?: string
}) {
  return (
    <div className={`g-empty${className ? ' ' + className : ''}`}>
      <div className={`g-empty__art g-empty__art--${tone}`}>{art || <Icon name={icon} size={32} />}</div>
      <h3 className="g-empty__title">{title}</h3>
      <p className="g-empty__text">{text}</p>
      {actions ? <div className="g-empty__actions">{actions}</div> : null}
    </div>
  )
}

const AMENITIES = { parking: ['parking', 'Parking'], food: ['food', 'Food court'], wheelchair: ['wheelchair', 'Wheelchair access'] } as const

export function Amenity({ a }: { a: keyof typeof AMENITIES }) {
  const [icon, label] = AMENITIES[a]
  return <span className={`g-amenity${a === 'wheelchair' ? ' g-amenity--access' : ''}`} title={label}><Icon name={icon} size={14} /><span>{label}</span></span>
}

export function SeatLegend() {
  const items: Array<[string, string]> = [['available', 'Available'], ['selected', 'Selected'], ['held', 'Held by others'], ['booked', 'Booked'], ['wc', 'Wheelchair']]
  return (
    <div className="g-legend">
      {items.map(([k, label]) => (
        <span key={k} className="g-legend__item"><i className={`g-legend__sw g-legend__sw--${k}`}>{k === 'wc' ? <Icon name="wheelchair" size={10} /> : null}</i>{label}</span>
      ))}
    </div>
  )
}

export function ShowLegend() {
  return (
    <div className="g-legend g-legend--shows">
      <span className="g-legend__item"><i className="g-dot g-dot--available" />Available</span>
      <span className="g-legend__item"><i className="g-dot g-dot--fast" />Filling fast</span>
      <span className="g-legend__item"><i className="g-dot g-dot--sold" />Sold out</span>
    </div>
  )
}

export const Money = ({ n, minus }: { n: number; minus?: boolean }) => <>{inr(n, { minus })}</>
