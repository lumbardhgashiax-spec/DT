<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAssistantBooking } from '~/composables/useAssistantBooking'
import { useDiamondAssistant } from '~/composables/useDiamondAssistant'
import DiamondAssistantBookingSummary from './DiamondAssistantBookingSummary.vue'

const assistant = useDiamondAssistant()
const booking = useAssistantBooking()

const showFlow = computed(() => Boolean(
  booking.draft.value.courtId
  || booking.draft.value.date
  || booking.draft.value.confirmation
))

onMounted(() => {
  void booking.restoreDraft()
})
</script>

<template>
  <section
    v-if="showFlow"
    class="diamond-booking-flow"
    aria-label="Flow i rezervimit"
  >
    <DiamondAssistantBookingSummary
      v-if="booking.draft.value.confirmation"
      :confirmation="booking.draft.value.confirmation"
      @close="assistant.close"
    />

    <template v-else>
      <div class="diamond-booking-flow__head">
        <span>Rezervimi</span>
        <strong>Zgjidh fushen, daten dhe oren.</strong>
      </div>

      <div class="diamond-booking-flow__section">
        <div class="diamond-booking-flow__title">
          <UIcon
            name="i-lucide-map"
            aria-hidden="true"
          />
          <span>Fusha</span>
        </div>
        <div class="diamond-booking-flow__court-grid">
          <button
            v-for="court in booking.courts.value"
            :key="court.id"
            class="diamond-booking-flow__court"
            :class="{ 'is-selected': booking.draft.value.courtId === court.id }"
            type="button"
            @click="booking.setCourt(court.id)"
          >
            <UIcon
              :name="court.courtType === 'indoor' ? 'i-lucide-warehouse' : 'i-lucide-sun'"
              aria-hidden="true"
            />
            <span>{{ court.name }}</span>
          </button>
        </div>
      </div>

      <div class="diamond-booking-flow__section">
        <label>
          <span>Data</span>
          <input
            :value="booking.draft.value.date"
            :min="booking.minDate.value"
            type="date"
            @input="booking.setDate(($event.target as HTMLInputElement).value)"
          >
        </label>
      </div>

      <div
        v-if="booking.extraServices.value.length"
        class="diamond-booking-flow__section"
      >
        <div class="diamond-booking-flow__title">
          <UIcon
            name="i-lucide-plus-circle"
            aria-hidden="true"
          />
          <span>Sherbime shtese</span>
        </div>
        <div class="diamond-booking-flow__court-grid">
          <button
            v-for="service in booking.extraServices.value"
            :key="service.id"
            type="button"
            class="diamond-booking-flow__court"
            :class="{ 'is-selected': booking.draft.value.extraServiceIds?.includes(service.id) }"
            :aria-pressed="booking.draft.value.extraServiceIds?.includes(service.id)"
            @click="booking.toggleExtraService(service.id)"
          >
            <UIcon
              name="i-lucide-plus"
              aria-hidden="true"
            />
            <span>{{ service.name }}</span>
          </button>
        </div>
      </div>

      <div
        v-if="booking.draft.value.courtId && booking.draft.value.date"
        class="diamond-booking-flow__section"
      >
        <div class="diamond-booking-flow__title">
          <UIcon
            name="i-lucide-clock"
            aria-hidden="true"
          />
          <span>Oret e lira</span>
          <span
            v-if="booking.loadingAvailability.value"
            class="diamond-booking-flow__muted"
          >duke kontrolluar...</span>
        </div>
        <div class="diamond-booking-flow__slots">
          <button
            v-for="slot in booking.slots.value"
            :key="slot.time"
            type="button"
            :disabled="!slot.available"
            :class="{ 'is-selected': booking.draft.value.time === slot.time }"
            @click="booking.setTime(slot.time)"
          >
            {{ slot.time }}
          </button>
        </div>
      </div>

      <div class="diamond-booking-flow__section diamond-booking-flow__customer">
        <div class="diamond-booking-flow__title">
          <UIcon
            name="i-lucide-user"
            aria-hidden="true"
          />
          <span>Te dhenat</span>
        </div>
        <input
          :value="booking.draft.value.customer.firstName"
          type="text"
          autocomplete="given-name"
          placeholder="Emri"
          @input="booking.updateCustomer('firstName', ($event.target as HTMLInputElement).value)"
        >
        <input
          :value="booking.draft.value.customer.lastName"
          type="text"
          autocomplete="family-name"
          placeholder="Mbiemri"
          @input="booking.updateCustomer('lastName', ($event.target as HTMLInputElement).value)"
        >
        <input
          :value="booking.draft.value.customer.phone"
          type="tel"
          autocomplete="tel"
          placeholder="Telefoni"
          @input="booking.updateCustomer('phone', ($event.target as HTMLInputElement).value)"
        >
        <input
          :value="booking.draft.value.customer.email"
          type="email"
          autocomplete="email"
          placeholder="Email opsional"
          @input="booking.updateCustomer('email', ($event.target as HTMLInputElement).value)"
        >
      </div>

      <div
        v-if="booking.error.value"
        class="diamond-booking-flow__error"
        role="alert"
      >
        <UIcon
          name="i-lucide-triangle-alert"
          aria-hidden="true"
        />
        <span>{{ booking.error.value }}</span>
      </div>

      <div class="diamond-booking-flow__footer">
        <UButton
          icon="i-lucide-check"
          color="primary"
          variant="solid"
          label="Konfirmo rezervimin"
          :loading="booking.confirming.value"
          :disabled="!booking.canConfirm.value || booking.confirming.value"
          @click="booking.confirmBooking"
        />
        <UButton
          icon="i-lucide-rotate-ccw"
          color="neutral"
          variant="ghost"
          aria-label="Pastro flow-n"
          @click="booking.resetBooking"
        />
      </div>
    </template>
  </section>
</template>

<style scoped>
.diamond-booking-flow {
  display: grid;
  gap: 10px;
  padding: 12px 14px 16px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, #EEF4EF, #F8FAF3);
}

.diamond-booking-flow__head {
  display: grid;
  gap: 2px;
  color: #0E1D17;
}

.diamond-booking-flow__head span {
  color: rgba(14, 29, 23, 0.58);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}

.diamond-booking-flow__head strong {
  font-size: 0.95rem;
}

.diamond-booking-flow__section {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(14, 29, 23, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 14px 34px rgba(14, 29, 23, 0.06);
}

.diamond-booking-flow__title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0E1D17;
  font-size: 0.84rem;
  font-weight: 850;
}

.diamond-booking-flow__title svg,
.diamond-booking-flow__title :deep(svg) {
  color: #6BAA24;
}

.diamond-booking-flow__court-grid,
.diamond-booking-flow__slots {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.diamond-booking-flow__court,
.diamond-booking-flow__slots button {
  min-height: 42px;
  border: 1px solid rgba(14, 29, 23, 0.12);
  border-radius: 13px;
  background: #F3F6ED;
  color: #0E1D17;
  font-weight: 800;
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
}

.diamond-booking-flow__court {
  display: grid;
  grid-template-columns: 22px 1fr;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  text-align: left;
}

.diamond-booking-flow__court:hover,
.diamond-booking-flow__slots button:hover {
  transform: translateY(-1px);
  border-color: rgba(107, 170, 36, 0.42);
}

.diamond-booking-flow__court.is-selected,
.diamond-booking-flow__slots button.is-selected {
  border-color: #B9F23B;
  background: #10241C;
  color: #FFFFFF;
}

.diamond-booking-flow__slots button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
  text-decoration: line-through;
  transform: none;
}

.diamond-booking-flow__grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.diamond-booking-flow label,
.diamond-booking-flow__customer {
  display: grid;
  gap: 7px;
}

.diamond-booking-flow label span {
  color: rgba(14, 29, 23, 0.64);
  font-size: 0.78rem;
  font-weight: 800;
}

.diamond-booking-flow input,
.diamond-booking-flow select {
  width: 100%;
  min-height: 42px;
  border: 1px solid rgba(14, 29, 23, 0.12);
  border-radius: 13px;
  padding: 0 11px;
  background: #F3F6ED;
  color: #0E1D17;
  outline: 0;
}

.diamond-booking-flow input:focus-visible,
.diamond-booking-flow select:focus-visible,
.diamond-booking-flow button:focus-visible {
  outline: 3px solid rgba(185, 242, 59, 0.56);
  outline-offset: 2px;
}

.diamond-booking-flow__customer {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.diamond-booking-flow__customer .diamond-booking-flow__title {
  grid-column: 1 / -1;
}

.diamond-booking-flow__error {
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 13px;
  background: #FFF7ED;
  color: #7C2D12;
  font-size: 0.84rem;
}

.diamond-booking-flow__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.diamond-booking-flow__muted {
  margin-left: auto;
  color: rgba(14, 29, 23, 0.5);
  font-size: 0.76rem;
  font-weight: 700;
}

@media (max-width: 420px) {
  .diamond-booking-flow {
    padding: 10px 12px 14px;
  }

  .diamond-booking-flow__grid,
  .diamond-booking-flow__customer {
    grid-template-columns: 1fr;
  }
}
</style>
