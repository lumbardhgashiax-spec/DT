<script setup lang="ts">
import { parseDate } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'

const props = withDefaults(defineProps<{
  modelValue: string
  min?: string
  disabled?: boolean
  ariaLabel?: string
}>(), {
  min: '',
  disabled: false,
  ariaLabel: 'Zgjidh daten e rezervimit'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)

function toCalendarDate(value: string) {
  if (!value) return null

  try {
    return parseDate(value)
  } catch {
    return null
  }
}

const minimumDate = computed(() => toCalendarDate(props.min) ?? undefined)
const calendarDate = computed<DateValue | null>({
  get: () => toCalendarDate(props.modelValue),
  set(value) {
    if (!value) return
    emit('update:modelValue', value.toString())
    open.value = false
  }
})

const calendarUi = {
  root: 'w-full',
  body: 'w-full',
  grid: 'w-full'
}
</script>

<template>
  <UPopover
    v-model:open="open"
    :content="{
      align: 'start',
      side: 'bottom',
      sideOffset: 8,
      collisionPadding: 12
    }"
    :ui="{ content: 'z-[80] overflow-hidden p-0' }"
  >
    <slot
      name="trigger"
      :open="open"
      :value="modelValue"
    >
      <UButton
        type="button"
        color="neutral"
        variant="outline"
        icon="i-lucide-calendar-days"
        trailing-icon="i-lucide-chevron-down"
        :disabled="disabled"
        :aria-label="ariaLabel"
        :aria-expanded="open"
        class="w-full justify-between"
      >
        {{ modelValue || 'Zgjidh daten' }}
      </UButton>
    </slot>

    <template #content>
      <div class="booking-date-picker">
        <UCalendar
          v-model="calendarDate"
          :min-value="minimumDate"
          :default-placeholder="calendarDate || minimumDate"
          :week-starts-on="1"
          :ui="calendarUi"
          locale="sq-AL"
          color="neutral"
          variant="subtle"
          size="xl"
          prevent-deselect
          :aria-label="ariaLabel"
        />
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
.booking-date-picker {
  width: min(360px, calc(100vw - 24px));
  padding: 14px;
  border: 1px solid rgba(10, 23, 20, 0.12);
  background: #FFFFFF;
  color: #0A1714;
}

.booking-date-picker :deep([data-slot='cellTrigger']) {
  min-width: 40px;
  min-height: 40px;
  border-radius: 5px;
  color: #24332F;
}

.booking-date-picker :deep([data-slot='cellTrigger']:hover:not([data-disabled])) {
  background: #FFF0EB;
  color: #A93418;
}

.booking-date-picker :deep([data-selected]) {
  background: #E65332 !important;
  color: #FFFFFF !important;
  box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px rgba(230, 83, 50, 0.32);
}

.booking-date-picker :deep([data-today]:not([data-selected])) {
  background: #EEF1F0;
  color: #0A1714;
  box-shadow: inset 0 0 0 1px rgba(10, 23, 20, 0.28);
}

.booking-date-picker :deep([data-outside-view]),
.booking-date-picker :deep([data-disabled]) {
  color: #98A29F;
}

@media (max-width: 390px) {
  .booking-date-picker {
    padding: 10px;
  }

  .booking-date-picker :deep([data-slot='cellTrigger']) {
    min-width: 38px;
    min-height: 38px;
  }
}
</style>
