<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { bookingConfig, getBusinessToday } from '~/config/booking'
import { useAvailability } from '~/composables/useAvailability'
import type { CourtId, PublicBookingOptions } from '~/types/booking'

function addDays(date: string, amount: number) {
  const next = new Date(`${date}T12:00:00.000Z`)
  next.setUTCDate(next.getUTCDate() + amount)
  return next.toISOString().slice(0, 10)
}

function formatDisplayDate(date: string) {
  if (!date) return ''
  const [year, month, day] = date.split('-')
  return `${day}.${month}.${year}`
}

function formatDateCard(date: string) {
  const weekdays = ['Die', 'Hen', 'Mar', 'Mer', 'Enj', 'Pre', 'Sht']
  const months = ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nen', 'Dhj']
  const parsed = new Date(`${date}T12:00:00.000Z`)
  return {
    day: String(parsed.getUTCDate()).padStart(2, '0'),
    weekday: weekdays[parsed.getUTCDay()] ?? '',
    month: months[parsed.getUTCMonth()] ?? '',
    value: date
  }
}

function timeToMinutes(value: string) {
  const [hour = 0, minute = 0] = value.split(':').map(Number)
  return (hour * 60) + minute
}

function minutesToTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}

const bookingApi = usePublicBookingApi()
const options = ref<PublicBookingOptions | null>(null)
const optionsPending = ref(false)
const optionsError = ref<string | null>(null)
const selectedCourtId = ref<CourtId>('')
const selectedDate = ref('')
const selectedTime = ref('')
const durationMinutes = ref(bookingConfig.defaultDurationMinutes)
const maximumDurationNotice = ref(false)
const availability = useAvailability()

const timezone = computed(() => options.value?.timezone ?? bookingConfig.defaultTimezone)
const courts = computed(() => options.value?.courts ?? [])
const minDate = computed(() => getBusinessToday(timezone.value))
const selectedCourt = computed(() => courts.value.find(court => court.id === selectedCourtId.value))
const visibleSlots = computed(() => availability.slots.value.filter(slot => slot.available))
const selectedSlot = computed(() => visibleSlots.value.find(slot => slot.time === selectedTime.value))
const selectedTimes = computed(() => {
  if (!selectedTime.value) return []
  return Array.from(
    { length: durationMinutes.value / bookingConfig.defaultSlotMinutes },
    (_, index) => minutesToTime(timeToMinutes(selectedTime.value) + (index * bookingConfig.defaultSlotMinutes))
  )
})
const endTime = computed(() => selectedTime.value
  ? minutesToTime(timeToMinutes(selectedTime.value) + durationMinutes.value)
  : '')
const displayDate = computed(() => formatDisplayDate(selectedDate.value))
const dateCards = computed(() => minDate.value
  ? Array.from({ length: 7 }, (_, index) => formatDateCard(addDays(minDate.value, index)))
  : [])

function courtTypeLabel(courtType: 'indoor' | 'outdoor') {
  return courtType === 'indoor' ? 'Fushe e mbyllur' : 'Fushe e hapur'
}

function courtNumber(index: number) {
  return String(index + 1).padStart(2, '0')
}

function selectCourt(courtId: CourtId) {
  selectedCourtId.value = courtId
}

function selectDate(date: string) {
  selectedDate.value = date
}

async function refreshAvailability() {
  selectedTime.value = ''
  durationMinutes.value = bookingConfig.defaultDurationMinutes
  maximumDurationNotice.value = false
  if (!selectedCourtId.value || !selectedDate.value || selectedDate.value < minDate.value) {
    availability.slots.value = []
    return
  }
  await availability.loadAvailability(selectedCourtId.value, selectedDate.value)
}

function selectTime(value: string) {
  if (!visibleSlots.value.some(slot => slot.time === value)) return

  const lastSelectedTime = selectedTimes.value[selectedTimes.value.length - 1]
  const canExtend = Boolean(
    lastSelectedTime
    && value === minutesToTime(timeToMinutes(lastSelectedTime) + bookingConfig.defaultSlotMinutes)
    && durationMinutes.value < bookingConfig.maxDurationMinutes
  )

  const attemptedBeyondMaximum = Boolean(
    lastSelectedTime
    && value === minutesToTime(timeToMinutes(lastSelectedTime) + bookingConfig.defaultSlotMinutes)
    && durationMinutes.value >= bookingConfig.maxDurationMinutes
  )

  if (attemptedBeyondMaximum) {
    maximumDurationNotice.value = true
    return
  }

  if (canExtend) {
    durationMinutes.value += bookingConfig.defaultSlotMinutes
  } else if (selectedTimes.value.length > 1 && value === lastSelectedTime) {
    durationMinutes.value -= bookingConfig.defaultSlotMinutes
  } else {
    selectedTime.value = value
    durationMinutes.value = bookingConfig.defaultDurationMinutes
  }
  maximumDurationNotice.value = false
}

watch([selectedCourtId, selectedDate], () => void refreshAvailability(), { flush: 'post' })

async function loadOptions() {
  optionsPending.value = true
  optionsError.value = null

  try {
    const response = await bookingApi.getOptions()
    options.value = response
    selectedCourtId.value = response.courts.find(court => court.id === selectedCourtId.value)?.id
      ?? response.courts[0]?.id
      ?? ''
  } catch {
    options.value = null
    optionsError.value = 'Nuk u ngarkuan fushat. Provo perseri.'
  } finally {
    optionsPending.value = false
  }
}

onMounted(() => {
  void loadOptions()
})
</script>

<template>
  <section
    id="availability"
    class="availability-section"
    aria-labelledby="availability-title"
  >
    <header class="availability-section__heading">
      <div>
        <p><span /> Rezervim online</p>
        <h2 id="availability-title">
          Gjej terminin tend.
        </h2>
      </div>
      <span>Zgjidh fushen dhe daten. Oret e lira shfaqen menjehere.</span>
    </header>

    <div class="booking-experience">
      <div class="booking-experience__form">
        <div
          class="booking-progress"
          aria-label="Procesi i rezervimit"
        >
          <span class="is-active">01 <small>Fusha</small></span>
          <span :class="{ 'is-active': selectedDate }">02 <small>Data</small></span>
          <span :class="{ 'is-active': selectedTime }">03 <small>Ora</small></span>
        </div>

        <section
          class="booking-block"
          aria-labelledby="choose-court"
        >
          <div class="booking-block__title">
            <h3 id="choose-court">
              Cilen fushe deshironi?
            </h3>
            <span>{{ selectedCourt ? courtTypeLabel(selectedCourt.courtType) : '' }}</span>
          </div>
          <div
            v-if="optionsPending"
            class="booking-empty"
          >
            <UIcon
              name="i-lucide-loader-circle"
              aria-hidden="true"
            />
            <div>
              <strong>Po ngarkohen fushat</strong>
              <span>Vetem fushat aktive shfaqen ketu.</span>
            </div>
          </div>
          <div
            v-else-if="optionsError"
            class="booking-empty booking-empty--error"
          >
            <UIcon
              name="i-lucide-circle-alert"
              aria-hidden="true"
            />
            <div>
              <strong>Nuk u ngarkuan fushat</strong>
              <span>{{ optionsError }}</span>
            </div>
          </div>
          <div class="court-selector">
            <button
              v-for="(court, index) in courts"
              :key="court.id"
              type="button"
              :class="{ 'is-active': selectedCourtId === court.id }"
              @click="selectCourt(court.id)"
            >
              <span>{{ courtNumber(index) }}</span>
              <div>
                <strong>{{ court.name }}</strong>
                <small>{{ courtTypeLabel(court.courtType) }}</small>
              </div>
              <i aria-hidden="true" />
            </button>
          </div>
        </section>

        <section
          class="booking-block"
          aria-labelledby="choose-date"
        >
          <div class="booking-block__title">
            <h3 id="choose-date">
              Zgjidh daten
            </h3>
          </div>
          <label class="home-date-input">
            <UIcon name="i-lucide-calendar-days" aria-hidden="true" />
            <span>
              <strong>Zgjidh daten</strong>
              <small>Mund te zgjedhesh cdo date nga sot e tutje.</small>
            </span>
            <UInput v-model="selectedDate" type="date" :min="minDate" aria-label="Zgjidh daten e rezervimit" />
          </label>
          <div class="home-date-strip">
            <button
              v-for="day in dateCards"
              :key="day.value"
              type="button"
              :class="{ 'is-active': selectedDate === day.value }"
              @click="selectDate(day.value)"
            >
              <strong>{{ day.weekday }}, {{ day.day }} {{ day.month }}</strong>
              <span>{{ day.value }}</span>
            </button>
          </div>
        </section>

        <section
          class="booking-block booking-block--slots"
          aria-labelledby="choose-time"
        >
          <div class="booking-block__title">
            <h3 id="choose-time">
              Zgjidh oren
            </h3>
            <span v-if="selectedDate">{{ visibleSlots.length }} termine te lira</span>
          </div>

          <div
            v-if="!selectedDate"
            class="booking-empty"
          >
            <UIcon
              name="i-lucide-calendar-search"
              aria-hidden="true"
            />
            <div>
              <strong>Fillimisht zgjidh daten</strong>
              <span>Terminet e lira do te shfaqen ketu.</span>
            </div>
          </div>

          <div
            v-else-if="availability.pending.value"
            class="slot-grid"
            aria-label="Duke ngarkuar terminet"
          >
            <span
              v-for="item in 8"
              :key="item"
              class="slot-skeleton"
            />
          </div>

          <div
            v-else-if="availability.error.value"
            class="booking-empty booking-empty--error"
          >
            <UIcon
              name="i-lucide-circle-alert"
              aria-hidden="true"
            />
            <div>
              <strong>Nuk u ngarkuan terminet</strong>
              <span>{{ availability.error.value }}</span>
            </div>
          </div>

          <div
            v-else-if="visibleSlots.length"
            class="slot-grid"
          >
            <button
              v-for="slot in visibleSlots"
              :key="slot.time"
              type="button"
              :class="{ 'is-active': selectedTimes.includes(slot.time) }"
              @click="selectTime(slot.time)"
            >
              {{ slot.time }}
              <UIcon
                v-if="selectedTimes.includes(slot.time)"
                name="i-lucide-check"
                aria-hidden="true"
              />
            </button>
          </div>

          <div
            v-else
            class="booking-empty"
          >
            <UIcon
              name="i-lucide-clock-3"
              aria-hidden="true"
            />
            <div>
              <strong>Nuk ka termine te lira</strong>
              <span>Provo nje date ose fushe tjeter.</span>
            </div>
          </div>
          <UAlert
            v-if="maximumDurationNotice"
            color="warning"
            variant="subtle"
            icon="i-lucide-clock-alert"
            title="Maksimumi 5 orë"
            description="Për më shumë kohë, krijo një rezervim tjetër."
            class="mt-3"
          />
        </section>
      </div>

      <aside class="booking-summary">
        <img
          src="/hero/diamond-hero-serve.webp"
          width="1800"
          height="900"
          alt="Lojtar tenisi ne fushe"
        >
        <div class="booking-summary__overlay" />
        <div class="booking-summary__top">
          <span>Termini yt</span>
          <UIcon
            name="i-lucide-circle-dot"
            aria-hidden="true"
          />
        </div>
        <div class="booking-summary__details">
          <span>{{ selectedCourt?.name || 'Zgjidh fushen' }}</span>
          <strong>{{ selectedTime ? `${selectedTime} - ${endTime}` : '--:--' }}</strong>
          <p>{{ displayDate || 'Zgjidh daten per te pare oraret' }}</p>
          <div class="booking-summary__facts">
            <span>{{ durationMinutes / 60 }} ore</span>
            <span>Hajvali</span>
          </div>
          <div class="booking-summary__action">
            <UButton
              class="booking-summary__button"
              color="neutral"
              size="xl"
              block
              label="Vazhdo me rezervimin"
              trailing-icon="i-lucide-arrow-right"
              :disabled="!selectedSlot"
              :ui="{
                base: 'h-[52px] min-h-[52px] !border-[var(--lime)] !bg-[var(--lime)] !text-[var(--ink)] disabled:!border-[var(--lime)] disabled:!bg-[var(--lime)] disabled:!text-[var(--ink)] disabled:!opacity-75 aria-disabled:!border-[var(--lime)] aria-disabled:!bg-[var(--lime)] aria-disabled:!text-[var(--ink)] aria-disabled:!opacity-75 transition-none'
              }"
              :to="selectedSlot
                ? { path: '/rezervo', query: { court: selectedSlot.courtId, date: selectedSlot.date, time: selectedSlot.time, durationMinutes } }
                : undefined"
            />
            <small>Nuk kerkohet llogari.</small>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.availability-section {
  scroll-margin-top: 92px;
  padding: clamp(72px, 9vw, 126px) max(16px, 4vw);
  background: var(--page-bg);
  color: var(--ink);
}

.availability-section__heading,
.booking-experience {
  width: min(var(--container), 100%);
  margin-inline: auto;
}

.availability-section__heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 420px);
  gap: 36px;
  align-items: end;
  margin-bottom: 38px;
}

.availability-section__heading p {
  display: flex;
  gap: 9px;
  align-items: center;
  margin: 0 0 12px;
  color: #1A6B55;
  font-size: 0.72rem;
  font-weight: 820;
  text-transform: uppercase;
}

.availability-section__heading p span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--coral);
}

.availability-section__heading h2 {
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.5rem, 5vw, 4.6rem);
  font-weight: 500;
  line-height: 0.98;
}

.availability-section__heading > span {
  color: var(--muted);
  font-size: 0.96rem;
  line-height: 1.6;
}

.booking-experience {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.72fr);
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #FFFFFF;
  box-shadow: 0 26px 80px rgba(13, 35, 29, 0.08);
}

.booking-experience__form {
  display: grid;
  gap: 0;
  padding: clamp(24px, 4vw, 46px);
}

.booking-progress {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

.booking-progress span {
  display: flex;
  gap: 8px;
  align-items: center;
  border-top: 2px solid #DCE1DC;
  padding-top: 10px;
  color: #A1AAA6;
  font-size: 0.68rem;
  font-weight: 860;
}

.booking-progress span.is-active {
  border-color: var(--coral);
  color: var(--ink);
}

.booking-progress small {
  font-size: 0.7rem;
  font-weight: 700;
}

.booking-block {
  display: grid;
  gap: 14px;
  border-bottom: 1px solid var(--line);
  padding: 26px 0;
}

.booking-block:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.booking-block__title {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
}

.booking-block__title h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 820;
}

.booking-block__title > span {
  color: var(--muted);
  font-size: 0.76rem;
  font-weight: 680;
}

.home-date-input {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) minmax(160px, 220px);
  gap: 12px;
  align-items: center;
  border: 1px solid rgba(18, 61, 51, 0.22);
  border-radius: 6px;
  padding: 12px;
  background: #F7F9F5;
}

.home-date-input :deep(svg) {
  width: 42px;
  height: 42px;
  border-radius: 5px;
  padding: 10px;
  background: rgba(216, 255, 62, 0.34);
  color: var(--forest);
}

.home-date-input strong,
.home-date-input small {
  display: block;
}

.home-date-input small {
  margin-top: 3px;
  color: var(--muted);
  font-size: 0.82rem;
}

.home-date-input :deep(input) {
  width: 100%;
  min-height: 44px;
  border: 1px solid rgba(18, 61, 51, 0.22);
  border-radius: 5px;
  padding: 0 11px;
  background: #FFFFFF;
  color: var(--ink);
  font: inherit;
  font-weight: 800;
}

.home-date-strip {
  display: grid;
  grid-auto-columns: minmax(136px, 1fr);
  grid-auto-flow: column;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.home-date-strip button {
  min-height: 54px;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 12px;
  background: #FFFFFF;
  color: var(--ink);
  text-align: left;
  cursor: pointer;
}

.home-date-strip button.is-active {
  border-color: #173C32;
  background: #EEFFB8;
}

.home-date-strip strong,
.home-date-strip span {
  display: block;
}

.home-date-strip span {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.76rem;
}

.court-selector {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.court-selector button {
  min-height: 78px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 14px;
  background: #F8F9F5;
  color: var(--ink);
  text-align: left;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
}

.court-selector button:hover {
  transform: translateY(-1px);
  border-color: rgba(10, 23, 20, 0.28);
}

.court-selector button.is-active {
  border-color: var(--forest);
  background: #EEF5F0;
}

.court-selector button > span {
  color: #1A6B55;
  font-size: 0.72rem;
  font-weight: 880;
}

.court-selector strong,
.court-selector small {
  display: block;
}

.court-selector strong {
  font-size: 0.86rem;
  font-weight: 820;
}

.court-selector small {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.68rem;
  line-height: 1.25;
}

.court-selector i {
  width: 16px;
  height: 16px;
  border: 1px solid #BCC5C0;
  border-radius: 50%;
}

.court-selector button.is-active i {
  border: 5px solid var(--forest);
  background: var(--lime);
}

.calendar-input {
  position: relative;
  min-height: 38px;
  display: flex;
  gap: 8px;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 5px;
  padding: 0 11px;
  color: var(--ink);
  background: #F8F9F5;
  font-size: 0.72rem;
  font-weight: 760;
  cursor: pointer;
}

.calendar-input svg {
  width: 16px;
  height: 16px;
}

.calendar-input input {
  position: absolute;
  inset: 0;
  width: 100%;
  opacity: 0;
  cursor: pointer;
}

.date-scroll {
  width: 100%;
}

.date-row {
  min-width: max-content;
  display: flex;
  gap: 8px;
  padding-bottom: 4px;
}

.date-row button {
  width: 66px;
  min-height: 78px;
  display: grid;
  place-items: center;
  gap: 2px;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 8px;
  background: #FFFFFF;
  color: var(--ink);
  cursor: pointer;
}

.date-row button.is-active {
  border-color: var(--forest);
  background: var(--forest);
  color: #FFFFFF;
}

.date-row span,
.date-row small {
  color: #7C8984;
  font-size: 0.64rem;
  font-weight: 700;
}

.date-row button.is-active span,
.date-row button.is-active small {
  color: rgba(255, 255, 255, 0.66);
}

.date-row strong {
  font-size: 1.1rem;
  line-height: 1;
}

.slot-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.slot-grid button,
.slot-skeleton {
  min-height: 44px;
  border-radius: 5px;
}

.slot-grid button {
  display: flex;
  justify-content: center;
  gap: 7px;
  align-items: center;
  border: 1px solid var(--line);
  background: #F8F9F5;
  color: var(--ink);
  font-size: 0.76rem;
  font-weight: 780;
  cursor: pointer;
}

.slot-grid button.is-active {
  border-color: #173C32;
  background: #EEFFB8;
}

.slot-grid button svg {
  width: 14px;
  height: 14px;
}

.slot-skeleton {
  display: block;
  background: linear-gradient(90deg, #EFF1ED, #FAFBF8, #EFF1ED);
  background-size: 200% 100%;
  animation: slot-loading 1.3s linear infinite;
}

.booking-empty {
  min-height: 76px;
  display: flex;
  gap: 13px;
  align-items: center;
  border: 1px dashed rgba(10, 23, 20, 0.18);
  border-radius: 6px;
  padding: 15px;
  color: var(--muted);
  background: #FAFBF8;
}

.booking-empty > svg {
  width: 24px;
  height: 24px;
  color: #1A6B55;
}

.booking-empty strong,
.booking-empty span {
  display: block;
}

.booking-empty strong {
  color: var(--ink);
  font-size: 0.8rem;
}

.booking-empty span {
  margin-top: 3px;
  font-size: 0.7rem;
}

.booking-empty--error > svg {
  color: var(--coral);
}

.booking-summary {
  position: relative;
  min-height: 680px;
  display: grid;
  align-content: space-between;
  overflow: hidden;
  padding: 28px;
  color: #FFFFFF;
  isolation: isolate;
}

.booking-summary > img,
.booking-summary__overlay {
  position: absolute;
  inset: 0;
}

.booking-summary > img {
  z-index: -3;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 67% center;
}

.booking-summary__overlay {
  z-index: -2;
  background: linear-gradient(180deg, rgba(7, 20, 17, 0.2), rgba(7, 20, 17, 0.38) 42%, rgba(7, 20, 17, 0.96));
}

.booking-summary__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}

.booking-summary__top svg {
  width: 20px;
  height: 20px;
  color: var(--lime);
}

.booking-summary__details > span {
  color: var(--lime);
  font-size: 0.72rem;
  font-weight: 820;
  text-transform: uppercase;
}

.booking-summary__details > strong {
  display: block;
  margin-top: 6px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(3.2rem, 6vw, 5.4rem);
  font-weight: 500;
  line-height: 1;
}

.booking-summary__details > p {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.82rem;
}

.booking-summary__facts {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.booking-summary__facts span {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 6px 10px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.66rem;
  font-weight: 700;
}

.booking-summary__button {
  width: 100%;
  min-height: 52px;
  box-sizing: border-box;
  border-radius: 5px;
  border: 1px solid var(--lime);
  background: var(--lime) !important;
  color: var(--ink) !important;
  font-size: 0.8rem;
  font-weight: 840;
  transition: none;
}

.booking-summary__button:disabled,
.booking-summary__button[aria-disabled='true'] {
  border-color: var(--lime) !important;
  background: var(--lime) !important;
  color: var(--ink) !important;
  opacity: 0.75 !important;
}

.booking-summary__action {
  display: grid;
  gap: 10px;
  margin-top: 26px;
}

.booking-summary__action > small {
  color: rgba(255, 255, 255, 0.52);
  font-size: 0.66rem;
  text-align: center;
}

@keyframes slot-loading {
  to { background-position: -200% 0; }
}

@media (max-width: 920px) {
  .booking-experience {
    grid-template-columns: 1fr;
  }

  .booking-summary {
    min-height: 430px;
  }
}

@media (max-width: 760px) {
  .availability-section {
    padding-inline: 14px;
  }

  .availability-section__heading {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .booking-experience__form {
    padding: 20px 16px;
  }

  .court-selector {
    grid-template-columns: 1fr;
  }

  .home-date-input {
    width: 100%;
    grid-template-columns: 1fr !important;
    gap: 10px;
  }

  .home-date-input > span,
  .home-date-input :deep(.u-input) {
    width: 100%;
  }

  .home-date-input :deep(svg) {
    width: 38px;
    height: 38px;
  }

  .slot-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 420px) {
  .slot-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .booking-summary {
    min-height: 390px;
    padding: 22px;
  }
}
</style>
