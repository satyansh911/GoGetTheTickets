import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconButton } from '../components/ui'

// The app root has fixed slots (like the design prototype): header, scrolling main, a bottom
// dock for the primary action, the bottom nav and an overlay layer. Screens render into the
// header, dock and overlay slots through portals.

export interface Slots {
  mbar: HTMLElement | null
  dock: HTMLElement | null
  overlay: HTMLElement | null
  main: HTMLElement | null
}

export const SlotsContext = createContext<Slots>({ mbar: null, dock: null, overlay: null, main: null })

export const useSlots = () => useContext(SlotsContext)

export function Portal({ to, children }: { to: keyof Slots; children: ReactNode }) {
  const target = useSlots()[to]
  return target ? createPortal(children, target) : null
}

/** Sticky bottom action bar. Mobile only unless `desktop`. */
export function Dock({ desktop, children }: { desktop?: boolean; children: ReactNode }) {
  return <Portal to="dock"><div className={`g-dock${desktop ? '' : ' g-dock--mobile'}`}>{children}</div></Portal>
}

/** Mobile top bar for inner pages: back, title, subtitle, actions. */
export function BackBar({ title, sub, actions, onBack }: { title: string; sub?: ReactNode; actions?: ReactNode; onBack: () => void }) {
  return (
    <Portal to="mbar">
      <div className="g-mbar g-only-m">
        <IconButton icon="chevLeft" label="Back" onClick={onBack} />
        <div className="g-mbar__text">
          <h1 className="g-mbar__title">{title}</h1>
          {sub ? <p className="g-mbar__sub">{sub}</p> : null}
        </div>
        <span className="g-mbar__actions">{actions}</span>
      </div>
    </Portal>
  )
}

/** Keeps the page title in step with the screen. */
export function useTitle(title: string | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · GoGetTheTickets` : 'GoGetTheTickets · Book movie tickets'
  }, [title])
}
