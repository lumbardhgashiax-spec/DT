<script setup lang="ts">
import type { BookingConfirmation } from '~/types/booking'

const route = useRoute()
const reference = computed(() => typeof route.query.reference === 'string' ? route.query.reference : '')
const displayReference = computed(() => booking.value?.bookingReference || '')
const calendarDownloadUrl = computed(() => reference.value
  ? `/api/public/booking/calendar?reference=${encodeURIComponent(reference.value)}`
  : '')

function formatPrice(value: number, currency: BookingConfirmation['currency']) {
  return new Intl.NumberFormat('sq-AL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

const { data: booking, pending, error } = await useFetch<BookingConfirmation>('/api/public/booking/confirmation', {
  query: { reference },
  immediate: Boolean(reference.value)
})

useSeoMeta({
  title: 'Rezervimi u konfirmua',
  description: 'Konfirmimi i rezervimit ne Diamond Tennis Academy.'
})
</script>

<template>
  <main class="success-page">
    <section class="success-panel">
      <UIcon name="i-lucide-check-circle-2" />
      <p>Rezervimi</p>
      <h1>Konfirmimi u krye.</h1>

      <div
        v-if="pending"
        class="success-panel__state"
      >
        Duke lexuar konfirmimin...
      </div>

      <div
        v-else-if="booking"
        class="success-panel__details"
      >
        <dl>
          <div>
            <dt>Referenca</dt>
            <dd>{{ displayReference }}</dd>
          </div>
          <div>
            <dt>Fusha</dt>
            <dd>{{ booking.courtName }}</dd>
          </div>
          <div>
            <dt>Data dhe ora</dt>
            <dd>{{ booking.date }} / {{ booking.time }} - {{ booking.endTime }}</dd>
          </div>
          <div>
            <dt>Kohezgjatja</dt>
            <dd>{{ booking.durationMinutes }} min</dd>
          </div>
          <div>
            <dt>Totali</dt>
            <dd>{{ formatPrice(booking.totalPrice, booking.currency) }}</dd>
          </div>
        </dl>
      </div>

      <UAlert
        v-else
        color="warning"
        variant="soft"
        icon="i-lucide-alert-triangle"
        :description="error ? 'Nuk u gjet konfirmimi per kete reference.' : 'Referenca mungon.'"
      />

      <div class="success-panel__actions">
        <UButton
          v-if="booking"
          :to="calendarDownloadUrl"
          external
          color="primary"
          size="lg"
          icon="i-lucide-calendar-plus"
          label="Shto ne kalendar"
          class="success-panel__button"
        />
        <UButton
          to="/rezervo"
          color="primary"
          size="lg"
          icon="i-lucide-calendar-plus"
          label="Rezervo tjeter termin"
          class="success-panel__button"
        />
        <UButton
          to="/"
          color="neutral"
          variant="outline"
          size="lg"
          icon="i-lucide-home"
          label="Kthehu ne kryefaqe"
          class="success-panel__button"
        />
      </div>
    </section>
  </main>
</template>

<style scoped>
.success-page {
  min-height: 78dvh;
  display: grid;
  place-items: center;
  padding: clamp(42px, 7vw, 90px) max(18px, 7vw);
  background: #F7F6F1;
  color: #061735;
}

.success-panel {
  width: min(100%, 760px);
  border: 1px solid rgba(6, 23, 53, 0.12);
  border-radius: 8px;
  padding: clamp(24px, 5vw, 42px);
  background: #FFFFFF;
  box-shadow: 0 24px 72px rgba(6, 23, 53, 0.1);
}

.success-panel > :deep(svg) {
  width: 42px;
  height: 42px;
  color: #C6A15B;
}

.success-panel p {
  margin: 18px 0 12px;
  color: #C6A15B;
  font-size: 0.78rem;
  font-weight: 850;
  text-transform: uppercase;
}

.success-panel h1 {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 3.2rem);
  line-height: 1.06;
}

.success-panel__details,
.success-panel__state {
  margin-top: 24px;
}

.success-panel dl {
  display: grid;
  gap: 1px;
  background: rgba(6, 23, 53, 0.12);
}

.success-panel dl div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  background: #FFFFFF;
}

.success-panel dt {
  color: rgba(6, 23, 53, 0.58);
}

.success-panel dd {
  margin: 0;
  font-weight: 850;
  text-align: right;
}

.success-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 26px;
}

.success-panel__button {
  min-height: 48px;
  border-radius: 999px;
  padding-inline: 18px;
  font-weight: 900;
}
</style>
