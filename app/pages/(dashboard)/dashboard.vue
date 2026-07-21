<script setup lang="ts">
import { ACADEMY_TIME_ZONE, formatCurrency, formatDateTime } from '~/utils/dashboard'

definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Dashboard | Diamond Tennis Academy', robots: 'noindex, nofollow' })

const dashboardApi = useDashboardApi()
const { profile } = useDashboardProfile()

function dateKey(value: Date | string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ACADEMY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(value))
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value || ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function percentageChange(current: number, previous: number) {
  if (previous <= 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

const { data: overview, status, error, refresh } = await useAsyncData('dashboard-overview', async () => {
  return dashboardApi.getDashboardOverview()
})

const revenueTrend = computed(() => percentageChange(overview.value?.revenue || 0, overview.value?.previousRevenue || 0))
const cards = computed(() => [
  { label: 'Rezervime sot', value: overview.value?.today || 0, helper: 'termine aktive', icon: 'i-lucide-users-round', trend: null },
  { label: 'Këtë muaj', value: overview.value?.month || 0, helper: 'rezervime gjithsej', icon: 'i-lucide-clock-3', trend: null },
  { label: 'Të ardhura', value: formatCurrency(overview.value?.revenue || 0), helper: 'nga rezervimet', icon: 'i-lucide-circle-dollar-sign', trend: revenueTrend.value },
  { label: 'Fusha aktive', value: overview.value?.courts || 0, helper: 'në dispozicion', icon: 'i-lucide-map-pin', trend: null }
])

const monthLabel = computed(() => new Intl.DateTimeFormat('sq-AL', {
  month: 'long',
  year: 'numeric',
  timeZone: ACADEMY_TIME_ZONE
}).format(new Date()))

const chartSeries = computed(() => {
  const now = new Date()
  const totals = new Map<string, number>()
  for (const row of overview.value?.monthRows || []) {
    const key = dateKey(row.start_at)
    totals.set(key, (totals.get(key) || 0) + Number(row.price))
  }

  return Array.from({ length: now.getDate() }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), index + 1)
    return {
      label: new Intl.DateTimeFormat('sq-AL', { day: '2-digit', month: 'short' }).format(date),
      value: totals.get(dateKey(date)) || 0
    }
  })
})

const chartWidth = 1000
const chartHeight = 280
const chartPaddingX = 28
const chartPaddingTop = 24
const chartPaddingBottom = 38
const chartPlotHeight = chartHeight - chartPaddingTop - chartPaddingBottom
const chartMax = computed(() => Math.max(...chartSeries.value.map(item => item.value), 1))
const chartPoints = computed(() => chartSeries.value.map((item, index) => {
  const availableWidth = chartWidth - chartPaddingX * 2
  const x = chartPaddingX + (chartSeries.value.length === 1 ? availableWidth / 2 : index * availableWidth / (chartSeries.value.length - 1))
  const y = chartPaddingTop + chartPlotHeight - (item.value / chartMax.value) * chartPlotHeight
  return { ...item, x, y }
}))
const chartLine = computed(() => chartPoints.value.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' '))
const chartArea = computed(() => {
  if (!chartPoints.value.length) return ''
  const first = chartPoints.value[0]!
  const last = chartPoints.value.at(-1)!
  return `${chartLine.value} L ${last.x} ${chartPaddingTop + chartPlotHeight} L ${first.x} ${chartPaddingTop + chartPlotHeight} Z`
})
const chartLabels = computed(() => {
  const step = Math.max(1, Math.ceil(chartPoints.value.length / 6))
  return chartPoints.value.filter((_, index) => index % step === 0 || index === chartPoints.value.length - 1)
})
</script>

<template>
  <div class="space-y-6">
    <section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="dashboard-kicker">
          Paneli administrativ
        </p>
        <h1 class="dashboard-page-title">
          Mirë se erdhe<span v-if="profile?.full_name">, {{ profile.full_name.split(' ')[0] }}</span>
        </h1>
        <p class="dashboard-page-description">
          Gjendja e akademisë, e përmbledhur me të dhëna reale.
        </p>
      </div>
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-refresh-cw"
        :loading="status === 'pending'"
        @click="() => refresh()"
      >
        Rifresko
      </UButton>
    </section>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Statistikat nuk u ngarkuan"
      :description="error.message"
    />

    <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-default bg-white px-4 py-3 shadow-xs dark:bg-slate-900">
      <UIcon
        name="i-lucide-calendar-days"
        class="size-5 text-muted"
      />
      <span class="text-sm font-semibold capitalize text-highlighted">{{ monthLabel }}</span>
      <span class="text-sm text-muted">· Muaji aktual</span>
      <UBadge
        class="ml-auto"
        color="neutral"
        variant="subtle"
      >
        Përditësim live
      </UBadge>
    </div>

    <section class="grid overflow-hidden rounded-2xl border border-default bg-white shadow-xs sm:grid-cols-2 xl:grid-cols-4 dark:bg-slate-900">
      <article
        v-for="(card, index) in cards"
        :key="card.label"
        class="p-5 sm:p-6"
        :class="[
          index > 0 ? 'border-t border-default' : '',
          index === 1 ? 'sm:border-l sm:border-t-0' : '',
          index === 2 ? 'sm:border-l-0' : '',
          index === 3 ? 'sm:border-l' : '',
          index > 0 ? 'xl:border-l xl:border-t-0' : ''
        ]"
      >
        <div class="mb-6 grid size-10 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900">
          <UIcon
            :name="card.icon"
            class="size-5"
          />
        </div>
        <p class="dashboard-metric-label">
          {{ card.label }}
        </p>
        <div class="mt-1 flex flex-wrap items-end gap-2">
          <p class="dashboard-metric-value">
            {{ card.value }}
          </p>
          <UBadge
            v-if="card.trend !== null"
            :color="card.trend >= 0 ? 'success' : 'error'"
            variant="subtle"
            class="mb-1"
          >
            {{ card.trend > 0 ? '+' : '' }}{{ card.trend }}%
          </UBadge>
        </div>
        <p class="dashboard-meta mt-2">
          {{ card.helper }}
        </p>
      </article>
    </section>

    <section class="overflow-hidden rounded-2xl border border-default bg-white shadow-xs dark:bg-slate-900">
      <div class="flex flex-col gap-2 border-b border-default px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p class="dashboard-metric-label">
            Të ardhurat këtë muaj
          </p>
          <h2 class="mt-1 text-3xl font-bold tracking-tight text-highlighted">
            {{ formatCurrency(overview?.revenue || 0) }}
          </h2>
        </div>
        <div class="flex items-center gap-2 text-xs text-muted">
          <span class="size-2 rounded-full bg-emerald-500" />
          Të ardhura ditore
        </div>
      </div>

      <div class="overflow-x-auto px-3 pb-3 pt-5 sm:px-5">
        <svg
          class="h-[280px] min-w-[680px] w-full"
          :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
          role="img"
          aria-label="Grafiku i të ardhurave ditore për muajin aktual"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="revenue-area"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stop-color="#10b981"
                stop-opacity="0.22"
              />
              <stop
                offset="100%"
                stop-color="#10b981"
                stop-opacity="0.02"
              />
            </linearGradient>
          </defs>
          <line
            v-for="step in 5"
            :key="step"
            :x1="chartPaddingX"
            :x2="chartWidth - chartPaddingX"
            :y1="chartPaddingTop + ((step - 1) * chartPlotHeight / 4)"
            :y2="chartPaddingTop + ((step - 1) * chartPlotHeight / 4)"
            stroke="currentColor"
            class="text-slate-200 dark:text-slate-800"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
          <path
            :d="chartArea"
            fill="url(#revenue-area)"
          />
          <path
            :d="chartLine"
            fill="none"
            stroke="#10b981"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          />
          <circle
            v-for="point in chartPoints.filter(point => point.value > 0)"
            :key="`${point.x}-${point.y}`"
            :cx="point.x"
            :cy="point.y"
            r="4"
            fill="#10b981"
            stroke="white"
            stroke-width="2"
            vector-effect="non-scaling-stroke"
          >
            <title>{{ point.label }}: {{ formatCurrency(point.value) }}</title>
          </circle>
          <text
            v-for="point in chartLabels"
            :key="point.label"
            :x="point.x"
            :y="chartHeight - 10"
            text-anchor="middle"
            fill="currentColor"
            class="text-[12px] text-slate-500"
          >{{ point.label }}</text>
        </svg>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-default bg-white shadow-xs dark:bg-slate-900">
      <div class="flex items-center justify-between border-b border-default px-5 py-4 sm:px-6">
        <div>
          <h2 class="dashboard-card-title">
            Terminet e ardhshme
          </h2>
          <p class="dashboard-meta mt-1">
            Pesë rezervimet më të afërta
          </p>
        </div>
        <UButton
          to="/kalendari"
          color="neutral"
          variant="ghost"
          trailing-icon="i-lucide-arrow-right"
        >
          Kalendari
        </UButton>
      </div>
      <div
        v-if="overview?.upcoming.length"
        class="divide-y divide-default"
      >
        <NuxtLink
          v-for="reservation in overview.upcoming"
          :key="reservation.id"
          to="/rezervimet"
          class="flex items-center gap-4 px-5 py-4 transition hover:bg-elevated/50 sm:px-6"
        >
          <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#062660]/8 text-[#062660] dark:bg-white/10 dark:text-[#d6ad63]"><UIcon
            name="i-lucide-clock-3"
            class="size-5"
          /></div>
          <div class="min-w-0 flex-1">
            <p class="dashboard-card-title truncate">{{ reservation.customers?.first_name }} {{ reservation.customers?.last_name }}</p>
            <p class="dashboard-meta mt-1 truncate">{{ formatDateTime(reservation.start_at) }} · {{ reservation.courts?.name }}</p>
          </div>
          <p class="hidden text-sm font-semibold text-highlighted sm:block">{{ formatCurrency(reservation.price) }}</p>
        </NuxtLink>
      </div>
      <div
        v-else
        class="p-10 text-center text-sm/6 text-muted"
      >
        Nuk ka termine të ardhshme.
      </div>
    </section>
  </div>
</template>
