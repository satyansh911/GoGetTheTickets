import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Dialog } from '../components/Dialog'
import { Button, Chip, EmptyState, PosterCard, Skel, Tabs } from '../components/ui'
import { useTitle } from '../layout/shell'
import type { Movie } from '../lib/types'
import { useCity, useMovies } from '../state/queries'

const LANGS = ['Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam']
const GENRES = ['Action', 'Thriller', 'Drama', 'Comedy', 'Family', 'Romance', 'Sci-Fi', 'Adventure', 'Crime', 'Mystery', 'Horror', 'Mythology', 'Animation', 'Musical']
const FORMATS = ['2D', '3D', 'IMAX', '4DX']

type Key = 'langs' | 'genres' | 'formats'
type Filters = Record<Key, string[]>

function matches(m: Movie, f: Filters) {
  return (!f.langs.length || f.langs.some(l => m.languages.includes(l)))
    && (!f.genres.length || f.genres.some(g => m.genres.includes(g)))
    && (!f.formats.length || f.formats.some(x => m.formats.includes(x)))
}

export function Movies() {
  useTitle('Movies')
  const navigate = useNavigate()
  const city = useCity()
  const [params, setParams] = useSearchParams()
  const { data: movies } = useMovies()
  const tab = params.get('tab') === 'soon' ? 'soon' : 'now'
  const [filters, setFilters] = useState<Filters>(() => ({ langs: [], genres: [], formats: params.get('format') ? [params.get('format')!] : [] }))
  const [sheet, setSheet] = useState(false)

  const toggle = (key: Key, v: string) =>
    setFilters(f => ({ ...f, [key]: f[key].includes(v) ? f[key].filter(x => x !== v) : [...f[key], v] }))
  const clear = () => setFilters({ langs: [], genres: [], formats: [] })
  const n = filters.langs.length + filters.genres.length + filters.formats.length

  const now = movies?.filter(m => m.status === 'NOW_SHOWING') ?? []
  const soon = movies?.filter(m => m.status === 'COMING_SOON') ?? []
  const list = (tab === 'now' ? now : soon).filter(m => matches(m, filters))
  const active = (['langs', 'genres', 'formats'] as Key[]).flatMap(k => filters[k].map(v => [k, v] as const))

  const groups = (
    <>
      {([['Language', 'langs', LANGS], ['Genre', 'genres', GENRES], ['Format', 'formats', FORMATS]] as const).map(([title, key, values]) => (
        <div key={key} className="g-fgroup">
          <h3 className="g-fgroup__title">{title}{filters[key].length ? <span className="g-fgroup__n">{filters[key].length}</span> : null}</h3>
          <div className="g-chips g-chips--wrap">
            {values.map(v => <Chip key={v} label={v} selected={filters[key].includes(v)} icon={filters[key].includes(v) ? 'check' : null} onClick={() => toggle(key, v)} />)}
          </div>
        </div>
      ))}
    </>
  )

  return (
    <div className="g-wrap g-listing">
      <aside className="g-listing__side g-only-d">
        <div className="g-listing__sidehead"><h2 className="g-h3">Filters</h2>{n ? <button type="button" className="g-link" onClick={clear}>Clear all</button> : null}</div>
        {groups}
      </aside>
      <div className="g-listing__main">
        <h1 className="g-pagetitle g-only-d">Movies in {city.name}</h1>
        <Tabs items={[{ id: 'now', label: 'Now Showing', count: now.length }, { id: 'soon', label: 'Coming Soon', count: soon.length }]} active={tab}
          onChange={t => setParams(t === 'soon' ? { tab: 'soon' } : {}, { replace: true })} />
        <div className="g-listing__bar">
          <div className="g-chips">
            <span className="g-only-m"><Chip label="Filters" icon="sliders" count={n || null} onClick={() => setSheet(true)} /></span>
            {active.map(([k, v]) => <Chip key={k + v} label={v} selected removable onClick={() => toggle(k, v)} />)}
          </div>
          <span className="g-listing__count">{list.length} movie{list.length === 1 ? '' : 's'}</span>
        </div>
        {!movies ? (
          <div className="g-grid">{Array.from({ length: 8 }, (_, i) => <div key={i} className="g-skelposter"><Skel w="100%" h="auto" r="var(--radius-lg)" className="g-skel--poster" /><Skel w="80%" h={14} /></div>)}</div>
        ) : list.length ? (
          <div className="g-grid">{list.map(m => <PosterCard key={m.id} movie={m} size="fill" onClick={() => navigate(`/movies/${m.id}`)} />)}</div>
        ) : (
          <EmptyState icon="film" title="No movies match" text={`Nothing ${tab === 'now' ? 'playing' : 'coming'} in ${city.name} fits all of these filters. Remove one to see more.`}
            actions={<Button label="Clear filters" variant="secondary" onClick={clear} />} />
        )}
      </div>
      {sheet ? (
        <Dialog title="Filters" onClose={() => setSheet(false)}
          footer={<><Button label="Clear all" variant="outline" onClick={clear} /><Button label={`Show ${list.length} movie${list.length === 1 ? '' : 's'}`} onClick={() => setSheet(false)} /></>}>
          {groups}
        </Dialog>
      ) : null}
    </div>
  )
}
