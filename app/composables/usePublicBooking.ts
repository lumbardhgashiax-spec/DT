import { bookingConfig, getBusinessToday } from '~/config/booking'
import type { BookingCheckout, BookingQuote, BookingSlot, CourtId, PublicBookingOptions } from '~/types/booking'

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

function getResponseMessage(error: unknown) {
  if (typeof error !== 'object' || error === null || !('data' in error)) {
    return ''
  }

  const data = error.data
  return typeof data === 'object'
    && data !== null
    && 'message' in data
    && typeof data.message === 'string'
    ? data.message
    : ''
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

function createCheckoutRequestId() {
  return globalThis.crypto.randomUUID()
}

export function usePublicBooking() {
  const route = useRoute()
  const bookingApi = usePublicBookingApi()
  const options = ref<PublicBookingOptions | null>(null)
  const optionsLoading = ref(false)
  const optionsError = ref<string | null>(null)
  const courtId = ref<CourtId>(typeof route.query.court === 'string' ? route.query.court : '')
  const date = ref(typeof route.query.date === 'string' ? route.query.date : '')
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
  const confirmation = ref<BookingCheckout | null>(null)
  const legalAccepted = ref(false)
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
  let checkoutRequestId = ''

  const timezone = computed(() => options.value?.timezone ?? bookingConfig.defaultTimezone)
  const paymentAvailable = computed(() => options.value?.payment.available ?? false)
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
  const customerErrors = computed(() => {
    const firstName = customer.firstName.trim()
    const lastName = customer.lastName.trim()
    const phone = customer.phone.trim()
    const email = customer.email.trim()
    const phoneDigits = phone.match(/\d/g)?.length ?? 0

    return {
      firstName: firstName && (firstName.length < 2 || firstName.length > 100)
        ? 'Emri duhet te kete 2 deri ne 100 karaktere.'
        : '',
      lastName: lastName && (lastName.length < 2 || lastName.length > 100)
        ? 'Mbiemri duhet te kete 2 deri ne 100 karaktere.'
        : '',
      phone: phone && (!/^[+\d][\d\s-]{6,18}$/.test(phone) || phoneDigits < 7)
        ? 'Shkruaj nje numer telefoni valid.'
        : '',
      email: email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
        ? 'Email-i nuk eshte valid.'
        : ''
    }
  })
  const isCustomerValid = computed(() => Boolean(
    customer.firstName.trim().length >= 2
    && customer.firstName.trim().length <= 100
    && customer.lastName.trim().length >= 2
    && customer.lastName.trim().length <= 100
    && customer.phone.trim()
    && !Object.values(customerErrors.value).some(Boolean)
  ))
  const canSubmit = computed(() => Boolean(
    selectedCourt.value
    && date.value
    && time.value
    && hasCurrentQuote.value
    && isCustomerValid.value
    && legalAccepted.value
    && paymentAvailable.value
    && !loadingQuote.value
    && !submitting.value
  ))
  const step = computed(() => {
    if (!selectedCourt.value) return 1
    if (!date.value) return 2
    if (!time.value) return 3
    return 4
  })
  const nextDates = computed(() => (
    minDate.value
      ? Array.from({ length: 14 }, (_, index) => addDays(minDate.value, index))
      : []
  ))

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
    error.value = null
  }

  function clearQuoteAfterSelectionChange() {
    quoteRequest += 1
    quote.value = null
    loadingQuote.value = false
    confirmation.value = null
    error.value = null
  }

  function refreshQuoteAfterSelectionChange() {
    clearQuoteAfterSelectionChange()
    void nextTick(() => {
      void refreshQuote()
    })
  }

  function selectCourt(value: CourtId) {
    if (!courts.value.some(court => court.id === value)) {
      return
    }

    if (courtId.value === value) return

    date.value = ''
    extraServiceIds.value = []
    durationMinutes.value = options.value?.durationMinutes || bookingConfig.defaultDurationMinutes
    courtId.value = value
    clearSelectionAfterCourtOrDateChange()
  }

  function selectDate(value: string) {
    if (!selectedCourt.value || !value || value < minDate.value) {
      return
    }

    if (date.value === value) return

    date.value = value
    clearSelectionAfterCourtOrDateChange()
  }

  function selectTime(value: string) {
    if (!availableSlots.value.some(slot => slot.time === value)) {
      return
    }

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
    refreshQuoteAfterSelectionChange()
  }

  function toggleExtraService(serviceId: string) {
    if (!extraServices.value.some(service => service.id === serviceId)) {
      return
    }

    extraServiceIds.value = extraServiceIds.value.includes(serviceId)
      ? extraServiceIds.value.filter(id => id !== serviceId)
      : [...extraServiceIds.value, serviceId]
    refreshQuoteAfterSelectionChange()
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
      const nextCourtId = validCourtId ?? ''
      if (courtId.value !== nextCourtId) {
        clearSelectionAfterCourtOrDateChange()
      }
      courtId.value = nextCourtId
      extraServiceIds.value = extraServiceIds.value.filter(id => response.extraServices.some(service => service.id === id))

      if (
        !nextCourtId
        || !/^\d{4}-\d{2}-\d{2}$/.test(date.value)
        || date.value < getBusinessToday(response.timezone)
      ) {
        clearSelectionAfterCourtOrDateChange()
        date.value = ''
      }

      if (courtId.value && date.value) {
        await refreshAvailability()

        if (
          time.value
          && selectedTimes.value.every(selectedTime => slots.value.some(slot => (
            slot.time === selectedTime && slot.available
          )))
        ) {
          await refreshQuote()
        } else if (time.value) {
          time.value = ''
          durationMinutes.value = configuredDuration
          quote.value = null
        }
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
    if (!paymentAvailable.value) {
      error.value = 'Pagesa me Paysera nuk eshte aktivizuar ende. Asnje rezervim nuk mund te konfirmohet pa pagese.'
      return
    }

    if (!canSubmit.value) {
      error.value = 'Ploteso me radhe fushen, daten, oren, te dhenat dhe prano kushtet para pageses.'
      return
    }

    submitting.value = true
    error.value = null

    try {
      checkoutRequestId ||= createCheckoutRequestId()
      const checkout = await bookingApi.createBooking({
        courtId: courtId.value,
        date: date.value,
        time: time.value,
        durationMinutes: durationMinutes.value,
        extraServiceIds: extraServiceIds.value,
        checkoutRequestId,
        legalAccepted: legalAccepted.value,
        customer: {
          firstName: customer.firstName.trim(),
          lastName: customer.lastName.trim(),
          phone: customer.phone.trim(),
          email: customer.email.trim() || undefined
        }
      })
      confirmation.value = checkout
      window.location.assign(checkout.checkoutUrl)
    } catch (submitError) {
      const statusCode = getStatusCode(submitError)
      const responseMessage = getResponseMessage(submitError)

      if ([409, 422, 502, 503].includes(statusCode || 0)) {
        checkoutRequestId = ''
      }

      if (statusCode === 409 && responseMessage.toLowerCase().includes('termin')) {
        error.value = 'Ky termin sapo u rezervua. Po te tregojme alternativat e lira.'
      } else if (statusCode === 422) {
        error.value = responseMessage || 'Kontrollo te dhenat e rezervimit dhe provo perseri.'
      } else if (statusCode === 429) {
        error.value = 'Ka shume kerkesa per momentin. Prit pak dhe provo perseri.'
      } else if (statusCode === 502 || statusCode === 503) {
        error.value = responseMessage || 'Pagesa nuk mund te hapej tani. Asnje rezervim nuk eshte konfirmuar; provo perseri pas pak.'
      } else {
        error.value = 'Nuk mund ta perfundojme kerkesen. Asnje rezervim nuk eshte konfirmuar.'
      }

      if (statusCode === 409 && responseMessage.toLowerCase().includes('termin')) {
        await refreshAvailability()
      }
    } finally {
      submitting.value = false
    }
  }

  watch([courtId, date], () => {
    void refreshAvailability()
  })

  watch([courtId, date, time, durationMinutes, () => extraServiceIds.value.join('|')], () => {
    checkoutRequestId = ''
    void refreshQuote()
  })

  watch(customer, () => {
    checkoutRequestId = ''
  })

  onMounted(() => {
    void refreshOptions()
  })

  return {
    step,
    options,
    optionsLoading,
    optionsError,
    timezone,
    paymentAvailable,
    courtId,
    date,
    time,
    durationMinutes,
    maximumDurationNotice,
    extraServiceIds,
    customer,
    customerErrors,
    isCustomerValid,
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
    legalAccepted,
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
