<script setup lang="ts">
import type { CourtId } from '~/types/booking'

const booking = usePublicBooking()

const customerInputUi = {
  root: 'w-full',
  base: 'min-h-10 !ring-[rgba(18,61,51,0.22)] focus-visible:!outline-none focus-visible:!ring-[var(--forest)]'
}

const courtOptions = computed(() => booking.courts.value.map(court => ({
  label: court.name,
  value: court.id,
  description: court.courtType === 'indoor' ? 'Fushe e mbyllur' : 'Fushe e hapur'
})))

const bookingSteps = [
  { label: 'Fusha', icon: 'i-lucide-map-pin' },
  { label: 'Data', icon: 'i-lucide-calendar-days' },
  { label: 'Ora', icon: 'i-lucide-clock-3' },
  { label: 'Te dhenat', icon: 'i-lucide-user-round' }
]

function formatDate(value: string) {
  if (!value) return 'Pa zgjedhur'

  const weekdays = ['die', 'hen', 'mar', 'mer', 'enj', 'pre', 'sht']
  const months = ['jan', 'shk', 'mar', 'pri', 'maj', 'qer', 'kor', 'gush', 'sht', 'tet', 'nen', 'dhj']
  const date = new Date(`${value}T12:00:00.000Z`)

  return `${weekdays[date.getUTCDay()]}, ${String(date.getUTCDate()).padStart(2, '0')} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

function formatSuggestedDate(value: string) {
  return formatDate(value).replace(/\s\d{4}$/, '')
}

function selectCourt(value: string) {
  booking.selectCourt(value as CourtId)
}

function formatPrice(value: number, currency = 'EUR') {
  return new Intl.NumberFormat('sq-AL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

function formatDuration(minutes: number) {
  const hours = minutes / 60
  return `${hours} ${hours === 1 ? 'ore' : 'ore'}`
}
</script>

<template>
  <section class="booking-shell">
    <div class="booking-shell__intro">
      <p>Rezervimi</p>
      <h1>Rezervo fushen pa krijuar llogari.</h1>
      <span>
        Zgjidh fushen dhe termin, ploteso te dhenat, pastaj perfundo pagesen e sigurt ne Paysera.
      </span>
    </div>

    <ol
      class="booking-progress"
      aria-label="Hapat e rezervimit"
    >
      <li
        v-for="(item, index) in bookingSteps"
        :key="item.label"
        :class="{
          'is-active': booking.step.value === index + 1,
          'is-complete': booking.step.value > index + 1
        }"
      >
        <span>
          <UIcon
            :name="booking.step.value > index + 1 ? 'i-lucide-check' : item.icon"
            aria-hidden="true"
          />
        </span>
        <strong>{{ item.label }}</strong>
      </li>
    </ol>

    <div class="booking-shell__grid">
      <UForm
        class="booking-form"
        :state="booking.customer"
        @submit.prevent="booking.submitBooking"
      >
        <fieldset class="booking-step">
          <legend>1. Zgjidh fushen</legend>
          <div
            v-if="booking.optionsLoading.value"
            class="slot-loading"
          >
            Po ngarkohen fushat...
          </div>
          <div class="court-selector">
            <button
              v-for="(court, index) in courtOptions"
              :key="court.value"
              type="button"
              :class="{ 'is-active': booking.courtId.value === court.value }"
              @click="selectCourt(court.value)"
            >
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
              <div>
                <strong>{{ court.label }}</strong>
                <small>{{ court.description }}</small>
              </div>
              <i aria-hidden="true" />
            </button>
          </div>
          <UAlert
            v-if="booking.optionsError.value"
            color="error"
            variant="soft"
            icon="i-lucide-alert-circle"
            :description="booking.optionsError.value"
            class="booking-options-error"
          />
        </fieldset>

        <fieldset
          v-if="booking.selectedCourt.value"
          class="booking-step"
        >
          <legend>2. Zgjidh daten</legend>
          <BookingDatePicker
            :model-value="booking.date.value"
            :min="booking.minDate.value"
            @update:model-value="booking.selectDate"
          >
            <template #trigger="{ open }">
              <button
                type="button"
                class="booking-date-trigger"
                :aria-expanded="open"
                aria-label="Zgjidh daten e rezervimit"
              >
                <UIcon
                  name="i-lucide-calendar-days"
                  class="booking-date-trigger__calendar"
                  aria-hidden="true"
                />
                <div>
                  <strong>Data</strong>
                  <span>{{ formatDate(booking.date.value) }}</span>
                </div>
                <UIcon
                  name="i-lucide-chevron-down"
                  class="booking-date-trigger__chevron"
                  aria-hidden="true"
                />
              </button>
            </template>
          </BookingDatePicker>
          <div
            class="date-strip"
            aria-label="Datat e sugjeruara"
          >
            <button
              v-for="day in booking.nextDates.value"
              :key="day"
              type="button"
              :class="{ 'is-active': booking.date.value === day }"
              :aria-pressed="booking.date.value === day"
              @click="booking.selectDate(day)"
            >
              <strong>{{ formatSuggestedDate(day) }}</strong>
              <span>{{ day }}</span>
            </button>
          </div>
        </fieldset>

        <fieldset
          v-if="booking.date.value"
          class="booking-step"
        >
          <legend>3. Zgjidh oren</legend>
          <p class="booking-time-help">
            Zgjidh oren e pare, pastaj oret ngjitur per ta zgjatur te njejtin rezervim (deri ne 5 ore).
          </p>
          <div
            v-if="booking.loadingSlots.value"
            class="slot-loading"
          >
            Po kontrollohen terminet...
          </div>
          <div
            v-else
            class="slot-grid"
          >
            <button
              v-for="slot in booking.slots.value"
              :key="`${slot.date}-${slot.time}`"
              type="button"
              :disabled="!slot.available"
              :class="{ 'is-active': booking.selectedTimes.value.includes(slot.time) }"
              @click="booking.selectTime(slot.time)"
            >
              {{ slot.time }}
              <UIcon
                v-if="booking.selectedTimes.value.includes(slot.time)"
                name="i-lucide-check"
                aria-hidden="true"
              />
            </button>
          </div>
          <UAlert
            v-if="!booking.loadingSlots.value && !booking.slots.value.length"
            color="warning"
            variant="soft"
            icon="i-lucide-calendar-x-2"
            title="Nuk ka termine te disponueshme"
            description="Zgjidh nje date tjeter per kete fushe."
            class="mt-3"
          />
          <UAlert
            v-if="booking.maximumDurationNotice.value"
            color="warning"
            variant="subtle"
            icon="i-lucide-clock-alert"
            title="Kufiri i rezervimit"
            description="Një rezervim mund të zgjasë maksimumi 5 orë. Për kohë shtesë, krijo një rezervim tjetër."
            class="mt-3"
          />
        </fieldset>

        <fieldset
          v-if="booking.time.value && booking.extraServices.value.length"
          class="booking-step"
        >
          <legend>Sherbime shtese <span>(opsionale)</span></legend>
          <div class="option-grid option-grid--two">
            <button
              v-for="service in booking.extraServices.value"
              :key="service.id"
              type="button"
              :class="{ 'is-active': booking.extraServiceIds.value.includes(service.id) }"
              :aria-pressed="booking.extraServiceIds.value.includes(service.id)"
              @click="booking.toggleExtraService(service.id)"
            >
              <strong>{{ service.name }}</strong>
              <span>{{ service.description || 'Sherbim shtese' }} - {{ formatPrice(service.price) }}/ore</span>
            </button>
          </div>
        </fieldset>

        <fieldset
          v-if="booking.time.value"
          class="booking-step"
        >
          <legend>4. Te dhenat e klientit</legend>
          <div class="customer-grid">
            <UFormField
              label="Emri"
              name="firstName"
              required
              :error="booking.customerErrors.value.firstName || undefined"
            >
              <UInput
                v-model="booking.customer.firstName"
                color="neutral"
                size="md"
                :ui="customerInputUi"
                autocomplete="given-name"
                minlength="2"
                maxlength="100"
                required
              />
            </UFormField>
            <UFormField
              label="Mbiemri"
              name="lastName"
              required
              :error="booking.customerErrors.value.lastName || undefined"
            >
              <UInput
                v-model="booking.customer.lastName"
                color="neutral"
                size="md"
                :ui="customerInputUi"
                autocomplete="family-name"
                minlength="2"
                maxlength="100"
                required
              />
            </UFormField>
            <UFormField
              label="Telefoni"
              name="phone"
              required
              :error="booking.customerErrors.value.phone || undefined"
            >
              <UInput
                v-model="booking.customer.phone"
                color="neutral"
                size="md"
                :ui="customerInputUi"
                type="tel"
                inputmode="tel"
                autocomplete="tel"
                minlength="7"
                maxlength="19"
                required
              />
            </UFormField>
            <UFormField
              label="Email"
              name="email"
              :error="booking.customerErrors.value.email || undefined"
            >
              <UInput
                v-model="booking.customer.email"
                color="neutral"
                size="md"
                :ui="customerInputUi"
                type="email"
                autocomplete="email"
                maxlength="254"
              />
            </UFormField>
          </div>
        </fieldset>

        <UAlert
          v-if="booking.error.value"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :description="booking.error.value"
        />

        <UAlert
          v-if="booking.time.value && !booking.paymentAvailable.value"
          color="warning"
          variant="soft"
          icon="i-lucide-wrench"
          title="Pagesa online nuk eshte aktive"
          description="Konfigurimi i sigurt i Paysera-s po perfundohet. Rezervimi do te aktivizohet sapo sherbimi i pageses te jete gati."
        />

        <div
          v-if="booking.time.value"
          class="payment-handoff"
        >
          <UIcon
            name="i-lucide-shield-check"
            aria-hidden="true"
          />
          <span>
            Te dhenat e karteles ose bankes plotesohen vetem ne faqen e sigurt te Paysera-s.
            Diamond Tennis Academy nuk i ruan ato.
          </span>
        </div>

        <label
          v-if="booking.time.value"
          class="legal-acceptance"
        >
          <input
            v-model="booking.legalAccepted.value"
            type="checkbox"
          >
          <span>
            Pajtohem me
            <NuxtLink
              to="/terms"
              target="_blank"
            >Kushtet e përdorimit</NuxtLink>,
            <NuxtLink
              to="/privacy-policy"
              target="_blank"
            >Privacy Policy</NuxtLink>
            dhe
            <NuxtLink
              to="/refund-policy"
              target="_blank"
            >Cancellation & Refund Policy</NuxtLink>.
          </span>
        </label>

        <UButton
          v-if="booking.time.value"
          type="submit"
          size="lg"
          color="primary"
          block
          icon="i-lucide-credit-card"
          :loading="booking.submitting.value"
          :disabled="!booking.canSubmit.value"
          label="Vazhdo te pagesa e sigurt"
          class="booking-submit"
        />
      </UForm>

      <aside class="booking-summary">
        <p>Permbledhja</p>
        <h2>{{ booking.selectedCourt.value?.name || 'Zgjidh fushen' }}</h2>
        <dl>
          <div>
            <dt>Data</dt>
            <dd>{{ booking.date.value || 'Pa zgjedhur' }}</dd>
          </div>
          <div>
            <dt>Ora</dt>
            <dd>{{ booking.time.value ? `${booking.time.value} - ${booking.endTime.value}` : 'Pa zgjedhur' }}</dd>
          </div>
          <div>
            <dt>Fusha / ore</dt>
            <dd>{{ booking.quote.value ? formatPrice(booking.quote.value.courtHourlyPrice, booking.quote.value.currency) : '-' }}</dd>
          </div>
          <div v-if="booking.selectedExtraServices.value.length">
            <dt>Sherbime / ore</dt>
            <dd>{{ booking.quote.value ? formatPrice(booking.quote.value.extrasHourlyPrice, booking.quote.value.currency) : '-' }}</dd>
          </div>
        </dl>
        <div class="booking-summary__total">
          <span>Totali per {{ formatDuration(booking.durationMinutes.value) }}</span>
          <strong v-if="booking.loadingQuote.value">Po llogaritet...</strong>
          <strong v-else>{{ booking.quote.value ? formatPrice(booking.quote.value.totalPrice, booking.quote.value.currency) : '-' }}</strong>
        </div>
        <div class="booking-summary__ready">
          <UIcon
            name="i-lucide-calendar-check"
            aria-hidden="true"
          />
          <div>
            <strong>{{ booking.canSubmit.value ? 'Gati per pagese' : 'Vazhdo zgjedhjen' }}</strong>
            <span>Rezervimi konfirmohet vetem pasi Paysera ta verifikoje pagesen.</span>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.booking-shell {
  padding: clamp(94px, 10vw, 132px) max(18px, calc((100vw - var(--container)) / 2)) clamp(70px, 9vw, 118px);
  background: var(--page-bg);
  color: var(--ink);
}

.booking-shell__intro {
  max-width: 820px;
}

.booking-shell__intro p,
.booking-summary > p {
  margin: 0 0 12px;
  color: #1A6B55;
  font-size: 0.7rem;
  font-weight: 850;
  text-transform: uppercase;
}

.booking-shell__intro h1 {
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.35rem, 4.8vw, 4.7rem);
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0;
}

.booking-shell__intro span {
  display: block;
  max-width: 660px;
  margin-top: 18px;
  color: var(--muted);
  font-size: 0.96rem;
  line-height: 1.65;
}

.booking-progress {
  width: min(100%, 760px);
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  margin: 30px 0 0;
  padding: 0;
  list-style: none;
}

.booking-progress li {
  position: relative;
  min-width: 0;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  color: var(--muted);
}

.booking-progress li:not(:last-child)::after {
  position: absolute;
  z-index: 0;
  top: 16px;
  right: 0;
  left: 34px;
  height: 1px;
  background: var(--line);
  content: '';
}

.booking-progress li > span {
  position: relative;
  z-index: 1;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: #FFFFFF;
}

.booking-progress li :deep(svg) {
  width: 16px;
  height: 16px;
}

.booking-progress li strong {
  position: relative;
  z-index: 1;
  width: fit-content;
  padding-right: 8px;
  background: var(--page-bg);
  font-size: 0.76rem;
}

.booking-progress li.is-active {
  color: var(--forest);
}

.booking-progress li.is-active > span {
  border-color: var(--forest);
  background: var(--lime);
}

.booking-progress li.is-complete {
  color: var(--forest);
}

.booking-progress li.is-complete > span {
  border-color: var(--forest);
  background: var(--forest);
  color: #FFFFFF;
}

.booking-progress li.is-complete::after {
  background: var(--forest);
}

.booking-shell__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 390px);
  gap: 18px;
  align-items: start;
  margin-top: 20px;
}

.booking-form,
.booking-summary {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #FFFFFF;
  box-shadow: 0 22px 70px rgba(13, 35, 29, 0.07);
}

.booking-form {
  display: grid;
  gap: 24px;
  padding: clamp(18px, 3vw, 28px);
}

fieldset {
  min-width: 0;
  margin: 0;
  border: 0;
  padding: 0;
}

legend {
  margin-bottom: 12px;
  color: var(--ink);
  font-weight: 850;
}

legend span {
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 650;
}

.booking-step {
  animation: booking-step-in 180ms ease-out;
}

@keyframes booking-step-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.booking-time-help {
  margin: -4px 0 13px;
  color: var(--muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

.option-grid {
  display: grid;
  gap: 10px;
}

.option-grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

.option-grid button,
.date-strip button,
.slot-grid button {
  min-height: 54px;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 12px;
  background: #FFFFFF;
  color: var(--ink);
  text-align: left;
  cursor: pointer;
}

.option-grid button.is-active {
  border-color: var(--ink);
  background: var(--lime);
}

.date-strip button.is-active,
.slot-grid button.is-active {
  border-color: #173C32;
  background: #EEFFB8;
}

.option-grid strong,
.date-strip strong,
.date-strip span,
.option-grid span {
  display: block;
}

.option-grid span,
.date-strip span {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.86rem;
}

.date-strip {
  display: grid;
  grid-auto-columns: minmax(142px, 1fr);
  grid-auto-flow: column;
  gap: 10px;
  overflow-x: auto;
  margin-top: 12px;
  padding: 1px 1px 7px;
  scrollbar-width: thin;
  scrollbar-color: rgba(10, 23, 20, 0.25) transparent;
}

.date-strip button {
  color: var(--ink);
  text-align: left;
  cursor: pointer;
}

.date-strip button:hover {
  border-color: rgba(255, 112, 71, 0.72);
  background: #FFF4F0;
}

.date-strip button.is-active {
  border-color: var(--coral);
  background: var(--coral);
  color: #FFFFFF;
}

.date-strip button.is-active span {
  color: rgba(255, 255, 255, 0.82);
}

.booking-date-trigger {
  width: 100%;
  min-height: 68px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 20px;
  gap: 12px;
  align-items: center;
  border: 1px solid rgba(18, 61, 51, 0.22);
  border-radius: 6px;
  padding: 12px;
  background: #F7F9F5;
  color: var(--ink);
  text-align: left;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease;
}

.booking-date-trigger:hover,
.booking-date-trigger[aria-expanded='true'] {
  border-color: var(--forest);
  background: #EEF5F0;
}

.booking-date-trigger :deep(.booking-date-trigger__calendar) {
  width: 42px;
  height: 42px;
  border-radius: 5px;
  padding: 10px;
  background: #FFE8DF;
  color: #C2411D;
}

.booking-date-trigger > div {
  min-width: 0;
}

.booking-date-trigger span,
.booking-date-trigger strong {
  display: block;
}

.booking-date-trigger span {
  margin-top: 3px;
  color: var(--muted);
  font-size: 0.82rem;
}

.booking-date-trigger :deep(.booking-date-trigger__chevron) {
  width: 18px;
  height: 18px;
  color: var(--muted);
  transition: transform 160ms ease;
}

.booking-date-trigger[aria-expanded='true'] :deep(.booking-date-trigger__chevron) {
  transform: rotate(180deg);
}

.slot-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.slot-grid button {
  min-height: 44px;
  display: flex;
  justify-content: center;
  gap: 7px;
  align-items: center;
  border-radius: 5px;
  padding: 10px;
  background: #F8F9F5;
  font-size: 0.76rem;
  font-weight: 780;
  text-align: center;
}

.slot-grid button :deep(svg) {
  width: 15px;
  height: 15px;
  margin-left: 6px;
  vertical-align: -2px;
}

@media (max-width: 520px) {
  .slot-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 380px) {
  .slot-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.slot-grid button:disabled {
  opacity: 0.38;
  cursor: not-allowed;
  text-decoration: line-through;
}

.slot-loading {
  border-radius: 8px;
  padding: 18px;
  background: rgba(18, 61, 51, 0.06);
  color: var(--muted);
}

.booking-options-error {
  margin-top: 10px;
}

.payment-handoff {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 11px;
  align-items: center;
  border: 1px solid rgba(18, 61, 51, 0.16);
  border-radius: 6px;
  padding: 12px 14px;
  background: #F7F9F5;
  color: var(--muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

.payment-handoff :deep(svg) {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  padding: 8px;
  background: rgba(216, 255, 62, 0.38);
  color: var(--forest);
}

.legal-acceptance {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  border: 1px solid rgba(18, 61, 51, 0.16);
  border-radius: 6px;
  padding: 12px 14px;
  background: #FFFFFF;
  color: var(--muted);
  font-size: 0.8rem;
  line-height: 1.5;
  cursor: pointer;
}

.legal-acceptance input {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: var(--coral);
}

.legal-acceptance a {
  color: var(--forest);
  font-weight: 820;
  text-decoration: none;
}

.legal-acceptance a:hover {
  text-decoration: underline;
}

.customer-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

.customer-grid :deep(input) {
  min-height: 40px;
  border-color: rgba(18, 61, 51, 0.22) !important;
  background: #FFFFFF;
  outline: none !important;
}

.customer-grid :deep(input:focus),
.customer-grid :deep(input:focus-visible) {
  border-color: var(--forest) !important;
  box-shadow: 0 0 0 3px rgba(18, 61, 51, 0.14) !important;
  outline: none !important;
}

.booking-summary {
  position: sticky;
  top: 92px;
  padding: 24px;
}

.booking-summary h2 {
  margin: 0;
  color: var(--ink);
  font-size: 1.35rem;
}

.booking-summary dl {
  display: grid;
  gap: 1px;
  margin: 22px 0;
  background: var(--line);
}

.booking-summary dl div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 0;
  background: #FFFFFF;
}

.booking-summary dt {
  color: var(--muted);
}

.booking-summary dd {
  margin: 0;
  font-weight: 820;
}

.booking-summary__total {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: baseline;
  margin: -6px 0 22px;
  border-top: 1px solid var(--line);
  padding-top: 18px;
}

.booking-summary__total span {
  color: var(--muted);
  font-size: 0.86rem;
  font-weight: 720;
}

.booking-summary__total strong {
  color: var(--forest);
  font-size: 1.3rem;
}

.booking-summary__ready {
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 12px;
  align-items: start;
  border-radius: 8px;
  padding: 18px;
  background: var(--forest);
  color: #FFFFFF;
}

.booking-summary__ready :deep(svg) {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  padding: 9px;
  background: rgba(216, 255, 62, 0.16);
  color: var(--lime);
}

.booking-summary__ready span {
  display: block;
  color: rgba(255, 255, 255, 0.68);
  line-height: 1.45;
}

.booking-summary__ready strong {
  display: block;
  color: var(--lime);
  font-size: 0.98rem;
  line-height: 1.2;
}

.booking-submit {
  min-height: 48px;
  border-radius: 5px;
  background: var(--lime);
  color: var(--ink);
  font-weight: 900;
}

@media (min-width: 700px) {
  .customer-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 940px) {
  .booking-shell__grid {
    grid-template-columns: 1fr;
  }

  .booking-summary {
    position: static;
  }
}

@media (max-width: 760px) {
  .booking-progress li {
    grid-template-columns: 32px minmax(0, 1fr);
    gap: 5px;
  }

  .booking-progress li > span {
    width: 32px;
    height: 32px;
  }

  .booking-progress li:not(:last-child)::after {
    top: 15px;
    left: 32px;
  }

  .booking-progress li strong {
    font-size: 0.66rem;
  }

  .option-grid--two,
  .customer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
