import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { Icon, PosterArt } from '../components/Svg'
import { Amenity, Button, Chip, DatePill, EmptyState, ShowChip, ShowLegend, Skel } from '../components/ui'
import { BackBar, useTitle } from '../layout/shell'
import { api, ApiError } from '../lib/api'
import { fmtDate, metaLine, timeOfDay, todayIst } from '../lib/format'
import type { ShowSummary } from '../lib/types'
import { CountPicker } from '../overlays/CountPicker'
import { useCity } from '../state/queries'
import { useUi } from '../state/ui'
import { NotFound } from './NotFound'

const TODS = [['morning', 'Morning', 'sunrise'], ['afternoon', 'Afternoon', 'sun'], ['evening', 'Evening', 'sunset'], ['night', 'Night', 'moon']] as const

export function Showtimes() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const ui = useUi()
  const city = useCity()
  const [params, setParams] = useSearchParams()
  const date = params.get('date') ?? undefined
  const [lang, setLang] = useState('All')
  const [format, setFormat] = useState('All')
  const [tod, setTod] = useState<string | null>(null)
  const [picked, setPicked] = useState<ShowSummary | null>(null)

  const movieQ = useQuery({ queryKey: ['movie', id], queryFn: () => api.movie(id), staleTime: 60 * 60 * 1000 })
  const shows = useQuery({ queryKey: ['showtimes', id, city.id, date ?? ''], queryFn: () => api.showtimes(id, city.id, date), refetchInterval: 60_000 })
  const movie = movieQ.data
  useTitle(movie ? `${movie.title} showtimes` : 'Showtimes')

  if (movieQ.error instanceof ApiError && movieQ.error.status === 404) return <NotFound />
  const back = () => navigate(`/movies/${id}`)
  const bar = <BackBar title={movie?.title ?? 'Showtimes'} sub={movie ? metaLine(movie) : undefined} onBack={back} />

  if (movie?.status === 'COMING_SOON') {
    return <>{bar}<div className="g-wrap g-narrow"><EmptyState icon="calendar" tone="accent" title="Bookings haven't opened yet"
      text={`${movie.title} releases on ${fmtDate(movie.releaseDate, 'day')}. Turn on a reminder from the movie page.`}
      actions={<Button label="Back to movie" onClick={back} />} /></div></>
  }

  const data = shows.data
  const day = data?.date
  const filtered = data?.cinemas.map(c => ({
    cinema: c.cinema,
    shows: c.shows.filter(s => (lang === 'All' || s.language === lang) && (format === 'All' || s.format === format) && (!tod || timeOfDay(s.startTime) === tod)),
  })).filter(c => c.shows.length) ?? []
  const clearFilters = () => { setLang('All'); setFormat('All'); setTod(null) }
  const multiLang = (movie?.languages.length ?? 0) > 1

  let body
  if (shows.isError) {
    body = <EmptyState icon="wifiOff" tone="danger" title="Couldn't load showtimes" text="You seem to be offline, or our servers didn't respond. Check your connection and try again."
      actions={<Button label="Try again" icon="refresh" loading={shows.isFetching} loadingLabel="Retrying…" onClick={() => shows.refetch()} />} />
  } else if (!data) {
    body = <div className="g-cinemas">{Array.from({ length: 4 }, (_, i) => <div key={i} className="g-cinema"><div className="g-cinema__info g-skelstack"><Skel w="60%" h={18} /><Skel w="40%" h={14} /></div><div className="g-cinema__shows">{[1, 2, 3].map(k => <Skel key={k} w={96} h={54} r="8px" />)}</div></div>)}</div>
  } else if (!data.dates.some(d => d.hasShows)) {
    body = <EmptyState icon="pin" title={`Not playing in ${city.name} this week`} text="Try a nearby city — showtimes differ by city."
      actions={<Button label="Change city" icon="pin" onClick={ui.openCity} />} />
  } else if (!filtered.length) {
    body = <EmptyState icon="clock" title="No shows match" text={`No ${movie?.title ?? ''} shows fit these filters on ${day ? fmtDate(day, 'day') : 'this day'}. Try another time or date.`}
      actions={<Button label="Clear filters" variant="secondary" onClick={clearFilters} />} />
  } else {
    body = (
      <div className="g-cinemas">
        {filtered.map(({ cinema, shows: list }) => (
          <article key={cinema.id} className="g-cinema">
            <div className="g-cinema__info">
              <h3 className="g-cinema__name">{cinema.name}</h3>
              <p className="g-cinema__area"><Icon name="pin" size={14} />{cinema.area} · {cinema.distanceKm} km away</p>
              <div className="g-cinema__amen">{cinema.amenities.map(a => <Amenity key={a} a={a} />)}</div>
            </div>
            <div className="g-cinema__shows">
              {list.map(s => <ShowChip key={s.id} show={s} showLang={lang === 'All' && multiLang} onClick={() => setPicked(s)} />)}
            </div>
          </article>
        ))}
      </div>
    )
  }

  return (
    <>
      {bar}
      <div className="g-wrap g-shows">
        {movie ? (
          <div className="g-showhead g-only-d">
            <div className="g-showhead__poster"><PosterArt movie={movie} noText /></div>
            <div><h1 className="g-pagetitle">{movie.title}</h1><p className="g-muted">{metaLine(movie)}</p></div>
          </div>
        ) : null}
        <div className="g-datestrip">
          {(data?.dates ?? []).map(d => (
            <DatePill key={d.date} iso={d.date} today={d.date === todayIst()} selected={d.date === day} disabled={!d.hasShows}
              onClick={() => setParams({ date: d.date }, { replace: true })} />
          ))}
        </div>
        {movie ? (
          <div className="g-showfilters">
            <div className="g-chips">
              {['All', ...movie.languages].map(l => <Chip key={l} label={l === 'All' ? 'All languages' : l} selected={lang === l} onClick={() => setLang(l)} />)}
              <span className="g-chipsep" />
              {['All', ...movie.formats].map(f => <Chip key={f} label={f === 'All' ? 'All formats' : f} selected={format === f} onClick={() => setFormat(f)} />)}
            </div>
            <div className="g-showfilters__row">
              <div className="g-chips">{TODS.map(([k, label, icon]) => <Chip key={k} label={label} icon={icon} selected={tod === k} onClick={() => setTod(tod === k ? null : k)} />)}</div>
              <span className="g-only-d"><ShowLegend /></span>
            </div>
          </div>
        ) : null}
        <div className="g-only-m g-shows__legend"><ShowLegend /></div>
        {body}
      </div>
      {picked ? <CountPicker showId={picked.id} onClose={() => setPicked(null)} onConfirm={n => navigate(`/shows/${picked.id}/seats?count=${n}`)} /> : null}
    </>
  )
}
