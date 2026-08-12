import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { Avatar, BackdropArt, Icon, PosterArt } from '../components/Svg'
import { Badge, Button, Cert, IconButton, PosterCard, Rating, RailHead, Skel } from '../components/ui'
import { BackBar, Dock, useTitle } from '../layout/shell'
import { api, ApiError } from '../lib/api'
import { fmtDate, runtime } from '../lib/format'
import type { CastMember, Movie } from '../lib/types'
import { TrailerDialog } from '../overlays/TrailerDialog'
import { usePrefs } from '../state/prefs'
import { useMovies } from '../state/queries'
import { useUi } from '../state/ui'
import { shareLink } from '../lib/share'
import { NotFound } from './NotFound'

const CERT_NAMES: Record<string, string> = { U: 'Universal', UA: 'Parental guidance under 12', A: 'Adults only' }

export function MovieDetails() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const ui = useUi()
  const prefs = usePrefs()
  const { data: movie, error } = useQuery({ queryKey: ['movie', id], queryFn: () => api.movie(id), staleTime: 60 * 60 * 1000 })
  const { data: all = [] } = useMovies()
  const [readMore, setReadMore] = useState(false)
  const [trailer, setTrailer] = useState(false)
  useTitle(movie?.title)

  if (error instanceof ApiError && error.status === 404) return <NotFound />
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/'))
  const share = () => shareLink(movie?.title ?? 'GoGetTheTickets', ui.toast)
  if (!movie) return <><BackBar title="" onBack={back} /><MovieSkeleton /></>

  const soon = movie.status === 'COMING_SOON'
  const notified = !!prefs.notify[movie.id]
  const notify = () => {
    const on = prefs.toggleNotify(movie.id)
    ui.toast({ tone: on ? 'success' : 'neutral', icon: 'bell', text: on ? "We'll remind you when bookings open" : 'Reminder turned off' })
  }
  const book = () => navigate(`/movies/${movie.id}/showtimes`)
  const cta = soon
    ? <Button label={notified ? "You'll be notified" : 'Notify me'} variant={notified ? 'secondary' : 'primary'} size="lg" icon={notified ? 'check' : 'bell'} onClick={notify} />
    : <Button label="Book tickets" size="lg" icon="ticket" onClick={book} />

  const cast = movie.cast?.filter(c => !c.crew) ?? []
  const crew = movie.cast?.filter(c => c.crew) ?? []
  let similar = all.filter(x => x.id !== movie.id && x.status === 'NOW_SHOWING' && x.genres.some(g => movie.genres.includes(g)))
  if (similar.length < 3) similar = all.filter(x => x.id !== movie.id && x.status === 'NOW_SHOWING').slice(0, 6)
  const info: Array<[string, string]> = [
    ['Release date', fmtDate(movie.releaseDate)], ['Runtime', runtime(movie.runtimeMinutes)],
    ['Certificate', `${movie.certificate} · ${CERT_NAMES[movie.certificate]}`], ['Languages', movie.languages.join(', ')], ['Formats', movie.formats.join(', ')],
  ]

  return (
    <>
      <BackBar title={movie.title} onBack={back} actions={<IconButton icon="share" label="Share" onClick={share} />} />
      <section className="g-detail-hero">
        <div className="g-detail-hero__art"><BackdropArt movie={movie} /></div>
        <div className="g-detail-hero__scrim" />
        <button type="button" className="g-detail-hero__play g-only-m" aria-label="Watch trailer" onClick={() => setTrailer(true)}><Icon name="play" size={26} /></button>
        <div className="g-wrap g-detail-hero__in">
          <div className="g-detail-hero__poster"><PosterArt movie={movie} /></div>
          <div className="g-detail-hero__info">
            <div className="g-detail-hero__badges">
              {soon ? <Badge text={`Releasing ${fmtDate(movie.releaseDate, 'short')}`} tone="accent" /> : <Badge text="In cinemas" tone="hero" />}
              {movie.formats.map(f => <Badge key={f} text={f} tone="hero" />)}
            </div>
            <h1 className="g-detail-hero__title">{movie.title}</h1>
            <p className="g-detail-hero__meta"><Cert c={movie.certificate} /><span>{runtime(movie.runtimeMinutes)}</span><span>{movie.genres.join(', ')}</span><span>{fmtDate(movie.releaseDate)}</span></p>
            <div className="g-detail-hero__rating"><Rating movie={movie} big /></div>
            <div className="g-detail-hero__cta g-only-d">{cta}<Button label="Watch trailer" variant="hero" size="lg" icon="play" onClick={() => setTrailer(true)} /></div>
          </div>
        </div>
      </section>
      <div className="g-wrap g-detail">
        <div className="g-detail__main">
          <div className="g-detail__langs g-only-m"><div className="g-chips">{movie.languages.map(l => <span key={l} className="g-tag">{l}</span>)}</div></div>
          <section className="g-section">
            <h2 className="g-h2">About the movie</h2>
            <p className={`g-synopsis${readMore ? ' is-open' : ''}`}>{movie.synopsis}</p>
            <button type="button" className="g-link g-only-m" onClick={() => setReadMore(r => !r)}>{readMore ? 'Show less' : 'Read more'}</button>
          </section>
          <section className="g-section"><RailHead title="Cast" /><People list={cast} /></section>
          <section className="g-section"><RailHead title="Crew" /><People list={crew} /></section>
          <section className="g-section">
            <RailHead title="You might also like" />
            <div className="g-rail">{similar.map(x => <PosterCard key={x.id} movie={x} onClick={() => navigate(`/movies/${x.id}`)} />)}</div>
          </section>
        </div>
        <aside className="g-detail__side">
          <div className="g-card">
            <h3 className="g-card__title">Details</h3>
            <dl className="g-dl">{info.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          </div>
        </aside>
      </div>
      <Dock>
        {soon ? (
          <>
            <div className="g-dock__info"><b>Releasing {fmtDate(movie.releaseDate, 'day')}</b><span>{movie.votes} people interested</span></div>
            <Button label={notified ? 'Notified' : 'Notify me'} variant={notified ? 'secondary' : 'primary'} icon={notified ? 'check' : 'bell'} onClick={notify} />
          </>
        ) : (
          <>
            <div className="g-dock__info"><b>{movie.languages.length} language{movie.languages.length > 1 ? 's' : ''} · {movie.formats.join(', ')}</b><span>Tickets from ₹180</span></div>
            <Button label="Book tickets" iconRight="arrowRight" onClick={book} />
          </>
        )}
      </Dock>
      {trailer ? <TrailerDialog movie={movie as Movie} onClose={() => setTrailer(false)} /> : null}
    </>
  )
}

function People({ list }: { list: CastMember[] }) {
  return (
    <div className="g-rail">
      {list.map(c => (
        <div key={c.name + c.role} className="g-person">
          <span className="g-person__photo"><Avatar name={c.name} photoUrl={c.photoUrl} /></span>
          <b>{c.name}</b><span>{c.role}</span>
        </div>
      ))}
    </div>
  )
}

function MovieSkeleton() {
  return (
    <>
      <section className="g-detail-hero g-detail-hero--skel" aria-busy="true">
        <div className="g-wrap g-detail-hero__in">
          <div className="g-detail-hero__poster"><Skel w="100%" h="100%" r="var(--radius-lg)" /></div>
          <div className="g-detail-hero__info g-skelstack"><Skel w={120} h={22} r="6px" /><Skel w="70%" h={36} /><Skel w="50%" h={16} /><Skel w={160} h={20} /></div>
        </div>
      </section>
      <div className="g-wrap g-detail">
        <div className="g-detail__main">
          <section className="g-section g-skelstack"><Skel w={180} h={24} /><Skel w="100%" h={14} /><Skel w="92%" h={14} /><Skel w="60%" h={14} /></section>
          <section className="g-section"><Skel w={80} h={24} />
            <div className="g-rail" style={{ marginTop: 16 }}>{Array.from({ length: 6 }, (_, i) => <div key={i} className="g-person"><Skel w={72} h={72} r="50%" /><Skel w={64} h={12} /><Skel w={48} h={10} /></div>)}</div>
          </section>
        </div>
      </div>
    </>
  )
}
