<script setup lang="ts">
import type { ReservationView } from '~/types/dashboard'
import { ACADEMY_TIME_ZONE, toLocalDateInput } from '~/utils/dashboard'

definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Kalendari | Diamond Tennis Academy', robots: 'noindex, nofollow' })

const dashboardApi = useDashboardApi()
const currentDate = ref(new Date())
const selectedCourt = ref('all')

const { data: courts } = await useAsyncData('calendar-courts', async () => {
  const data = await dashboardApi.listCourts()
  return data.filter(court => court.is_active)
})

const monthRange = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  return {
    start: new Date(year, month, 1).toISOString(),
    end: new Date(year, month + 1, 1).toISOString()
  }
})

const { data: reservations, status, refresh, error } = await useAsyncData('calendar-reservations', async () => {
  return dashboardApi.listReservations({ startAt: monthRange.value.start, endAt: monthRange.value.end, courtId: selectedCourt.value === 'all' ? undefined : selectedCourt.value, statuses: ['pending', 'confirmed', 'completed'], order: 'asc' })
}, { watch: [currentDate, selectedCourt] })

const monthLabel = computed(() => {
  const label = new Intl.DateTimeFormat('sq-AL', { month: 'long', year: 'numeric' }).format(currentDate.value)
  return label.charAt(0).toUpperCase() + label.slice(1)
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const mondayOffset = (firstDay.getDay() + 6) % 7
  return [
    ...Array.from({ length: mondayOffset }, (_, index) => ({ key: `empty-${index}`, day: null, date: null })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(year, month, index + 1)
      return { key: `day-${index + 1}`, day: index + 1, date: toLocalDateInput(date) }
    })
  ]
})

const reservationsByDay = computed(() => {
  const grouped: Record<string, ReservationView[]> = {}
  for (const reservation of reservations.value || []) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: ACADEMY_TIME_ZONE,
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date(reservation.start_at))
    const value = (type: string) => parts.find(part => part.type === type)?.value
    const key = `${value('year')}-${value('month')}-${value('day')}`
    grouped[key] ||= []
    grouped[key].push(reservation)
  }
  return grouped
})

function reservationsForDay(date: string | null) {
  return date ? reservationsByDay.value[date] || [] : []
}

function changeMonth(offset: number) {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + offset, 1)
}

function goToToday() {
  currentDate.value = new Date()
}

function isToday(day: number | null) {
  if (!day) return false
  const today = new Date()
  return day === today.getDate() && currentDate.value.getMonth() === today.getMonth() && currentDate.value.getFullYear() === today.getFullYear()
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('sq-AL', { hour: '2-digit', minute: '2-digit', timeZone: ACADEMY_TIME_ZONE }).format(new Date(value))
}
</script>

<template>
  <div>
    <header class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="dashboard-kicker">
          Organizimi
        </p>
        <h1 class="dashboard-page-title">
          Kalendari
        </h1>
        <p class="dashboard-page-description">
          Shiko disponueshmërinë sipas ditës, orës dhe fushës.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <select
          v-model="selectedCourt"
          class="dashboard-select w-auto min-w-40"
        >
          <option value="all">
            Të gjitha fushat
          </option><option
            v-for="court in courts || []"
            :key="court.id"
            :value="court.id"
          >
            {{ court.name }}
          </option>
        </select>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-calendar-check"
          @click="goToToday"
        >
          Sot
        </UButton>
        <UButton
          icon="i-lucide-plus"
          :to="`/rezervimet?new=1&date=${toLocalDateInput(currentDate)}`"
        >
          Rezervim
        </UButton>
      </div>
    </header>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Kalendari nuk u ngarkua"
      :description="error.message"
      class="mb-5"
    />

    <section class="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6 dark:border-slate-800">
        <div class="flex items-center gap-3">
          <h2 class="dashboard-section-title text-base sm:text-lg">
            {{ monthLabel }}
          </h2>
          <UIcon
            v-if="status === 'pending'"
            name="i-lucide-loader-circle"
            class="size-4 animate-spin text-slate-400"
          />
        </div>
        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-chevron-left"
            aria-label="Muaji i kaluar"
            @click="changeMonth(-1)"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-chevron-right"
            aria-label="Muaji i ardhshëm"
            @click="changeMonth(1)"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-refresh-cw"
            aria-label="Rifresko"
            @click="() => refresh()"
          />
        </div>
      </div>

      <div class="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40">
        <div
          v-for="dayName in ['Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht', 'Die']"
          :key="dayName"
          class="px-1 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:text-xs"
        >
          {{ dayName }}
        </div>
      </div>

      <div class="grid grid-cols-7">
        <div
          v-for="item in calendarDays"
          :key="item.key"
          class="min-h-24 border-b border-r border-slate-100 p-1.5 sm:min-h-32 sm:p-2 dark:border-slate-800"
          :class="{ 'bg-slate-50/50 dark:bg-slate-950/20': !item.day }"
        >
          <template v-if="item.day">
            <div class="mb-1 flex items-center justify-between">
              <span
                class="grid size-7 place-items-center rounded-full text-xs font-semibold sm:size-8 sm:text-sm"
                :class="isToday(item.day) ? 'bg-[#062660] text-white shadow-md' : 'text-slate-600 dark:text-slate-300'"
              >{{ item.day }}</span>
              <NuxtLink
                :to="`/rezervimet?new=1&date=${item.date}`"
                class="hidden text-slate-300 hover:text-[#c99a4a] sm:block"
                aria-label="Shto rezervim"
              ><UIcon
                name="i-lucide-plus"
                class="size-4"
              /></NuxtLink>
            </div>
            <div class="space-y-1">
              <NuxtLink
                v-for="reservation in reservationsForDay(item.date).slice(0, 3)"
                :key="reservation.id"
                :to="`/rezervimet?date=${item.date}`"
                class="block truncate rounded-md bg-[#062660]/8 px-1.5 py-1 text-[9px] font-semibold text-[#062660] hover:bg-[#062660]/15 sm:text-[11px] dark:bg-white/10 dark:text-slate-200"
              >
                {{ formatTime(reservation.start_at) }} {{ reservation.customers?.first_name }} · {{ reservation.courts?.name }}
              </NuxtLink>
              <p
                v-if="reservationsForDay(item.date).length > 3"
                class="px-1 text-[9px] text-slate-400"
              >
                +{{ reservationsForDay(item.date).length - 3 }} të tjera
              </p>
            </div>
          </template>
        </div>
      </div>
    </section>
  </div>
</template>
