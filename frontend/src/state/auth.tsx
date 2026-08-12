import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, getToken, setToken, UNAUTHORIZED_EVENT } from '../lib/api'
import type { User } from '../lib/types'

interface AuthState {
  user: User | null
  /** True until a stored token has been checked with the server. */
  checking: boolean
  signIn: (email: string, password: string) => Promise<User>
  signUp: (name: string, email: string, password: string) => Promise<User>
  signOut: () => void
  refresh: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(() => !!getToken())

  const refresh = useCallback(() => {
    if (!getToken()) return
    api.me().then(setUser).catch(() => setUser(null)).finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    refresh()
    // An expired or revoked token: forget it and fall back to signed-out.
    const onUnauthorized = () => {
      setToken(null)
      setUser(null)
      queryClient.removeQueries({ queryKey: ['bookings'] })
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [refresh, queryClient])

  const value = useMemo<AuthState>(() => ({
    user,
    checking,
    signIn: async (email, password) => {
      const res = await api.login(email, password)
      setToken(res.token)
      setUser(res.user)
      refresh()
      return res.user
    },
    signUp: async (name, email, password) => {
      const res = await api.signup(name, email, password)
      setToken(res.token)
      setUser(res.user)
      return res.user
    },
    signOut: () => {
      setToken(null)
      setUser(null)
      queryClient.removeQueries({ queryKey: ['bookings'] })
      queryClient.removeQueries({ queryKey: ['booking'] })
    },
    refresh,
  }), [user, checking, refresh, queryClient])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}
