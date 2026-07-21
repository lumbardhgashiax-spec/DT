<script setup lang="ts">
import type { BookingConfirmation } from '~/types/booking'

const props = defineProps<{
  confirmation: BookingConfirmation
}>()

const emit = defineEmits<{
  close: []
}>()

const runtimeConfig = useRuntimeConfig()

const calendarUrl = computed(() => {
  const start = `${props.confirmation.date.replaceAll('-', '')}T${props.confirmation.time.replace(':', '')}00`
  const end = `${props.confirmation.date.replaceAll('-', '')}T${props.confirmation.endTime.replace(':', '')}00`
  const details = encodeURIComponent(`Rezervimi ${props.confirmation.bookingReference} te Diamond Tennis`)

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&ctz=Europe%2FBelgrade&text=Diamond%20Tennis%20-%20${encodeURIComponent(props.confirmation.courtName)}&dates=${start}/${end}&details=${details}`
})

const locationUrl = computed(() => runtimeConfig.public.diamondTennisLocationUrl || '')

const formattedReference = computed(() => props.confirmation.bookingReference)

const formattedTotal = computed(() => new Intl.NumberFormat('sq-AL', {
  style: 'currency',
  currency: props.confirmation.currency,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
}).format(props.confirmation.totalPrice))
</script>

<template>
  <section
    class="diamond-booking-summary"
    aria-label="Konfirmimi i rezervimit"
  >
    <div
      class="diamond-booking-summary__check"
      aria-hidden="true"
    >
      <UIcon name="i-lucide-check" />
    </div>
    <div>
      <h3>Rezervimi u konfirmua</h3>
      <p class="diamond-booking-summary__ref">
        {{ formattedReference }}
      </p>
    </div>

    <dl>
      <div>
        <dt>Fusha</dt>
        <dd>{{ confirmation.courtName }}</dd>
      </div>
      <div>
        <dt>Data</dt>
        <dd>{{ confirmation.date }}</dd>
      </div>
      <div>
        <dt>Ora</dt>
        <dd>{{ confirmation.time }} - {{ confirmation.endTime }}</dd>
      </div>
      <div>
        <dt>Totali</dt>
        <dd>{{ formattedTotal }}</dd>
      </div>
    </dl>

    <div class="diamond-booking-summary__actions">
      <UButton
        :to="calendarUrl"
        target="_blank"
        icon="i-lucide-calendar-plus"
        color="primary"
        variant="solid"
        label="Shto ne kalendar"
      />
      <UButton
        :to="locationUrl || undefined"
        target="_blank"
        icon="i-lucide-map-pin"
        color="neutral"
        variant="outline"
        label="Hape lokacionin"
        :disabled="!locationUrl"
      />
      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        label="Mbylle"
        @click="emit('close')"
      />
    </div>
  </section>
</template>

<style scoped>
.diamond-booking-summary {
  display: grid;
  gap: 14px;
  margin: 0 16px 14px;
  padding: 16px;
  border: 1px solid rgba(29, 185, 84, 0.28);
  border-radius: 16px;
  background: #F0FDF4;
  color: #061735;
}

.diamond-booking-summary__check {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #1DB954;
  color: #FFFFFF;
  animation: diamond-check-pop 360ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.diamond-booking-summary h3 {
  margin: 0;
  font-size: 1rem;
}

.diamond-booking-summary__ref {
  margin: 2px 0 0;
  color: rgba(6, 23, 53, 0.68);
  font-size: 0.85rem;
  font-weight: 700;
}

.diamond-booking-summary dl {
  display: grid;
  gap: 8px;
  margin: 0;
}

.diamond-booking-summary dl div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.diamond-booking-summary dt {
  color: rgba(6, 23, 53, 0.62);
}

.diamond-booking-summary dd {
  margin: 0;
  font-weight: 750;
  text-align: right;
}

.diamond-booking-summary__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@keyframes diamond-check-pop {
  0% {
    opacity: 0;
    transform: scale(0.72);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .diamond-booking-summary__check {
    animation: none;
  }
}
</style>
