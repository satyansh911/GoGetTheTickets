import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog } from '../components/Dialog'
import { CountArt, countLabel } from '../components/Svg'
import { Button, Skel } from '../components/ui'
import { api } from '../lib/api'
import { dayLabel, inr, time12 } from '../lib/format'

/** "How many seats?" — pick 1–10 before the seat map, with each tier's price and availability. */
export function CountPicker({ showId, initial = 2, onClose, onConfirm }: { showId: number; initial?: number; onClose: () => void; onConfirm: (n: number) => void }) {
  const [n, setN] = useState(initial)
  const { data: show } = useQuery({ queryKey: ['show', showId], queryFn: () => api.show(showId) })

  const subtitle = show ? `${show.cinema.chain} · ${dayLabel(show.date)}, ${time12(show.startTime)} · ${show.language} ${show.format}` : undefined
  return (
    <Dialog title="How many seats?" subtitle={subtitle} onClose={onClose}
      footer={<Button label={`Select ${n} seat${n > 1 ? 's' : ''}`} size="lg" iconRight="arrowRight" onClick={() => onConfirm(n)} />}>
      <div className="g-countpick">
        <div className="g-countpick__art"><CountArt n={n} /><span className="g-countpick__label">{countLabel(n)}</span></div>
        <div className="g-countgrid" role="group" aria-label="Number of seats">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(k => (
            <button key={k} type="button" className={`g-countbtn${k === n ? ' is-selected' : ''}`} aria-pressed={k === n} onClick={() => setN(k)}>{k}</button>
          ))}
        </div>
        <h3 className="g-overline g-pad-t">Prices for this show</h3>
        <div className="g-tierlist">
          {show ? show.tiers.map(t => {
            const pct = t.available / t.total
            const [label, cls] = t.available === 0 ? ['Sold out', 'g-subtle'] : pct < 0.3 ? ['Filling fast', 'g-warn'] : ['Available', 'g-success']
            return (
              <div key={t.id} className="g-tierlist__item">
                <span className="g-tierlist__name">{t.label}</span>
                <span className="g-tierlist__price">{inr(t.price)}</span>
                <span className={`g-tierlist__av ${cls}`}>{label}</span>
              </div>
            )
          }) : [1, 2, 3].map(k => <Skel key={k} w="100%" h={20} />)}
        </div>
      </div>
    </Dialog>
  )
}
