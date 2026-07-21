import { bookingConfig } from '~/config/booking'
import type { BookingQuote, CourtId } from '~/types/booking'

export function usePricingQuote() {
  const bookingApi = usePublicBookingApi()
  const quote = ref<BookingQuote | null>(null)
  const pending = ref(false)
  const error = ref<string | null>(null)
  let activeRequest = 0

  async function loadQuote(
    courtId: CourtId,
    date: string,
    time?: string,
    extraServiceIds: string[] = [],
    durationMinutes = bookingConfig.defaultDurationMinutes
  ) {
    const requestId = ++activeRequest
    pending.value = true
    error.value = null

    try {
      const response = await bookingApi.getQuote({
        courtId,
        date,
        time,
        durationMinutes,
        extraServiceIds
      })

      if (requestId === activeRequest) {
        quote.value = response
      }
    } catch {
      if (requestId === activeRequest) {
        quote.value = null
        error.value = 'Nuk arritem ta verifikojme rezervimin.'
      }
    } finally {
      if (requestId === activeRequest) {
        pending.value = false
      }
    }
  }

  return {
    quote,
    pending,
    error,
    loadQuote
  }
}
