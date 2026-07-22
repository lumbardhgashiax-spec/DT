import { bookingConfig, getBusinessToday } from '~/config/booking'
import type { BookingConfirmation, BookingQuote, BookingSlot, CourtId, PublicBookingOptions } from '~/types/booking'

export interface PublicBookingCustomer {
  firstName: string
  lastName: string
  phone: string
  email: string
  note: string
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

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00.000Z`)
  value.setUTCDate(value.getUTCDate() + amount)
  return value.toISOString().slice(0, 10)
}

function sameIdSet(first: string[], second: string[]) {
  return first.length === second.length && first.every(id => second.includes(id))
}

function timeToMinutes(value: string) {
  const [hour = 0, minute = 0] = value.split(':').map(Number)
  return (hour * 60) + minute
}

function minutesToTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}

export function usePublicBooking() {
  const route = useRoute()
  const router = useRouter()
  const bookingApi = usePublicBookingApi()
  const step = ref(1)
  const options = ref<PublicBookingOptions | null>(null)
  const optionsLoading = ref(false)
  const optionsError = ref<string | null>(null)
  const courtId = ref<CourtId>(typeof route.query.court === 'string' ? route.query.court : '')
  const date = ref(typeof route.query.date === 'string' ? route.query.date : getBusinessToday())
  const time = ref(typeof route.query.time === 'string' ? route.query.time : '')
  const requestedDuration = Number(route.query.durationMinutes)
  const durationMinutes = ref<number>(
    Number.isInteger(requestedDuration)
    && requestedDuration >= bookingConfig.defaultDurationMinutes
    && requestedDuration <= bookingConfig.maxDurationMinutes
    && requestedDuration % bookingConfig.defaultSlotMinutes === 0
      ? requestedDuration
      : bookingConfig.defaultDurationMinutes
  )
  const extraServiceIds = ref<string[]>([])
  const maximumDurationNotice = ref(false)
  const slots = ref<BookingSlot[]>([])
  const quote = ref<BookingQuote | null>(null)
  const confirmation = ref<BookingConfirmation | null>(null)
  const loadingSlots = ref(false)
  const loadingQuote = ref(false)
  const submitting = ref(false)
  const error = ref<string | null>(null)
  const customer = reactive<PublicBookingCustomer>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    note: ''
  })
  let availabilityRequest = 0
  let quoteRequest = 0

  const timezone = computed(() => options.value?.timezone ?? bookingConfig.defaultTimezone)
  const courts = computed(() => options.value?.courts ?? [])
  const extraServices = computed(() => options.value?.extraServices ?? [])
  const selectedCourt = computed(() => courts.value.find(court => court.id === courtId.value))
  const selectedExtraServices = computed(() => {
    const selected = new Set(extraServiceIds.value)
    return extraServices.value.filter(service => selected.has(service.id))
  })
  const availableSlots = computed(() => slots.value.filter(slot => slot.available))
  const selectedTimes = computed(() => {
    if (!time.value) return []
    return Array.from(
      { length: durationMinutes.value / bookingConfig.defaultSlotMinutes },
      (_, index) => minutesToTime(timeToMinutes(time.value) + (index * bookingConfig.defaultSlotMinutes))
    )
  })
  const endTime = computed(() => time.value
    ? minutesToTime(timeToMinutes(time.value) + durationMinutes.value)
    : '')
  const season = computed(() => quote.value?.season ?? null)
  const minDate = computed(() => getBusinessToday(timezone.value))
  const hasCurrentQuote = computed(() => {
    const currentQuote = quote.value

    return Boolean(
      currentQuote
      && currentQuote.court.id === courtId.value
      && currentQuote.date === date.value
      && currentQuote.time === time.value
      && currentQuote.durationMinutes === durationMinutes.value
      && sameIdSet(currentQuote.extras.map(extra => extra.id), extraServiceIds.value)
    )
  })
  const canSubmit = computed(() => Boolean(
    selectedCourt.value
    && date.value
    && time.value
    && hasCurrentQuote.value
    && customer.firstName.trim()
    && customer.lastName.trim()
    && customer.phone.trim()
  ))

  const nextDates = computed(() => Array.from({ length: 14 }, (_, index) => addDays(minDate.value, index)))

  function clearSelectionAfterCourtOrDateChange() {
    availabilityRequest += 1
    quoteRequest += 1
    slots.value = []
    loadingSlots.value = false
    loadingQuote.value = false
    time.value = ''
    maximumDurationNotice.value = false
    quote.value = null
    confirmation.value = null
  }

  function selectCourt(value: CourtId) {
    if (!courts.value.some(court => court.id === value)) {
      return
    }

    courtId.value = value
    clearSelectionAfterCourtOrDateChange()
    step.value = Math.max(step.value, 2)
  }

  function selectDate(value: string) {
    if (!value || value < minDate.value) {
      return
    }

    date.value = value
    clearSelectionAfterCourtOrDateChange()
    step.value = Math.max(step.value, 3)
  }

  function selectTime(value: string) {
    if (!availableSlots.value.some(slot => slot.time === value)) {
      return
    }

    quoteRequest += 1
    const currentSelection = selectedTimes.value
    const nextTime = currentSelection[currentSelection.length - 1]
    const canExtend = Boolean(
      time.value
      && nextTime
      && value === minutesToTime(timeToMinutes(nextTime) + bookingConfig.defaultSlotMinutes)
      && durationMinutes.value < bookingConfig.maxDurationMinutes
    )

    const attemptedBeyondMaximum = Boolean(
      time.value
      && nextTime
      && value === minutesToTime(timeToMinutes(nextTime) + bookingConfig.defaultSlotMinutes)
      && durationMinutes.value >= bookingConfig.maxDurationMinutes
    )

    if (attemptedBeyondMaximum) {
      maximumDurationNotice.value = true
      return
    }

    if (canExtend) {
      durationMinutes.value += bookingConfig.defaultSlotMinutes
    } else if (currentSelection.length > 1 && value === nextTime) {
      durationMinutes.value -= bookingConfig.defaultSlotMinutes
    } else {
      time.value = value
      durationMinutes.value = bookingConfig.defaultDurationMinutes
    }
    maximumDurationNotice.value = false
    quote.value = null
    loadingQuote.value = false
    confirmation.value = null
    step.value = Math.max(step.value, 4)
  }

  function toggleExtraService(serviceId: string) {
    if (!extraServices.value.some(service => service.id === serviceId)) {
      return
    }

    quoteRequest += 1
    extraServiceIds.value = extraServiceIds.value.includes(serviceId)
      ? extraServiceIds.value.filter(id => id !== serviceId)
      : [...extraServiceIds.value, serviceId]
    quote.value = null
    loadingQuote.value = false
    confirmation.value = null
    step.value = Math.max(step.value, 5)
  }

  async function refreshOptions() {
    optionsLoading.value = true
    optionsError.value = null

    try {
      const response = await bookingApi.getOptions()
      options.value = response
      const configuredDuration = response.durationMinutes || bookingConfig.defaultDurationMinutes
      if (durationMinutes.value < configuredDuration) {
        durationMinutes.value = configuredDuration
      }

      const requestedCourtId = typeof route.query.court === 'string' ? route.query.court : ''
      const validCourtId = [requestedCourtId, courtId.value]
        .find(id => response.courts.some(court => court.id === id))
      const nextCourtId = validCourtId ?? response.courts[0]?.id ?? ''
      if (courtId.value !== nextCourtId) {
        clearSelectionAfterCourtOrDateChange()
      }
      courtId.value = nextCourtId
      extraServiceIds.value = extraServiceIds.value.filter(id => response.extraServices.some(service => service.id === id))

      if (date.value < getBusinessToday(response.timezone)) {
        clearSelectionAfterCourtOrDateChange()
        date.value = getBusinessToday(response.timezone)
      }
    } catch {
      options.value = null
      optionsError.value = 'Nuk u ngarkuan fushat dhe sherbimet. Provo perseri.'
    } finally {
      optionsLoading.value = false
    }
  }

  async function refreshAvailability() {
    const requestId = ++availabilityRequest

    if (!courtId.value || !date.value || date.value < minDate.value) {
      slots.value = []
      loadingSlots.value = false
      return
    }

    loadingSlots.value = true
    error.value = null

    try {
      const response = await bookingApi.getAvailability(courtId.value, date.value)

      if (requestId === availabilityRequest) {
        slots.value = response.slots
      }
    } catch {
      if (requestId === availabilityRequest) {
        error.value = 'Nuk ka lidhje me terminet. Provo perseri.'
        slots.value = []
      }
    } finally {
      if (requestId === availabilityRequest) {
        loadingSlots.value = false
      }
    }
  }

  async function refreshQuote() {
    const requestId = ++quoteRequest

    if (!courtId.value || !date.value || !time.value) {
      quote.value = null
      loadingQuote.value = false
      return
    }

    loadingQuote.value = true
    error.value = null

    try {
      const response = await bookingApi.getQuote({
        courtId: courtId.value,
        date: date.value,
        time: time.value,
        durationMinutes: durationMinutes.value,
        extraServiceIds: extraServiceIds.value
      })

      if (requestId === quoteRequest) {
        quote.value = response
      }
    } catch {
      if (requestId === quoteRequest) {
        error.value = 'Rezervimi nuk u verifikua. Asnje rezervim nuk eshte krijuar.'
        quote.value = null
      }
    } finally {
      if (requestId === quoteRequest) {
        loadingQuote.value = false
      }
    }
  }

  async function submitBooking() {
    if (!canSubmit.value) {
      error.value = 'Ploteso fushen, daten, oren dhe te dhenat kryesore.'
      return
    }

    submitting.value = true
    error.value = null

    try {
      confirmation.value = await bookingApi.createBooking({
        courtId: courtId.value,
        date: date.value,
        time: time.value,
        durationMinutes: durationMinutes.value,
        extraServiceIds: extraServiceIds.value,
        customer: {
          firstName: customer.firstName.trim(),
          lastName: customer.lastName.trim(),
          phone: customer.phone.trim(),
          email: customer.email.trim() || undefined
        }
      })

      await router.push({
        path: '/rezervimi/sukses',
        query: { reference: confirmation.value.reference }
      })
    } catch (submitError) {
      const statusCode = getStatusCode(submitError)
      error.value = statusCode === 409
        ? 'Ky termin sapo u rezervua. Po te tregojme alternativat e lira.'
        : 'Nuk mund ta perfundojme kerkesen. Asnje rezervim nuk eshte krijuar.'

      if (statusCode === 409) {
        await refreshAvailability()
      }
    } finally {
      submitting.value = false
    }
  }

  watch([courtId, date], () => {
    void refreshAvailability()
  }, { immediate: true })

  watch([courtId, date, time, durationMinutes, () => extraServiceIds.value.join('|')], () => {
    void refreshQuote()
  }, { immediate: true })

  onMounted(() => {
    void refreshOptions()
  })

  return {
    step,
    options,
    optionsLoading,
    optionsError,
    timezone,
    courtId,
    date,
    time,
    durationMinutes,
    maximumDurationNotice,
    extraServiceIds,
    customer,
    courts,
    extraServices,
    selectedExtraServices,
    season,
    hasCurrentQuote,
    selectedCourt,
    slots,
    availableSlots,
    selectedTimes,
    endTime,
    quote,
    confirmation,
    loadingSlots,
    loadingQuote,
    submitting,
    error,
    canSubmit,
    minDate,
    nextDates,
    selectCourt,
    selectDate,
    selectTime,
    toggleExtraService,
    refreshOptions,
    refreshAvailability,
    refreshQuote,
    submitBooking
  }
}
