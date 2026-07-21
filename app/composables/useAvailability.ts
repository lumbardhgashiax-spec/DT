import type { BookingSlot, CourtId } from '~/types/booking'

export function useAvailability() {
  const bookingApi = usePublicBookingApi()
  const slots = ref<BookingSlot[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)
  let activeRequest = 0

  async function loadAvailability(courtId: CourtId, date: string) {
    const requestId = ++activeRequest
    pending.value = true
    error.value = null

    try {
      const response = await bookingApi.getAvailability(courtId, date)

      if (requestId === activeRequest) {
        slots.value = response.slots
      }
    } catch {
      if (requestId === activeRequest) {
        error.value = 'Nuk arritem t\'i lexojme terminet e lira.'
        slots.value = []
      }
    } finally {
      if (requestId === activeRequest) {
        pending.value = false
      }
    }
  }

  return {
    slots,
    pending,
    error,
    loadAvailability
  }
}
