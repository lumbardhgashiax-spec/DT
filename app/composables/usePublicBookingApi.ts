import type { BookingConfirmation, BookingQuote, BookingQuoteRequest, BookingSlot, CreateBookingRequest, PublicBookingOptions } from '~/types/booking'

interface AvailabilityResponse {
  courtId: string
  date: string
  slots: BookingSlot[]
}

function usePublicRequestFetch() {
  const requestFetch = useRequestFetch()

  return import.meta.server ? requestFetch : $fetch
}

/**
 * The public site deliberately accesses booking data only through these server
 * endpoints. No Supabase client, database credentials, or pricing logic is
 * exposed in the browser.
 */
export function usePublicBookingApi() {
  const requestFetch = usePublicRequestFetch()

  return {
    getOptions: () => requestFetch<PublicBookingOptions>('/api/public/booking/options'),
    getAvailability: (courtId: string, date: string) => requestFetch<AvailabilityResponse>('/api/public/availability', {
      query: { courtId, date }
    }),
    getQuote: (payload: BookingQuoteRequest) => requestFetch<BookingQuote>('/api/public/booking/quote', {
      method: 'POST',
      body: payload
    }),
    createBooking: (payload: CreateBookingRequest) => requestFetch<BookingConfirmation>('/api/public/bookings', {
      method: 'POST',
      body: payload
    }),
    getConfirmation: (reference: string) => requestFetch<BookingConfirmation>('/api/public/booking/confirmation', {
      query: { reference }
    })
  }
}
