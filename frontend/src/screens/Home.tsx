import { useEffect, useRef, useState, type RefObject } from 'react'
import { useNavigate } from 'react-router'
import { BackdropArt, Icon, PosterArt } from '../components/Svg'
import { Badge, Button, Cert, Chip, EmptyState, IconButton, PosterCard, RailHead, Skel } from '../components/ui'
import { Footer } from '../layout/AppShell'
import { useTitle } from '../layout/shell'
import { runtime } from '../lib/format'
import type { Movie } from '../lib/types'
import { useCity, useMovies } from '../state/queries'
import { TrailerDialog } from '../overlays/TrailerDialog'

const LANGS = ['All', 'Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam']
const GENRES = ['Action', 'Thriller', 'Comedy', 'Drama', 'Romance', 'Sci-Fi', 'Horror', 'Family']

export function Home() {
  useTitle(undefined)
  const navigate = useNavigate()
  const city = useCity()
  const { data: movies, isError, refetch } = useMovies()
  const [lang, setLang] = useState('All')
  const [genre, setGenre] = useState<string | null>(null)
  const [trailer, setTrailer] = useState<Movie | null>(null)
  const nowRail = useRef<HTMLDivElement>(null)
  const soonRail = useRef<HTMLDivElement>(null)

  if (isError) {
    return <div className="g-wrap g-narrow"><EmptyState icon="wifiOff" tone="danger" title="Couldn't load movies"
      text="You seem to be offline, or our servers didn't respond. Check your connection and try again."
      actions={<Button label="Try again" icon="refresh" onClick={() => refetch()} />} /></div>
  }
  if (!movies) return <HomeSkeleton />

  const featured = movies.filter(m => m.featuredRank != null).sort((a, b) => a.featuredRank! - b.featuredRank!)
  const nowShowing = movies.filter(m => m.status === 'NOW_SHOWING')
  const soon = movies.filter(m => m.status === 'COMING_SOON').sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))
  const filtered = nowShowing.filter(m => (lang === 'All' || m.languages.includes(lang)) && (!genre || m.genres.includes(genre)))
  const open = (m: Movie) => navigate(`/movies/${m.id}`)

  const arrows = (rail: RefObject<HTMLDivElement | null>) => (
    <span className="g-railarrows g-only-d">
      <IconButton icon="chevLeft" label="Scroll left" variant="soft" onClick={() => rail.current?.scrollBy({ left: -rail.current.clientWidth * 0.8, behavior: 'smooth' })} />
      <IconButton icon="chevRight" label="Scroll right" variant="soft" onClick={() => rail.current?.scrollBy({ left: rail.current.clientWidth * 0.8, behavior: 'smooth' })} />
    </span>
  )

  return (
    <>
      <Hero movies={featured} cityName={city.name} onTrailer={setTrailer} />
      <div className="g-wrap g-home">
        <div className="g-home-filters">
          <div className="g-chips">{LANGS.map(l => <Chip key={l} label={l} selected={lang === l} onClick={() => setLang(l)} />)}</div>
          <div className="g-chips">{GENRES.map(g => <Chip key={g} label={g} selected={genre === g} removable={genre === g} onClick={() => setGenre(genre === g ? null : g)} />)}</div>
        </div>
        <section className="g-section">
          <RailHead title="Now Showing" link="See all" onLink={() => navigate('/movies')}>{arrows(nowRail)}</RailHead>
          {filtered.length ? (
            <div className="g-rail" ref={nowRail}>{filtered.map(m => <PosterCard key={m.id} movie={m} onClick={() => open(m)} />)}</div>
          ) : (
            <div className="g-card g-inline-empty">
              <Icon name="film" size={20} />
              <div><b>No {lang !== 'All' ? lang + ' ' : ''}{genre || ''} movies in {city.name} right now</b><span>Try another language or genre.</span></div>
              <Button label="Reset" variant="secondary" size="sm" onClick={() => { setLang('All'); setGenre(null) }} />
            </div>
          )}
        </section>
        <section className="g-section">
          <RailHead title="Coming Soon">{arrows(soonRail)}</RailHead>
          <div className="g-rail" ref={soonRail}>{soon.map(m => <PosterCard key={m.id} movie={m} onClick={() => open(m)} />)}</div>
        </section>
        <section className="g-section g-promo">
          <div className="g-promo__text">
            <span className="g-overline">First booking?</span>
            <h3>Use <b>GGTFIRST</b> for 20% off tickets</h3>
            <p>Up to ₹150 off your first booking. Valid on all formats.</p>
          </div>
          <Button label="Browse movies" variant="secondary" iconRight="arrowRight" onClick={() => navigate('/movies')} />
        </section>
      </div>
      <Footer />
      {trailer ? <TrailerDialog movie={trailer} onClose={() => setTrailer(null)} /> : null}
    </>
  )
}

function Hero({ movies, cityName, onTrailer }: { movies: Movie[]; cityName: string; onTrailer: (m: Movie) => void }) {
  const navigate = useNavigate()
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const x0 = useRef<number | null>(null)
  const n = movies.length

  useEffect(() => {
    if (paused || n < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setI(v => (v + 1) % n), 5200)
    return () => clearInterval(t)
  }, [paused, n])

  if (!n) return null
  return (
    <section className="g-hero" aria-roledescription="carousel" aria-label="Featured movies"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onPointerDown={e => { x0.current = e.clientX }}
      onPointerUp={e => {
        if (x0.current == null) return
        const dx = e.clientX - x0.current
        x0.current = null
        if (Math.abs(dx) > 40) setI(v => (v + (dx < 0 ? 1 : n - 1)) % n)
      }}>
      {movies.map((m, k) => (
        <div key={m.id} className={`g-hero__slide${k === i ? ' is-active' : ''}`} aria-hidden={k !== i}>
          <div className="g-hero__art"><BackdropArt movie={m} /></div>
          <div className="g-hero__scrim" />
          <div className="g-hero__content">
            <div className="g-hero__text">
              <span className="g-hero__kicker"><Badge text={k === 0 ? `#1 in ${cityName}` : 'In cinemas'} tone="hero" /><span>{m.formats.join(' · ')}</span></span>
              <h2 className="g-hero__title">{m.title}</h2>
              <p className="g-hero__meta"><Cert c={m.certificate} /><span>{runtime(m.runtimeMinutes)}</span><span>{m.genres.join(', ')}</span><span>{m.languages.slice(0, 3).join(', ')}</span></p>
              <p className="g-hero__syn g-only-d">{m.synopsis}</p>
              <div className="g-hero__cta">
                <Button label="Book now" size="lg" icon="ticket" onClick={() => navigate(`/movies/${m.id}/showtimes`)} />
                <Button label="Trailer" variant="hero" size="lg" icon="play" onClick={() => onTrailer(m)} />
              </div>
            </div>
            <button type="button" className="g-hero__poster g-only-d" onClick={() => navigate(`/movies/${m.id}`)} aria-label={`Details for ${m.title}`}><PosterArt movie={m} /></button>
          </div>
        </div>
      ))}
      <div className="g-hero__nav">
        <IconButton icon="chevLeft" label="Previous" variant="hero" className="g-only-d" onClick={() => setI((i + n - 1) % n)} />
        <div className="g-hero__dots">
          {movies.map((m, k) => (
            <button key={m.id} type="button" className={`g-hero__dot${k === i ? ' is-active' : ''}`} aria-label={`Slide ${k + 1}`} aria-current={k === i} onClick={() => setI(k)}><i /></button>
          ))}
        </div>
        <IconButton icon="chevRight" label="Next" variant="hero" className="g-only-d" onClick={() => setI((i + 1) % n)} />
      </div>
    </section>
  )
}

function HomeSkeleton() {
  const posters = Array.from({ length: 6 }, (_, i) => (
    <div key={i} className="g-skelposter"><Skel w="100%" h="auto" r="var(--radius-lg)" className="g-skel--poster" /><Skel w="80%" h={14} /><Skel w="50%" h={12} /></div>
  ))
  return (
    <>
      <div className="g-skelhero"><Skel w="100%" h="100%" r="0" /></div>
      <div className="g-wrap g-home" aria-busy="true" aria-label="Loading">
        <div className="g-chips">{Array.from({ length: 7 }, (_, k) => <Skel key={k} w={k ? 76 : 48} h={36} r="var(--radius-pill)" />)}</div>
        <section className="g-section"><Skel w={160} h={24} /><div className="g-rail g-rail--skel" style={{ marginTop: 16 }}>{posters}</div></section>
        <section className="g-section"><Skel w={140} h={24} /><div className="g-rail g-rail--skel" style={{ marginTop: 16 }}>{posters}</div></section>
      </div>
    </>
  )
}
