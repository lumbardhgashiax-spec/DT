<script setup lang="ts">
import { CalendarDate, today } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { TableRow } from '~/types/database.types'
import { ACADEMY_TIME_ZONE, formatCurrency } from '~/utils/dashboard'

interface ReportReservation extends TableRow<'reservations'> {
  customers: Pick<TableRow<'customers'>, 'first_name' | 'last_name'> | null
  courts: Pick<TableRow<'courts'>, 'name'> | null
}

interface DateRange {
  start: DateValue
  end: DateValue
}

definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Raportet | Diamond Tennis Academy', robots: 'noindex, nofollow' })

const dashboardApi = useDashboardApi()
const toast = useToast()
const currentDay = today(ACADEMY_TIME_ZONE)
const pendingRange = shallowRef<DateRange>({ start: currentDay, end: currentDay })
const appliedRange = shallowRef<DateRange>({ start: currentDay, end: currentDay })
const rangeOpen = ref(false)
const rangeVersion = ref(0)
const dailyPagination = ref({ pageIndex: 0, pageSize: 10 })

function startOfDayIso(date: DateValue) {
  return new Date(`${date.toString()}T00:00:00`).toISOString()
}

function endExclusiveIso(date: DateValue) {
  return new Date(`${date.add({ days: 1 }).toString()}T00:00:00`).toISOString()
}

function rangeDays(range: DateRange) {
  return Math.round((new Date(endExclusiveIso(range.end)).getTime() - new Date(startOfDayIso(range.start)).getTime()) / 86_400_000)
}

const { data: reservations, status, error, refresh } = await useAsyncData('reports-reservations', async () => {
  return dashboardApi.listReportReservations({ startAt: startOfDayIso(appliedRange.value.start), endAt: endExclusiveIso(appliedRange.value.end) }) as Promise<ReportReservation[]>
}, { watch: [rangeVersion] })

function applyRange() {
  if (pendingRange.value.start.compare(pendingRange.value.end) > 0) {
    toast.add({ title: 'Intervali nuk është valid', color: 'warning' })
    return
  }
  if (rangeDays(pendingRange.value) > 366) {
    toast.add({ title: 'Intervali është shumë i gjatë', description: 'Zgjidh maksimumi 366 ditë për një raport.', color: 'warning' })
    return
  }
  appliedRange.value = { ...pendingRange.value }
  dailyPagination.value.pageIndex = 0
  rangeOpen.value = false
  rangeVersion.value++
}

function setQuickRange(kind: 'today' | 'week' | 'month') {
  let start: DateValue = currentDay
  if (kind === 'week') start = currentDay.subtract({ days: 6 })
  if (kind === 'month') start = new CalendarDate(currentDay.year, currentDay.month, 1)
  pendingRange.value = { start, end: currentDay }
  applyRange()
}

const rangeLabel = computed(() => {
  const formatter = new Intl.DateTimeFormat('sq-AL', { day: '2-digit', month: 'short', year: 'numeric' })
  const start = formatter.format(new Date(`${appliedRange.value.start.toString()}T12:00:00`))
  const end = formatter.format(new Date(`${appliedRange.value.end.toString()}T12:00:00`))
  return start === end ? start : `${start} – ${end}`
})

const summary = computed(() => {
  const rows = reservations.value || []
  const billable = rows.filter(item => ['confirmed', 'completed'].includes(item.status))
  return {
    total: rows.length,
    revenue: billable.reduce((sum, item) => sum + Number(item.price), 0),
    completed: rows.filter(item => item.status === 'completed').length,
    cancelled: rows.filter(item => item.status === 'cancelled').length,
    customers: new Set(rows.map(item => item.customer_id)).size,
    hours: rows.filter(item => item.status !== 'cancelled').reduce((sum, item) => sum + (new Date(item.end_at).getTime() - new Date(item.start_at).getTime()) / 3_600_000, 0)
  }
})

function reservationDateKey(value: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ACADEMY_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date(value))
  const part = (type: string) => parts.find(item => item.type === type)?.value || ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

const dailyRows = computed(() => {
  const grouped = new Map<string, ReportReservation[]>()
  for (const item of reservations.value || []) {
    const key = reservationDateKey(item.start_at)
    grouped.set(key, [...(grouped.get(key) || []), item])
  }

  const rows = []
  let cursor = appliedRange.value.start
  while (cursor.compare(appliedRange.value.end) <= 0) {
    const key = cursor.toString()
    const items = grouped.get(key) || []
    rows.push({
      date: key,
      reservations: items.length,
      completed: items.filter(item => item.status === 'completed').length,
      cancelled: items.filter(item => item.status === 'cancelled').length,
      hours: items.filter(item => item.status !== 'cancelled').reduce((sum, item) => sum + (new Date(item.end_at).getTime() - new Date(item.start_at).getTime()) / 3_600_000, 0),
      revenue: items.filter(item => ['confirmed', 'completed'].includes(item.status)).reduce((sum, item) => sum + Number(item.price), 0)
    })
    cursor = cursor.add({ days: 1 })
  }
  return rows.reverse()
})

const dailyTableData = computed(() => dailyRows.value.map(item => ({
  'Data': new Intl.DateTimeFormat('sq-AL', { dateStyle: 'medium' }).format(new Date(`${item.date}T12:00:00`)),
  'Rezervime': item.reservations,
  'Përfunduara': item.completed,
  'Anuluara': item.cancelled,
  'Orë aktive': item.hours.toFixed(1),
  'Të ardhura': formatCurrency(item.revenue)
})))

const courtRows = computed(() => {
  const values = new Map<string, { count: number, revenue: number }>()
  for (const item of reservations.value || []) {
    const name = item.courts?.name || 'Fushë e panjohur'
    const current = values.get(name) || { count: 0, revenue: 0 }
    current.count++
    if (['confirmed', 'completed'].includes(item.status)) current.revenue += Number(item.price)
    values.set(name, current)
  }
  return [...values.entries()].map(([name, value]) => ({ name, ...value })).sort((a, b) => b.count - a.count)
})

function csvCell(value: string | number) {
  let text = String(value)
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

function exportCsv() {
  if (!import.meta.client) return
  const header = ['Data', 'Rezervime', 'Përfunduara', 'Anuluara', 'Orë aktive', 'Të ardhura EUR']
  const rows = dailyRows.value.map(item => [item.date, item.reservations, item.completed, item.cancelled, item.hours.toFixed(1), item.revenue.toFixed(2)])
  const csv = `\uFEFF${[header, ...rows].map(row => row.map(csvCell).join(',')).join('\n')}`
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `raporti-${appliedRange.value.start}-${appliedRange.value.end}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="dashboard-kicker">
          Analitika
        </p>
        <h1 class="dashboard-page-title">
          Raportet
        </h1>
        <p class="dashboard-page-description">
          Raport ditor ose interval i personalizuar për rezervimet dhe të ardhurat.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          color="neutral"
          variant="outline"
          @click="setQuickRange('today')"
        >
          Sot
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          @click="setQuickRange('week')"
        >
          7 ditë
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          @click="setQuickRange('month')"
        >
          Ky muaj
        </UButton>
        <UButton
          icon="i-lucide-download"
          :disabled="!dailyRows.length"
          @click="exportCsv"
        >
          Eksporto CSV
        </UButton>
      </div>
    </header>

    <section class="flex flex-col gap-3 rounded-2xl border border-default bg-white p-4 shadow-xs sm:flex-row sm:items-center dark:bg-slate-900">
      <UPopover v-model:open="rangeOpen">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-calendar-range"
          trailing-icon="i-lucide-chevron-down"
        >
          {{ rangeLabel }}
        </UButton>
        <template #content>
          <div class="p-3">
            <UCalendar
              v-model="pendingRange"
              range
              locale="sq-AL"
            />
            <div class="mt-3 flex justify-end gap-2 border-t border-default pt-3">
              <UButton
                color="neutral"
                variant="ghost"
                @click="rangeOpen = false"
              >
                Anulo
              </UButton>
              <UButton @click="applyRange">
                Apliko
              </UButton>
            </div>
          </div>
        </template>
      </UPopover>
      <p class="text-sm text-muted">
        {{ rangeDays(appliedRange) }} ditë në raport
      </p>
      <UButton
        class="sm:ml-auto"
        color="neutral"
        variant="ghost"
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
      title="Raporti nuk u ngarkua"
      :description="error.message"
    />

    <section class="grid overflow-hidden rounded-2xl border border-default bg-white shadow-xs sm:grid-cols-2 xl:grid-cols-5 dark:bg-slate-900">
      <article
        v-for="card in [
          { label: 'Rezervime', value: summary.total, icon: 'i-lucide-calendar-check' },
          { label: 'Të ardhura', value: formatCurrency(summary.revenue), icon: 'i-lucide-circle-dollar-sign' },
          { label: 'Përfunduara', value: summary.completed, icon: 'i-lucide-circle-check-big' },
          { label: 'Klientë unikë', value: summary.customers, icon: 'i-lucide-users-round' },
          { label: 'Orë aktive', value: summary.hours.toFixed(1), icon: 'i-lucide-clock-3' }
        ]"
        :key="card.label"
        class="border-b border-default p-5 last:border-b-0 sm:border-r xl:border-b-0"
      >
        <div class="mb-4 grid size-9 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
          <UIcon
            :name="card.icon"
            class="size-4"
          />
        </div>
        <p class="dashboard-metric-label">
          {{ card.label }}
        </p>
        <p class="mt-1 text-2xl font-bold tracking-tight text-highlighted">
          {{ card.value }}
        </p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
      <div class="overflow-hidden rounded-2xl border border-default bg-white shadow-xs dark:bg-slate-900">
        <div class="border-b border-default px-5 py-4">
          <h2 class="dashboard-card-title">
            Raporti sipas ditëve
          </h2>
          <p class="dashboard-meta mt-1">
            Përmbledhje për çdo ditë të intervalit.
          </p>
        </div>
        <UTable
          v-model:pagination="dailyPagination"
          :data="dailyTableData"
          :loading="status === 'pending'"
          :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
          class="max-h-[560px]"
          sticky
        />
        <DashboardTablePagination
          v-if="dailyTableData.length"
          v-model:page-index="dailyPagination.pageIndex"
          :page-size="dailyPagination.pageSize"
          :total="dailyTableData.length"
        />
      </div>

      <div class="overflow-hidden rounded-2xl border border-default bg-white shadow-xs dark:bg-slate-900">
        <div class="border-b border-default px-5 py-4">
          <h2 class="dashboard-card-title">
            Sipas fushave
          </h2>
          <p class="dashboard-meta mt-1">
            Ngarkesa dhe të ardhurat për fushë.
          </p>
        </div>
        <div
          v-if="courtRows.length"
          class="divide-y divide-default"
        >
          <div
            v-for="court in courtRows"
            :key="court.name"
            class="p-5"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="dashboard-card-title">
                {{ court.name }}
              </p>
              <p class="text-sm font-semibold text-highlighted">
                {{ formatCurrency(court.revenue) }}
              </p>
            </div>
            <div class="mt-3 flex items-center gap-3">
              <UProgress
                :model-value="court.count"
                :max="Math.max(summary.total, 1)"
                class="flex-1"
              />
              <span class="dashboard-meta">{{ court.count }} termine</span>
            </div>
          </div>
        </div>
        <UEmpty
          v-else
          icon="i-lucide-chart-no-axes-column"
          title="Pa të dhëna"
          description="Nuk ka rezervime në intervalin e zgjedhur."
          class="py-14"
        />
      </div>
    </section>
  </div>
</template>
