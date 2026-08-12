import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { Portal } from '../layout/shell'
import { Icon, PosterArt } from '../components/Svg'
import { Badge, Chip, EmptyState, IconButton, Rating } from '../components/ui'
import { api } from '../lib/api'
import { fmtDate } from '../lib/format'
import type { Movie } from '../lib/types'
import { usePrefs } from '../state/prefs'
import { useCity, useMovies } from '../state/queries'
import { useUi } from '../state/ui'

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export function SearchOverlay() {
  const ui = useUi()
  const prefs = usePrefs()
  const city = useCity()
  const navigate = useNavigate()
  const { data: movies = [] } = useMovies()
  const [q, setQ] = useState('')
  const query = useDebounced(q.trim(), 220)
  const results = useQuery({ queryKey: ['search', query, city.id], queryFn: () => api.search(query, city.id), enabled: !!query })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') ui.closeOverlay() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ui])

  function openMovie(m: Movie) {
    prefs.addRecent(m.title)
    ui.closeOverlay()
    navigate(`/movies/${m.id}`)
  }

  const row = (m: Movie) => (
    <button key={m.id} type="button" className="g-srow" onClick={() => openMovie(m)}>
      <span className="g-srow__poster"><PosterArt movie={m} noText /></span>
      <span className="g-srow__txt"><b>{m.title}</b><span>{m.certificate} · {m.genres.join(', ')} · {m.languages.slice(0, 3).join(', ')}</span></span>
      {m.status === 'COMING_SOON' ? <Badge text={fmtDate(m.releaseDate, 'short')} tone="accent" /> : <Rating movie={m} />}
    </button>
  )

  let body
  if (!q.trim()) {
    const trending = movies.filter(m => m.status === 'NOW_SHOWING').sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 5)
    body = (
      <>
        {prefs.recent.length ? (
          <div className="g-searchsec">
            <div className="g-searchsec__head"><h3 className="g-overline">Recent searches</h3><button type="button" className="g-link" onClick={prefs.clearRecent}>Clear</button></div>
            <div className="g-chips g-chips--wrap">{prefs.recent.map(r => <Chip key={r} label={r} icon="history" onClick={() => setQ(r)} />)}</div>
          </div>
        ) : null}
        <div className="g-searchsec">
          <h3 className="g-overline">Trending in {city.name}</h3>
          <div className="g-slist">{trending.map((m, i) => <div key={m.id} className="g-rank"><span className="g-rank__n">{i + 1}</span>{row(m)}</div>)}</div>
        </div>
      </>
    )
  } else if (!results.data) {
    body = results.isError ? <EmptyState icon="wifiOff" tone="danger" title="Search isn't responding" text="Check your connection and try again." /> : null
  } else if (!results.data.movies.length && !results.data.cinemas.length) {
    body = (
      <EmptyState icon="search" title={`No results for “${q.trim()}”`} text="Check the spelling, or search by movie, cinema, language or actor."
        actions={<div className="g-chips g-chips--wrap" style={{ justifyContent: 'center' }}>{['IMAX', 'Tamil', 'Comedy', 'Marquee'].map(s => <Chip key={s} label={s} onClick={() => setQ(s)} />)}</div>} />
    )
  } else {
    const { movies: mv, cinemas } = results.data
    body = (
      <>
        {mv.length ? <div className="g-searchsec"><h3 className="g-overline">Movies · {mv.length}</h3><div className="g-slist">{mv.map(row)}</div></div> : null}
        {cinemas.length ? (
          <div className="g-searchsec">
            <h3 className="g-overline">Cinemas in {city.name} · {cinemas.length}</h3>
            <div className="g-slist">
              {cinemas.map(c => (
                <button key={c.id} type="button" className="g-srow" onClick={() => ui.toast({ icon: 'film', text: 'Cinema pages are coming soon. Pick a movie to see its showtimes here.' })}>
                  <span className="g-srow__icon"><Icon name="film" size={20} /></span>
                  <span className="g-srow__txt"><b>{c.name}</b><span>{c.area} · {c.distanceKm} km</span></span>
                  <Icon name="chevRight" size={18} />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </>
    )
  }

  return (
    <Portal to="overlay">
      <div className="g-layer g-layer--full">
        <div className="g-dialog g-dialog--full" role="dialog" aria-modal="true" aria-label="Search">
          <div className="g-searchbar">
            <div className="g-wrap g-searchbar__in">
              <IconButton icon="chevLeft" label="Close search" onClick={ui.closeOverlay} />
              <label className="g-searchbar__field">
                <Icon name="search" size={20} />
                <input type="search" autoFocus placeholder="Search movies, cinemas, languages, cast" value={q} autoComplete="off" aria-label="Search"
                  onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && q.trim()) prefs.addRecent(q.trim()) }} />
                {q ? <button type="button" className="g-searchbar__clear" aria-label="Clear" onClick={() => setQ('')}><Icon name="x" size={16} /></button> : null}
              </label>
              <button type="button" className="g-link g-only-d" onClick={ui.closeOverlay}>Cancel</button>
            </div>
          </div>
          <div className="g-dialog__body"><div className="g-wrap g-narrow">{body}</div></div>
        </div>
      </div>
    </Portal>
  )
}
