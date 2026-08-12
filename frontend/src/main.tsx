import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router'
import './styles/tokens.css'
import './styles/design.css'
import './styles/app.css'
import { AppShell } from './layout/AppShell'
import { AuthProvider } from './state/auth'
import { PrefsProvider } from './state/prefs'
import { UiProvider } from './state/ui'
import { Bookings, BookingDetail } from './screens/Bookings'
import { Checkout } from './screens/Checkout'
import { Home } from './screens/Home'
import { MovieDetails } from './screens/MovieDetails'
import { Movies } from './screens/Movies'
import { NotFound } from './screens/NotFound'
import { Payment } from './screens/Payment'
import { Profile } from './screens/Profile'
import { Seats } from './screens/Seats'
import { Showtimes } from './screens/Showtimes'
import { Ticket } from './screens/Ticket'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      refetchOnWindowFocus: false,
      // Don't retry client errors (404, 401...); do retry a dropped connection once.
      retry: (count, error) => count < 1 && !((error as { status?: number }).status! >= 400),
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <PrefsProvider>
          <AuthProvider>
            <UiProvider>
              <AppShell>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/movies" element={<Movies />} />
                  <Route path="/movies/:id" element={<MovieDetails />} />
                  <Route path="/movies/:id/showtimes" element={<Showtimes />} />
                  <Route path="/shows/:id/seats" element={<Seats />} />
                  <Route path="/checkout/:id" element={<Checkout />} />
                  <Route path="/checkout/:id/pay" element={<Payment />} />
                  <Route path="/tickets/:id" element={<Ticket />} />
                  <Route path="/bookings" element={<Bookings />} />
                  <Route path="/bookings/:id" element={<BookingDetail />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppShell>
            </UiProvider>
          </AuthProvider>
        </PrefsProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
