import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

export type ToastTone = 'neutral' | 'success' | 'warning' | 'danger'

export interface ToastInput {
  text: ReactNode
  tone?: ToastTone
  icon?: string
  duration?: number
}

interface ToastItem extends ToastInput {
  id: number
  leaving: boolean
}

type GlobalOverlay =
  | { type: 'auth'; mode: 'signin' | 'signup'; onDone?: () => void }
  | { type: 'city' }
  | { type: 'search' }

interface Ui {
  toasts: ToastItem[]
  toast: (t: ToastInput) => void
  overlay: GlobalOverlay | null
  /** Opens sign-in; `onDone` runs after a successful sign-in, e.g. to continue a checkout. */
  openAuth: (mode?: 'signin' | 'signup', onDone?: () => void) => void
  openCity: () => void
  openSearch: () => void
  closeOverlay: () => void
}

const UiContext = createContext<Ui | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [overlay, setOverlay] = useState<GlobalOverlay | null>(null)
  const nextId = useRef(1)

  const toast = useCallback((t: ToastInput) => {
    const id = nextId.current++
    setToasts(list => [...list.slice(-2), { ...t, id, leaving: false }])
    const ms = t.duration ?? 3600
    setTimeout(() => setToasts(list => list.map(x => (x.id === id ? { ...x, leaving: true } : x))), ms)
    setTimeout(() => setToasts(list => list.filter(x => x.id !== id)), ms + 260)
  }, [])

  const value = useMemo<Ui>(() => ({
    toasts,
    toast,
    overlay,
    openAuth: (mode = 'signin', onDone) => setOverlay({ type: 'auth', mode, onDone }),
    openCity: () => setOverlay({ type: 'city' }),
    openSearch: () => setOverlay({ type: 'search' }),
    closeOverlay: () => setOverlay(null),
  }), [toasts, toast, overlay])

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi(): Ui {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi outside UiProvider')
  return ctx
}
