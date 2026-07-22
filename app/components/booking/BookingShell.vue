<script setup lang="ts">
import { z } from 'zod'
import type { CourtId } from '~/types/booking'

const booking = usePublicBooking()

const customerSchema = z.object({
  firstName: z.string().trim().min(1, 'Shkruaj emrin.'),
  lastName: z.string().trim().min(1, 'Shkruaj mbiemrin.'),
  phone: z.string()
    .trim()
    .regex(/^[+\d][\d\s-]{6,18}$/, 'Shkruaj një numër telefoni valid.')
    .refine(value => (value.match(/\d/g)?.length ?? 0) >= 7, 'Numri duhet të ketë së paku 7 shifra.'),
  email: z.string()
    .trim()
    .refine(value => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'Shkruaj një email valid.')
})

const customerInputUi = {
  root: 'w-full',
  base: 'min-h-10 !ring-[rgba(18,61,51,0.22)] focus-visible:!outline-none focus-visible:!ring-[var(--forest)]'
}

const courtOptions = computed(() => booking.courts.value.map(court => ({
  label: court.name,
  value: court.id,
  description: court.courtType === 'indoor' ? 'Fushe e mbyllur' : 'Fushe e hapur'
})))

function formatDate(value: string) {
  const weekdays = ['die', 'hen', 'mar', 'mer', 'enj', 'pre', 'sht']
  const months = ['jan', 'shk', 'mar', 'pri', 'maj', 'qer', 'kor', 'gush', 'sht', 'tet', 'nen', 'dhj']
  const date = new Date(`${value}T12:00:00.000Z`)

  return `${weekdays[date.getUTCDay()]}, ${String(date.getUTCDate()).padStart(2, '0')} ${months[date.getUTCMonth()]}`
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
        Zgjedh fushen, daten, oren dhe te dhenat kryesore. Konfirmimi kryhet shpejt dhe pa hapur llogari.
      </span>
    </div>

    <div class="booking-shell__grid">
      <UForm
        class="booking-form"
        :schema="customerSchema"
        :state="booking.customer"
        :validate-on="['input', 'blur', 'change', 'submit']"
        :validate-on-input-delay="250"
        @submit.prevent="booking.submitBooking"
      >
        <fieldset>
          <legend>Zgjidh Fushen?</legend>
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

        <fieldset>
          <legend>Zgjidh Daten</legend>
          <label class="booking-date-input">
            <UIcon
              name="i-lucide-calendar-days"
              aria-hidden="true"
            />
            <span>
              <strong>Data</strong>
              <small>Mund te zgjedhesh cdo date nga sot e tutje.</small>
            </span>
            <UInput
              :model-value="booking.date.value"
              :min="booking.minDate.value"
              type="date"
              aria-label="Zgjidh daten e rezervimit"
              @update:model-value="booking.selectDate"
            />
          </label>
          <div class="date-strip">
            <button
              v-for="day in booking.nextDates.value"
              :key="day"
              type="button"
              :class="{ 'is-active': booking.date.value === day }"
              @click="booking.selectDate(day)"
            >
              <strong>{{ formatDate(day) }}</strong>
              <span>{{ day }}</span>
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>Zgjidh Oren</legend>
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
            v-if="booking.maximumDurationNotice.value"
            color="warning"
            variant="subtle"
            icon="i-lucide-clock-alert"
            title="Kufiri i rezervimit"
            description="Një rezervim mund të zgjasë maksimumi 5 orë. Për kohë shtesë, krijo një rezervim tjetër."
            class="mt-3"
          />
        </fieldset>

        <fieldset v-if="booking.extraServices.value.length">
          <legend>4. Sherbime shtese</legend>
          <div class="option-grid option-grid--two">
            <button
              v-for="service in booking.extraServices.value"
              :key="service.id"
              type="button"
              :class="{ 'is-active': booking.extraServiceIds.value.includes(service.id) }"
              :aria-pressed="booking.extraServiceIds.value.includes(service.id)"
              @click="booking.toggleExtraService(service.id)"
            >
              <div class="booking-service-copy">
                <strong>{{ service.name }}</strong>
                <span>{{ service.description || 'Sherbim shtese' }}</span>
              </div>
              <small class="booking-service-price">{{ formatPrice(service.price) }} / ore</small>
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>{{ booking.extraServices.value.length ? '5.' : '4.' }} Te dhenat</legend>
          <div class="customer-grid">
            <UFormField
              label="Emri"
              name="firstName"
              required
            >
              <UInput
                v-model="booking.customer.firstName"
                color="neutral"
                size="md"
                :ui="customerInputUi"
                autocomplete="given-name"
              />
            </UFormField>
            <UFormField
              label="Mbiemri"
              name="lastName"
              required
            >
              <UInput
                v-model="booking.customer.lastName"
                color="neutral"
                size="md"
                :ui="customerInputUi"
                autocomplete="family-name"
              />
            </UFormField>
            <UFormField
              label="Telefoni"
              name="phone"
              required
            >
              <UInput
                v-model="booking.customer.phone"
                color="neutral"
                size="md"
                :ui="customerInputUi"
                autocomplete="tel"
              />
            </UFormField>
            <UFormField
              label="Email"
              name="email"
            >
              <UInput
                v-model="booking.customer.email"
                color="neutral"
                size="md"
                :ui="customerInputUi"
                type="email"
                autocomplete="email"
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

        <UButton
          type="submit"
          size="lg"
          color="primary"
          block
          icon="i-lucide-check-circle"
          :loading="booking.submitting.value"
          :disabled="!booking.canSubmit.value"
          label="Konfirmo rezervimin"
          class="booking-submit"
        />
      </UForm>

      <aside class="booking-summary">
        <p>Permbledhja</p>
        <h2>{{ booking.selectedCourt.value?.name || 'Zgjidh fushen' }}</h2>
        <dl>
          <div>
            <dt>Data</dt>
            <dd>{{ booking.date.value }}</dd>
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
            <strong>{{ booking.canSubmit.value ? 'Gati per konfirmim' : 'Vazhdo zgjedhjen' }}</strong>
            <span>Pas konfirmimit ruhet referenca e rezervimit.</span>
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

.booking-shell__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 390px);
  gap: 18px;
  align-items: start;
  margin-top: 34px;
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

.option-grid button {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.booking-service-copy {
  min-width: 0;
}

.booking-service-copy strong,
.booking-service-copy span {
  display: block;
}

.option-grid button.is-active {
  border-color: #173C32;
  background: #EEFFB8;
}

.date-strip button.is-active,
.slot-grid button.is-active {
  border-color: #173C32;
  background: #EEFFB8;
}

.option-grid strong,
.option-grid span,
.date-strip strong,
.date-strip span {
  display: block;
}

.option-grid span,
.date-strip span {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.86rem;
}

.option-grid .booking-service-price {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  margin-top: 0;
  color: var(--forest);
  font-size: 0.78rem;
  font-weight: 850;
}

.date-strip {
  display: grid;
  grid-auto-columns: minmax(136px, 1fr);
  grid-auto-flow: column;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.booking-date-input {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) minmax(160px, 220px);
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  border: 1px solid rgba(18, 61, 51, 0.22);
  border-radius: 6px;
  padding: 12px;
  background: #F7F9F5;
}

.booking-date-input :deep(svg) {
  width: 42px;
  height: 42px;
  border-radius: 5px;
  padding: 10px;
  background: rgba(216, 255, 62, 0.34);
  color: var(--forest);
}

.booking-date-input span,
.booking-date-input strong,
.booking-date-input small {
  min-width: 0;
  display: block;
}

.booking-date-input small {
  margin-top: 3px;
  color: var(--muted);
  font-size: 0.82rem;
  line-height: 1.35;
}

.booking-date-input :deep(input) {
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
  grid-template-columns: 34px 1fr;
  gap: 11px;
  align-items: start;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(26, 107, 85, 0.18);
  border-radius: 9px;
  padding: 16px;
  background: linear-gradient(135deg, #F8FBF5 0%, #F1F7EE 100%);
  color: var(--ink);
}

.booking-summary__ready::before {
  position: absolute;
  inset: 12px auto 12px 0;
  width: 3px;
  border-radius: 0 999px 999px 0;
  background: #2B7A63;
  content: '';
}

.booking-summary__ready :deep(svg) {
  width: 34px;
  height: 34px;
  border: 1px solid rgba(26, 107, 85, 0.16);
  border-radius: 8px;
  padding: 8px;
  background: #FFFFFF;
  color: #2B7A63;
  box-shadow: 0 3px 10px rgba(18, 61, 51, 0.07);
}

.booking-summary__ready span {
  display: block;
  margin-top: 3px;
  color: #63736B;
  font-size: 0.8rem;
  line-height: 1.45;
}

.booking-summary__ready strong {
  display: block;
  color: #173C32;
  font-size: 0.93rem;
  font-weight: 830;
  line-height: 1.2;
}

.booking-submit {
  min-height: 48px;
  border-radius: 5px;
  border: 1px solid transparent;
  background: var(--lime);
  color: var(--ink);
  font-weight: 900;
}

.booking-submit:not(:disabled) {
  cursor: pointer;
}

.booking-submit:focus-visible {
  border-color: var(--ink);
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}

.booking-submit:disabled {
  cursor: not-allowed;
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
  .option-grid--two,
  .customer-grid,
  .booking-date-input {
    grid-template-columns: 1fr;
  }
}
</style>
