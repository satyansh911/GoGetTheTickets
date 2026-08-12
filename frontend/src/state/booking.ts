import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Booking } from '../lib/types'

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const emailKey = (id: string) => `ggt.email.${id}`

/** The ticket email typed at checkout, handed to the payment page. */
export function readEmail(id: string): string | null {
  try {
    return sessionStorage.getItem(emailKey(id))
  } catch {
    return null
  }
}

export function saveEmail(id: string, email: string) {
  try {
    sessionStorage.setItem(emailKey(id), email)
  } catch {
    // The payment page falls back to the account email.
  }
}

/** Loads a booking and lets screens replace it with a fresher copy from a mutation. */
export function useBooking(id: string) {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['booking', id], queryFn: () => api.booking(id) })
  const set = (b: Booking) => queryClient.setQueryData(['booking', id], b)
  return { ...query, set }
}

/** A hold that can no longer be paid for. */
export const holdGone = (b: Booking | undefined) => !!b && (b.status === 'EXPIRED' || b.status === 'RELEASED')
