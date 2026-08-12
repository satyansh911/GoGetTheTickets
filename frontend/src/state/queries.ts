import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { usePrefs } from './prefs'

const HOUR = 60 * 60 * 1000

export const useMovies = () => useQuery({ queryKey: ['movies'], queryFn: api.movies, staleTime: HOUR })
export const useCities = () => useQuery({ queryKey: ['cities'], queryFn: api.cities, staleTime: 24 * HOUR })
export const useFood = () => useQuery({ queryKey: ['food'], queryFn: api.food, staleTime: HOUR })
export const useOffers = () => useQuery({ queryKey: ['offers'], queryFn: api.offers, staleTime: HOUR })

/** The selected city with its display name. */
export function useCity() {
  const { cityId } = usePrefs()
  const { data } = useCities()
  const city = data?.find(c => c.id === cityId)
  return { id: cityId, name: city?.name ?? cityId.replace(/(^|-)\w/g, s => s.toUpperCase()) }
}
