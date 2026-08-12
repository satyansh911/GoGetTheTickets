import { useState } from 'react'
import { Dialog } from '../components/Dialog'
import { CityGlyph, Icon } from '../components/Svg'
import { EmptyState, Field } from '../components/ui'
import type { City } from '../lib/types'
import { usePrefs } from '../state/prefs'
import { useCities } from '../state/queries'
import { useUi } from '../state/ui'

// Rough centres of the popular cities, for "Detect my location".
const COORDS: Record<string, [number, number]> = {
  mumbai: [19.08, 72.88], 'delhi-ncr': [28.61, 77.21], bengaluru: [12.97, 77.59], hyderabad: [17.39, 78.49],
  chennai: [13.08, 80.27], kolkata: [22.57, 88.36], pune: [18.52, 73.86], kochi: [9.93, 76.27],
  ahmedabad: [23.02, 72.57], goa: [15.3, 74.12],
}

export function CityPicker() {
  const ui = useUi()
  const prefs = usePrefs()
  const { data: cities = [] } = useCities()
  const [q, setQ] = useState('')
  const [locating, setLocating] = useState(false)

  function pick(c: City) {
    prefs.setCityId(c.id)
    ui.closeOverlay()
    ui.toast({ tone: 'success', icon: 'pin', text: <>Showing movies in <b>{c.name}</b></> })
  }

  function detect() {
    if (!navigator.geolocation) {
      ui.toast({ tone: 'warning', text: "Your browser can't share its location. Pick a city instead." })
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords
      let best = 'mumbai'
      let bestD = Infinity
      for (const [id, [lat, lng]] of Object.entries(COORDS)) {
        const d = (lat - latitude) ** 2 + (lng - longitude) ** 2
        if (d < bestD) { bestD = d; best = id }
      }
      const city = cities.find(c => c.id === best)
      setLocating(false)
      if (city) pick(city)
    }, () => {
      setLocating(false)
      ui.toast({ tone: 'warning', text: "Couldn't get your location. Pick a city instead." })
    }, { timeout: 8000 })
  }

  const needle = q.trim().toLowerCase()
  let results
  if (needle) {
    const hits = cities.filter(c => c.name.toLowerCase().includes(needle))
    results = hits.length ? (
      <div className="g-citylist">{hits.map(c => <CityRow key={c.id} city={c} on={c.id === prefs.cityId} pick={pick} />)}</div>
    ) : <EmptyState icon="pin" title={`We're not in “${q}” yet`} text="We are adding cities every month. Try a nearby city for now." />
  } else {
    const sorted = [...cities].sort((a, b) => a.name.localeCompare(b.name))
    const firstOfLetter = new Set(sorted.filter((c, i) => i === 0 || sorted[i - 1].name[0] !== c.name[0]).map(c => c.id))
    results = (
      <>
        <h3 className="g-overline g-pad-t">Popular cities</h3>
        <div className="g-citygrid">
          {cities.filter(c => c.popular).map(c => (
            <button key={c.id} type="button" className={`g-citytile${c.id === prefs.cityId ? ' is-on' : ''}`} aria-pressed={c.id === prefs.cityId} onClick={() => pick(c)}>
              <CityGlyph kind={c.icon || 'arch'} size={36} /><span>{c.name}</span>
            </button>
          ))}
        </div>
        <h3 className="g-overline g-pad-t">All cities</h3>
        <div className="g-citylist">
          {sorted.flatMap(c => [
            ...(firstOfLetter.has(c.id) ? [<span key={'l' + c.name[0]} className="g-citylist__letter">{c.name[0]}</span>] : []),
            <CityRow key={c.id} city={c} on={c.id === prefs.cityId} pick={pick} />,
          ])}
        </div>
      </>
    )
  }

  return (
    <Dialog title="Select your city" subtitle="Showtimes and prices depend on where you are" onClose={ui.closeOverlay} className="g-dialog--wide">
      <Field value={q} onChange={setQ} placeholder="Search for your city" icon="search" autoFocus autoComplete="off" />
      <button type="button" className="g-detect" onClick={detect} disabled={locating}>
        <Icon name="pin" size={18} />{locating ? 'Finding you…' : 'Detect my location'}
      </button>
      <div>{results}</div>
    </Dialog>
  )
}

function CityRow({ city, on, pick }: { city: City; on: boolean; pick: (c: City) => void }) {
  return (
    <button type="button" className={`g-cityrow${on ? ' is-on' : ''}`} onClick={() => pick(city)}>
      {city.name}{on ? <Icon name="check" size={18} /> : null}
    </button>
  )
}
