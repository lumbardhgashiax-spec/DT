<script setup lang="ts">
import type { ReservationView } from '~/types/dashboard'
import type { TableRow } from '~/types/database.types'
import { parseDate } from '@internationalized/date'
import { combineLocalDateTime, formatCurrency, toLocalDateInput, toLocalTimeInput } from '~/utils/dashboard'

const props = defineProps<{
  open: boolean
  reservation?: ReservationView | null
  initialDate?: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const dashboardApi = useDashboardApi()
const toast = useToast()

const isSaving = ref(false)
const errorMessage = ref('')
const calendarOpen = ref(false)
const customers = ref<TableRow<'customers'>[]>([])
const courts = ref<TableRow<'courts'>[]>([])
const seasons = ref<TableRow<'seasons'>[]>([])
const priceRules = ref<TableRow<'price_rules'>[]>([])
const extraServices = ref<TableRow<'extra_services'>[]>([])
const occupiedReservations = ref<Array<Pick<ReservationView, 'id' | 'start_at' | 'end_at'>>>([])
const isLoadingOccupiedReservations = ref(false)
const occupiedReservationsError = ref('')
const isLoadingOptions = ref(false)
let occupiedReservationsRequest = 0

const form = reactive({
  customerId: null as string | null,
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  courtType: 'indoor' as 'indoor' | 'outdoor',
  courtId: '',
  date: '',
  time: '',
  endTime: '',
  extraServiceIds: [] as string[],
  status: 'confirmed' as TableRow<'reservations'>['status'],
  notes: ''
})

const selectedCourt = computed(() => courts.value.find(court => court.id === form.courtId))
const selectedDate = computed(() => form.date ? new Date(`${form.date}T12:00:00`) : null)
const activeSeason = computed(() => seasons.value.find((season) => {
  if (!selectedDate.value || !season.is_active) return false
  const date = form.date
  return date >= season.starts_on && date <= season.ends_on
}))
const matchingPriceRule = computed(() => priceRules.value.find(rule => (
  rule.is_active
  && rule.season_id === activeSeason.value?.id
  && rule.court_type === selectedCourt.value?.court_type
  && rule.with_heating === false
  && rule.duration_minutes === 60
)))
const selectedExtraServices = computed(() => extraServices.value.filter(service => form.extraServiceIds.includes(service.id)))
const extraServicesTotal = computed(() => selectedExtraServices.value.reduce((sum, service) => sum + Number(service.price), 0))
const durationMinutes = computed(() => timeToMinutes(form.endTime) - timeToMinutes(form.time))
const bookedHours = computed(() => durationMinutes.value / 60)
const isValidDuration = computed(() => durationMinutes.value >= 60 && durationMinutes.value % 30 === 0)
const hourlyCourtPrice = computed(() => matchingPriceRule.value ? Number(matchingPriceRule.value.price) : undefined)
const courtSubtotal = computed(() => hourlyCourtPrice.value === undefined || !isValidDuration.value ? undefined : hourlyCourtPrice.value * bookedHours.value)
const servicesSubtotal = computed(() => isValidDuration.value ? extraServicesTotal.value * bookedHours.value : 0)
const pricePreview = computed(() => courtSubtotal.value === undefined ? undefined : courtSubtotal.value + servicesSubtotal.value)
const priceIssue = computed(() => {
  if (!isValidDuration.value) return 'Zgjidh nje interval prej te pakten 1 ore, me hapa prej 30 minutash.'
  if (!activeSeason.value) return 'Nuk ka sezon aktiv për datën e zgjedhur. Kontrollo sezonet dhe datat e tyre.'
  if (!matchingPriceRule.value) return `Nuk ka çmim bazë aktiv për 1 orë në ${form.courtType === 'indoor' ? 'fushë të mbyllur' : 'fushë të hapur'}, në sezonin “${activeSeason.value.name}”.`
  return ''
})
const customerSuggestions = computed(() => customers.value.slice(0, 100))
const statusItems = [{ label: 'Në pritje', value: 'pending' }, { label: 'Konfirmuar', value: 'confirmed' }, { label: 'Përfunduar', value: 'completed' }, { label: 'Anuluar', value: 'cancelled' }]
const courtItems = computed(() => courts.value.map(court => ({ label: `${court.name} (${court.court_type === 'indoor' ? 'E mbyllur' : 'E hapur'})${court.is_active ? '' : ' - Joaktive'}`, value: court.id, disabled: !court.is_active })))
const openingMinutes = 10 * 60
const closingMinutes = 24 * 60
const allTimeItems = Array.from({ length: (closingMinutes - openingMinutes) / 30 + 1 }, (_, index) => {
  const minutes = openingMinutes + index * 30
  const value = minutesToTime(minutes)
  return { label: minutes === closingMinutes ? '00:00' : value, value }
})
const canSelectTime = computed(() => Boolean(form.date && form.courtId))
const timeItems = computed(() => allTimeItems
  .filter(item => timeToMinutes(item.value) <= closingMinutes - 60)
  .map(item => ({
    ...item,
    disabled: !canSelectTime.value || isTimeRangeOccupied(item.value, minutesToTime(timeToMinutes(item.value) + 60))
  })))
const endTimeItems = computed(() => {
  if (!form.time || !canSelectTime.value) return []

  return allTimeItems.filter((item) => {
    const duration = timeToMinutes(item.value) - timeToMinutes(form.time)
    return duration >= 60
  }).map(item => ({
    ...item,
    disabled: isTimeRangeOccupied(form.time, item.value)
  }))
})
function timeToMinutes(value: string) {
  const [hours = 0, minutes = 0] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(totalMinutes: number) {
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`
}

function displayTime(value: string) {
  return value === '24:00' ? '00:00' : value
}

function isTimeRangeOccupied(startTime: string, endTime: string) {
  if (!form.date || !startTime || !endTime) return false

  const candidateStart = new Date(combineLocalDateTime(form.date, startTime)).getTime()
  const candidateEnd = new Date(combineLocalDateTime(form.date, endTime)).getTime()
  if (!Number.isFinite(candidateStart) || !Number.isFinite(candidateEnd) || candidateEnd <= candidateStart) return false

  return occupiedReservations.value.some((reservation) => {
    if (reservation.id === props.reservation?.id) return false
    const reservedStart = new Date(reservation.start_at).getTime()
    const reservedEnd = new Date(reservation.end_at).getTime()
    return reservedStart < candidateEnd && reservedEnd > candidateStart
  })
}

async function loadOccupiedReservations() {
  const requestId = ++occupiedReservationsRequest
  occupiedReservations.value = []
  occupiedReservationsError.value = ''

  if (!form.date || !form.courtId) return

  isLoadingOccupiedReservations.value = true
  try {
    const reservations = await dashboardApi.listReservations({
      courtId: form.courtId,
      startAt: combineLocalDateTime(form.date, minutesToTime(openingMinutes)),
      endAt: combineLocalDateTime(form.date, minutesToTime(closingMinutes)),
      statuses: ['pending', 'confirmed', 'completed'],
      order: 'asc',
      limit: 100
    })
    if (requestId !== occupiedReservationsRequest) return
    occupiedReservations.value = reservations
  } catch {
    if (requestId !== occupiedReservationsRequest) return
    occupiedReservationsError.value = 'Oraret e zena nuk mund te ngarkoheshin. Provo perseri.'
  } finally {
    if (requestId === occupiedReservationsRequest) isLoadingOccupiedReservations.value = false
  }
}

const dateValue = computed({
  get: () => form.date ? parseDate(form.date) : undefined,
  set: (value) => { form.date = value?.toString() || '' }
})
const dateLabel = computed(() => selectedDate.value
  ? new Intl.DateTimeFormat('sq-AL', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }).format(selectedDate.value)
  : 'Zgjidh datën')

function close() {
  if (!isSaving.value) emit('update:open', false)
}

function resetForm() {
  const start = props.reservation ? new Date(props.reservation.start_at) : new Date()
  if (!props.reservation && props.initialDate) {
    const requested = new Date(`${props.initialDate}T12:00:00`)
    if (!Number.isNaN(requested.getTime())) start.setFullYear(requested.getFullYear(), requested.getMonth(), requested.getDate())
  }

  form.customerId = props.reservation?.customer_id || null
  form.firstName = props.reservation?.customers?.first_name || ''
  form.lastName = props.reservation?.customers?.last_name || ''
  form.phone = props.reservation?.customers?.phone || ''
  form.email = props.reservation?.customers?.email || ''
  form.courtId = props.reservation?.court_id || courts.value[0]?.id || ''
  form.courtType = selectedCourt.value?.court_type || courts.value[0]?.court_type || 'indoor'
  form.date = props.reservation ? toLocalDateInput(start) : props.initialDate || ''
  form.time = props.reservation ? toLocalTimeInput(start) : ''
  if (props.reservation) {
    const end = new Date(props.reservation.end_at)
    const endTime = toLocalTimeInput(end)
    form.endTime = toLocalDateInput(end) > toLocalDateInput(start) && endTime === '00:00' ? '24:00' : endTime
  } else {
    form.endTime = ''
  }
  form.extraServiceIds = []
  form.status = props.reservation?.status || 'confirmed'
  form.notes = props.reservation?.notes || ''
  errorMessage.value = ''
}

function selectExistingCustomer(customer: TableRow<'customers'>) {
  form.customerId = customer.id
  form.firstName = customer.first_name
  form.lastName = customer.last_name
  form.phone = customer.phone
  form.email = customer.email || ''
}

function matchCustomerByPhone() {
  const normalized = form.phone.replace(/\s+/g, '')
  const customer = customers.value.find(item => item.phone.replace(/\s+/g, '') === normalized)
  if (customer) selectExistingCustomer(customer)
  else form.customerId = null
}

function isServiceSelected(serviceId: string) {
  return form.extraServiceIds.includes(serviceId)
}

function setServiceSelected(serviceId: string, checked: boolean | 'indeterminate') {
  if (checked === true && !isServiceSelected(serviceId)) {
    form.extraServiceIds.push(serviceId)
  }
  if (checked !== true) {
    form.extraServiceIds = form.extraServiceIds.filter(id => id !== serviceId)
  }
}

async function loadOptions() {
  isLoadingOptions.value = true
  try {
    const data = await dashboardApi.getReservationOptions()
    customers.value = data.customers
    courts.value = data.courts
    seasons.value = data.seasons
    priceRules.value = data.priceRules
    extraServices.value = data.extraServices
    resetForm()
    await nextTick()
  } finally {
    isLoadingOptions.value = false
  }

  await loadOccupiedReservations()
}

async function save() {
  if (isSaving.value) return
  errorMessage.value = ''

  if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim() || !form.courtId || !form.date || !form.time || !form.endTime) {
    errorMessage.value = 'Plotëso të gjitha fushat e detyrueshme.'
    return
  }

  if (pricePreview.value === undefined) {
    errorMessage.value = priceIssue.value
    return
  }

  isSaving.value = true

  try {
    const startAt = combineLocalDateTime(form.date, form.time)
    const endAt = new Date(new Date(startAt).getTime() + durationMinutes.value * 60_000).toISOString()
    const availability = await dashboardApi.checkReservationAvailability({
      courtId: form.courtId,
      startAt,
      endAt,
      excludeId: props.reservation?.id
    })
    if (!availability.available) {
      errorMessage.value = 'Kjo fushë është tashmë e rezervuar në intervalin e zgjedhur.'
      return
    }

    await dashboardApi.saveReservation({
      reservationId: props.reservation?.id,
      customerId: form.customerId,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      email: form.email,
      courtId: form.courtId,
      startAt,
      durationMinutes: durationMinutes.value,
      status: form.status,
      notes: form.notes,
      extraServiceIds: form.extraServiceIds
    })

    toast.add({
      title: props.reservation ? 'Rezervimi u përditësua' : 'Rezervimi u krijua',
      color: 'success',
      icon: 'i-lucide-circle-check'
    })
    emit('saved')
    emit('update:open', false)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Rezervimi nuk mund të ruhej.'
  } finally {
    isSaving.value = false
  }
}

watch(() => props.open, async (open) => {
  if (open) {
    await loadOptions()
    if (import.meta.client) document.body.style.overflow = 'hidden'
  } else if (import.meta.client) {
    document.body.style.overflow = ''
  }
})

watch(() => form.courtId, () => {
  if (selectedCourt.value) form.courtType = selectedCourt.value.court_type
})

watch([() => form.date, () => form.courtId], () => {
  if (isLoadingOptions.value) return
  form.time = ''
  form.endTime = ''
  void loadOccupiedReservations()
})

watch(() => form.time, () => {
  if (!endTimeItems.value.some(item => item.value === form.endTime)) form.endTime = endTimeItems.value[0]?.value || ''
})

onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
        @click.self="close"
      >
        <div
          class="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:max-h-[calc(100dvh-3rem)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reservation-form-title"
        >
          <header class="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/40 sm:px-7 sm:py-5">
            <div class="flex items-center gap-3">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UIcon
                  name="i-lucide-calendar-plus"
                  class="size-5"
                />
              </div>
              <div>
                <p class="dashboard-kicker">
                  Rezervimet
                </p>
                <h2
                  id="reservation-form-title"
                  class="dashboard-section-title mt-1"
                >
                  {{ reservation ? 'Ndrysho rezervimin' : 'Rezervim i ri' }}
                </h2>
              </div>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              aria-label="Mbyll"
              @click="close"
            />
          </header>

          <UForm
            id="reservation-form"
            :state="form"
            class="flex-1 space-y-5 overflow-y-auto bg-slate-50/50 px-5 py-5 dark:bg-slate-950 sm:px-7 sm:py-7"
            @submit="save"
          >
            <UAlert
              v-if="errorMessage"
              color="error"
              variant="subtle"
              icon="i-lucide-circle-alert"
              :description="errorMessage"
              class="mx-auto max-w-4xl"
            />

            <fieldset class="mx-auto max-w-4xl space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/30 sm:p-5">
              <legend class="dashboard-card-title">
                Të dhënat e klientit
              </legend>
              <div class="grid gap-4 pt-1 sm:grid-cols-2">
                <UFormField
                  label="Emri"
                  required
                >
                  <UInput
                    v-model="form.firstName"
                    class="w-full"
                    autocomplete="given-name"
                  />
                </UFormField>
                <UFormField
                  label="Mbiemri"
                  required
                >
                  <UInput
                    v-model="form.lastName"
                    class="w-full"
                    autocomplete="family-name"
                  />
                </UFormField>
                <UFormField
                  label="Telefoni"
                  required
                >
                  <UInput
                    v-model="form.phone"
                    class="w-full"
                    type="tel"
                    autocomplete="tel"
                    list="customer-phones"
                    @blur="matchCustomerByPhone"
                  />
                  <datalist id="customer-phones">
                    <option
                      v-for="customer in customerSuggestions"
                      :key="customer.id"
                      :value="customer.phone"
                    >
                      {{ customer.first_name }} {{ customer.last_name }}
                    </option>
                  </datalist>
                </UFormField>
                <UFormField label="Email">
                  <UInput
                    v-model="form.email"
                    class="w-full"
                    type="email"
                    autocomplete="email"
                  />
                </UFormField>
              </div>
              <p
                v-if="form.customerId"
                class="flex items-center gap-2 text-xs text-emerald-600"
              >
                <UIcon
                  name="i-lucide-user-check"
                  class="size-4"
                /> Klient ekzistues i identifikuar nga telefoni
              </p>
            </fieldset>

            <fieldset class="mx-auto max-w-4xl space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/30 sm:p-5">
              <legend class="dashboard-card-title">
                Termini
              </legend>
              <div class="grid gap-4 pt-1 sm:grid-cols-2">
                <UFormField
                  label="Fusha"
                  required
                >
                  <USelect
                    v-model="form.courtId"
                    :items="courtItems"
                    value-key="value"
                    :ui="{ content: 'z-[60]' }"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="Data"
                  required
                >
                  <UPopover
                    v-model:open="calendarOpen"
                    :ui="{ content: 'z-[60]' }"
                  >
                    <UButton
                      color="neutral"
                      variant="outline"
                      icon="i-lucide-calendar-days"
                      trailing-icon="i-lucide-chevron-down"
                      class="w-full justify-between"
                    >
                      {{ dateLabel }}
                    </UButton>
                    <template #content>
                      <div class="p-3">
                        <UCalendar
                          v-model="dateValue"
                          locale="sq-AL"
                          @update:model-value="calendarOpen = false"
                        />
                      </div>
                    </template>
                  </UPopover>
                </UFormField>
                <UFormField
                  label="Nga ora"
                  required
                >
                  <USelect
                    v-model="form.time"
                    :items="timeItems"
                    value-key="value"
                    :ui="{ content: 'z-[60]' }"
                    placeholder="Zgjidh orën e fillimit"
                    :loading="isLoadingOccupiedReservations"
                    :disabled="!canSelectTime || isLoadingOccupiedReservations"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="Deri në ora"
                  required
                >
                  <USelect
                    v-model="form.endTime"
                    :items="endTimeItems"
                    value-key="value"
                    :ui="{ content: 'z-[60]' }"
                    placeholder="Zgjidh orën e përfundimit"
                    :disabled="!form.time || !canSelectTime || isLoadingOccupiedReservations"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <p
                v-if="!form.date"
                class="text-sm text-slate-500 dark:text-slate-400"
              >
                Zgjidh fillimisht datën, pastaj fushën dhe orarin.
              </p>
              <p
                v-else-if="isLoadingOccupiedReservations"
                class="text-sm text-slate-500 dark:text-slate-400"
              >
                Po kontrollohen oraret e zëna…
              </p>
              <p
                v-else-if="canSelectTime"
                class="text-sm text-slate-500 dark:text-slate-400"
              >
                Oraret e zëna janë të hijezuara dhe nuk mund të zgjidhen.
              </p>
              <UAlert
                v-if="occupiedReservationsError"
                color="warning"
                variant="subtle"
                icon="i-lucide-circle-alert"
                :description="occupiedReservationsError"
              />

              <div
                v-if="extraServices.length"
                class="space-y-2 pt-2"
              >
                <p class="dashboard-card-title">
                  Shërbime shtesë
                </p>
                <div
                  v-for="service in extraServices"
                  :key="service.id"
                  class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition-colors hover:border-primary/30 dark:border-slate-800 dark:bg-slate-950/30"
                >
                  <span><span class="font-medium text-highlighted">{{ service.name }}</span><span
                    v-if="service.description"
                    class="dashboard-meta ml-2"
                  >{{ service.description }}</span></span>
                  <span class="flex items-center gap-3"><strong class="text-sm text-highlighted">{{ formatCurrency(service.price) }}/orë</strong><UCheckbox
                    :model-value="isServiceSelected(service.id)"
                    @update:model-value="setServiceSelected(service.id, $event)"
                  /></span>
                </div>
              </div>
            </fieldset>

            <fieldset class="mx-auto max-w-4xl space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/30 sm:p-5">
              <legend class="dashboard-card-title">
                Pagesa dhe statusi
              </legend>
              <div>
                <UFormField label="Statusi">
                  <USelect
                    v-model="form.status"
                    :items="statusItems"
                    value-key="value"
                    :ui="{ content: 'z-[60]' }"
                    class="w-full"
                  />
                </UFormField>
              </div>
              <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div class="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p class="dashboard-metric-label text-slate-500 dark:text-slate-400">
                      Çmimi i llogaritur
                    </p><p class="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      {{ pricePreview === undefined ? '--' : formatCurrency(pricePreview) }}
                    </p>
                  </div>
                  <div class="rounded-lg bg-primary/10 px-3 py-2 text-right text-xs text-primary">
                    <p>{{ activeSeason?.name || 'Pa sezon aktiv' }}</p><p>{{ displayTime(form.time) }} – {{ displayTime(form.endTime) }}</p>
                  </div>
                </div>
                <p
                  v-if="priceIssue"
                  class="m-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                >
                  {{ priceIssue }}
                </p>
                <div
                  v-else
                  class="space-y-3 border-t border-slate-200 px-4 py-4 text-sm dark:border-slate-800"
                >
                  <div class="flex justify-between gap-4 text-slate-600 dark:text-slate-300">
                    <span>Fusha · {{ formatCurrency(hourlyCourtPrice) }}/orë × {{ bookedHours }}</span><span class="font-medium text-slate-950 dark:text-white">{{ formatCurrency(courtSubtotal) }}</span>
                  </div>
                  <div
                    v-for="service in selectedExtraServices"
                    :key="service.id"
                    class="flex justify-between gap-4 text-slate-600 dark:text-slate-300"
                  >
                    <span>{{ service.name }} · {{ formatCurrency(service.price) }}/orë × {{ bookedHours }}</span><span class="font-medium text-slate-950 dark:text-white">{{ formatCurrency(Number(service.price) * bookedHours) }}</span>
                  </div>
                  <div class="flex justify-between gap-4 border-t border-slate-200 pt-3 text-base font-semibold text-slate-950 dark:border-slate-800 dark:text-white">
                    <span>Totali</span><span class="text-primary">{{ formatCurrency(pricePreview) }}</span>
                  </div>
                </div>
              </div>
              <UFormField label="Shënime">
                <UTextarea
                  v-model="form.notes"
                  class="w-full"
                  :rows="3"
                />
              </UFormField>
            </fieldset>
          </UForm>

          <footer class="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7 dark:border-slate-800 dark:bg-slate-950">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="isSaving"
              @click="close"
            >
              Anulo
            </UButton>
            <UButton
              icon="i-lucide-save"
              type="submit"
              form="reservation-form"
              :loading="isSaving"
            >
              {{ reservation ? 'Ruaj ndryshimet' : 'Krijo rezervimin' }}
            </UButton>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
