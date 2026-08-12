import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

// Per-browser conveniences, kept in localStorage. Everything still works if storage is blocked.

export type Theme = 'dark' | 'light' | 'system'

interface Prefs {
  cityId: string
  setCityId: (id: string) => void
  theme: Theme
  setTheme: (t: Theme) => void
  recent: string[]
  addRecent: (q: string) => void
  clearRecent: () => void
  notify: Record<string, boolean>
  toggleNotify: (movieId: string) => boolean
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

const PrefsContext = createContext<Prefs | null>(null)

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [cityId, setCityIdState] = useState(() => read('ggt.city', 'mumbai'))
  const [theme, setThemeState] = useState<Theme>(() => read('ggt.theme', 'system'))
  const [recent, setRecent] = useState<string[]>(() => read('ggt.recent', ['Orbit of Ashes', 'IMAX', 'Marquee Cinemas']))
  const [notify, setNotify] = useState<Record<string, boolean>>(() => read('ggt.notify', {}))

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  }, [theme])

  const value = useMemo<Prefs>(() => ({
    cityId,
    setCityId: id => { setCityIdState(id); write('ggt.city', id) },
    theme,
    setTheme: t => { setThemeState(t); write('ggt.theme', t) },
    recent,
    addRecent: q => {
      const next = [q, ...recent.filter(r => r.toLowerCase() !== q.toLowerCase())].slice(0, 6)
      setRecent(next)
      write('ggt.recent', next)
    },
    clearRecent: () => { setRecent([]); write('ggt.recent', []) },
    notify,
    toggleNotify: id => {
      const next = { ...notify, [id]: !notify[id] }
      setNotify(next)
      write('ggt.notify', next)
      return next[id]
    },
  }), [cityId, theme, recent, notify])

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
}

export function usePrefs(): Prefs {
  const ctx = useContext(PrefsContext)
  if (!ctx) throw new Error('usePrefs outside PrefsProvider')
  return ctx
}
