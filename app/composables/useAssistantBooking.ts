import { computed, watch } from 'vue'
import { assistantConfig } from '~/config/assistant'
import { bookingConfig, getBusinessToday } from '~/config/booking'
import type { BookingDraft, BookingSlot, CourtId, CreateBookingRequest, PublicBookingOptions } from '~/types/booking'

function defaultDraft(): BookingDraft {
  return {
    extraServiceIds: [],
    customer: {}
  }
}

function getStatusCode(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return undefined
  }

  if ('statusCode' in error && typeof error.statusCode === 'number') {
    return error.statusCode
  }

  if ('status' in error && typeof error.status === 'number') {
    return error.status
  }

  return undefined
}

function sameIdSet(first: string[], second: string[]) {
  return first.length === second.length && first.every(id => second.includes(id))
}

export function useAssistantBooking() {
  const bookingApi = usePublicBookingApi()
  const draft = useState<BookingDraft>('diamond-assistant:booking-draft', defaultDraft)
  const options = useState<PublicBookingOptions | null>('diamond-assistant:booking-options', () => null)
  const loadingOptions = useState('diamond-assistant:options-loading', () => false)
  const slots = useState<BookingSlot[]>('diamond-assistant:slots', () => [])
  const loadingAvailability = useState('diamond-assistant:slots-loading', () => false)
  const loadingQuote = useState('diamond-assistant:quote-loading', () => false)
  const confirming = useState('diamond-assistant:confirming', () => false)
  const error = useState<string | null>('diamond-assistant:booking-error', () => null)
  let availabilityRequest = 0
  let quoteRequest = 0

  const courts = computed(() => options.value?.courts ?? [])
  const extraServices = computed(() => options.value?.extraServices ?? [])
  const minDate = computed(() => getBusinessToday(options.value?.timezone ?? bookingConfig.defaultTimezone))
  const selectedCourt = computed(() => courts.value.find(court => court.id === draft.value.courtId))
  const canFetchSlots = computed(() => Boolean(draft.value.courtId && draft.value.date))
  const availableSlots = computed(() => slots.value.filter(slot => slot.available))
  const hasCurrentQuote = computed(() => {
    const quote = draft.value.quote

    return Boolean(
      quote
      && quote.court.id === draft.value.courtId
      && quote.date === draft.value.date
      && quote.time === draft.value.time
      && quote.durationMinutes === bookingConfig.defaultDurationMinutes
      && sameIdSet(quote.extras.map(extra => extra.id), draft.value.extraServiceIds ?? [])
    )
  })
  const canConfirm = computed(() => Boolean(
    draft.value.courtId
    && draft.value.date
    && draft.value.time
    && hasCurrentQuote.value
    && draft.value.customer.firstName?.trim()
    && draft.value.customer.lastName?.trim()
    && draft.value.customer.phone?.trim()
  ))

  function persistNonSensitiveDraft() {
    if (!import.meta.client) {
      return
    }

    localStorage.setItem(assistantConfig.storageKeys.draft, JSON.stringify({
      courtId: draft.value.courtId,
      date: draft.value.date,
      time: draft.value.time,
      extraServiceIds: draft.value.extraServiceIds ?? []
    }))
  }

  async function loadOptions() {
    if (loadingOptions.value) {
      return
    }

    loadingOptions.value = true

    try {
      const response = await bookingApi.getOptions()
      options.value = response

      if (!response.courts.some(court => court.id === draft.value.courtId)) {
        draft.value = {
          ...draft.value,
          courtId: response.courts[0]?.id,
          time: undefined,
          quote: undefined
        }
      }

      draft.value = {
        ...draft.value,
        extraServiceIds: (draft.value.extraServiceIds ?? [])
          .filter(id => response.extraServices.some(service => service.id === id))
      }
    } catch {
      error.value = 'Nuk arrita t\'i ngarkoj fushat. Provo perseri.'
    } finally {
      loadingOptions.value = false
    }
  }

  async function restoreDraft() {
    if (import.meta.client) {
      const raw = localStorage.getItem(assistantConfig.storageKeys.draft)

      if (raw) {
        try {
          const saved = JSON.parse(raw) as Partial<BookingDraft>
          draft.value = {
            ...draft.value,
            courtId: saved.courtId,
            date: saved.date,
            time: saved.time,
            extraServiceIds: saved.extraServiceIds ?? []
          }
        } catch {
          localStorage.removeItem(assistantConfig.storageKeys.draft)
        }
      }
    }

    await loadOptions()
  }

  function setCourt(courtId: CourtId) {
    if (!courts.value.some(court => court.id === courtId)) {
      return
    }

    availabilityRequest += 1
    quoteRequest += 1
    slots.value = []
    loadingAvailability.value = false
    loadingQuote.value = false
    draft.value = {
      ...draft.value,
      courtId,
      time: undefined,
      quote: undefined,
      confirmation: undefined
    }
  }

  function setDate(date: string) {
    if (!date || date < minDate.value) {
      return
    }

    availabilityRequest += 1
    quoteRequest += 1
    slots.value = []
    loadingAvailability.value = false
    loadingQuote.value = false
    draft.value = {
      ...draft.value,
      date,
      time: undefined,
      quote: undefined,
      confirmation: undefined
    }
  }

  function setTime(time: string) {
    if (!availableSlots.value.some(slot => slot.time === time)) {
      return
    }

    quoteRequest += 1
    loadingQuote.value = false
    draft.value = {
      ...draft.value,
      time,
      quote: undefined,
      confirmation: undefined
    }
  }

  function toggleExtraService(serviceId: string) {
    if (!extraServices.value.some(service => service.id === serviceId)) {
      return
    }

    quoteRequest += 1
    loadingQuote.value = false
    const selected = draft.value.extraServiceIds ?? []
    draft.value = {
      ...draft.value,
      extraServiceIds: selected.includes(serviceId)
        ? selected.filter(id => id !== serviceId)
        : [...selected, serviceId],
      quote: undefined,
      confirmation: undefined
    }
  }

  function updateCustomer(field: 'firstName' | 'lastName' | 'phone' | 'email', value: string) {
    draft.value = {
      ...draft.value,
      customer: {
        ...draft.value.customer,
        [field]: value
      }
    }
  }

  async function fetchAvailability() {
    const requestId = ++availabilityRequest

    if (!options.value || !draft.value.courtId || !draft.value.date || draft.value.date < minDate.value) {
      slots.value = []
      loadingAvailability.value = false
      return
    }

    loadingAvailability.value = true
    error.value = null

    try {
      const response = await bookingApi.getAvailability(draft.value.courtId, draft.value.date)

      if (requestId === availabilityRequest) {
        slots.value = response.slots
      }
    } catch {
      if (requestId === availabilityRequest) {
        error.value = 'Nuk arrita t\'i lexoj terminet e lira. Provo perseri.'
        slots.value = []
      }
    } finally {
      if (requestId === availabilityRequest) {
        loadingAvailability.value = false
      }
    }
  }

  async function fetchQuote() {
    const requestId = ++quoteRequest

    if (!options.value || !draft.value.courtId || !draft.value.date || !draft.value.time) {
      draft.value = {
        ...draft.value,
        quote: undefined
      }
      loadingQuote.value = false
      return
    }

    loadingQuote.value = true
    error.value = null

    try {
      const quote = await bookingApi.getQuote({
        courtId: draft.value.courtId,
        date: draft.value.date,
        time: draft.value.time,
        durationMinutes: bookingConfig.defaultDurationMinutes,
        extraServiceIds: draft.value.extraServiceIds ?? []
      })

      if (requestId === quoteRequest) {
        draft.value = {
          ...draft.value,
          quote
        }
      }
    } catch {
      if (requestId === quoteRequest) {
        error.value = 'Nuk arrita ta verifikoj rezervimin. Provo perseri.'
      }
    } finally {
      if (requestId === quoteRequest) {
        loadingQuote.value = false
      }
    }
  }

  async function confirmBooking() {
    if (!canConfirm.value || !draft.value.courtId || !draft.value.date || !draft.value.time) {
      error.value = 'Ploteso fushen, daten, oren dhe te dhenat kryesore.'
      return
    }

    confirming.value = true
    error.value = null

    const payload: CreateBookingRequest = {
      courtId: draft.value.courtId,
      date: draft.value.date,
      time: draft.value.time,
      durationMinutes: bookingConfig.defaultDurationMinutes,
      extraServiceIds: draft.value.extraServiceIds ?? [],
      customer: {
        firstName: draft.value.customer.firstName?.trim() ?? '',
        lastName: draft.value.customer.lastName?.trim() ?? '',
        phone: draft.value.customer.phone?.trim() ?? '',
        email: draft.value.customer.email?.trim() || undefined
      }
    }

    try {
      const confirmation = await bookingApi.createBooking(payload)

      draft.value = {
        ...draft.value,
        confirmation
      }

      if (import.meta.client) {
        localStorage.removeItem(assistantConfig.storageKeys.draft)
      }
    } catch (bookingError) {
      const statusCode = getStatusCode(bookingError)
      error.value = statusCode === 409
        ? 'Ky termin sapo u rezervua. Po te tregojme alternativat e lira.'
        : 'Rezervimi nuk u konfirmua. Kontrollo te dhenat dhe provo perseri.'

      if (statusCode === 409) {
        await fetchAvailability()
      }
    } finally {
      confirming.value = false
    }
  }

  function resetBooking() {
    draft.value = defaultDraft()
    slots.value = []
    error.value = null

    if (import.meta.client) {
      localStorage.removeItem(assistantConfig.storageKeys.draft)
    }
  }

  watch(() => [draft.value.courtId, draft.value.date], async () => {
    persistNonSensitiveDraft()

    if (canFetchSlots.value) {
      await fetchAvailability()
    }
  })

  watch(() => [draft.value.courtId, draft.value.date, draft.value.time, (draft.value.extraServiceIds ?? []).join('|')], async () => {
    persistNonSensitiveDraft()

    if (draft.value.courtId && draft.value.date && draft.value.time) {
      await fetchQuote()
    }
  })

  return {
    draft,
    courts,
    extraServices,
    slots,
    availableSlots,
    selectedCourt,
    minDate,
    loadingOptions,
    loadingAvailability,
    loadingQuote,
    confirming,
    error,
    canConfirm,
    restoreDraft,
    loadOptions,
    setCourt,
    setDate,
    setTime,
    toggleExtraService,
    updateCustomer,
    fetchAvailability,
    fetchQuote,
    confirmBooking,
    resetBooking
  }
}
