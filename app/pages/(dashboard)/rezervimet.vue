<script setup lang="ts">
import type { ReservationView } from '~/types/dashboard'
import { formatCurrency, formatDateTime } from '~/utils/dashboard'

definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Rezervimet | Diamond Tennis Academy', robots: 'noindex, nofollow' })

const dashboardApi = useDashboardApi()
const route = useRoute()
const toast = useToast()
const { canManagePricing, loadProfile } = useDashboardProfile()
await loadProfile()

const formOpen = ref(false)
const selectedReservation = ref<ReservationView | null>(null)
const search = ref('')
const statusFilter = ref('all')
const dateFilter = ref('')

const { data: reservations, status, refresh, error } = await useAsyncData('dashboard-reservations', async () => {
  return dashboardApi.listReservations()
})

const filteredReservations = computed(() => (reservations.value || []).filter((reservation) => {
  const customer = `${reservation.customers?.first_name || ''} ${reservation.customers?.last_name || ''} ${reservation.customers?.phone || ''}`.toLowerCase()
  const matchesSearch = !search.value || customer.includes(search.value.toLowerCase())
  const matchesStatus = statusFilter.value === 'all' || reservation.status === statusFilter.value
  const matchesDate = !dateFilter.value || reservation.start_at.slice(0, 10) === dateFilter.value
  return matchesSearch && matchesStatus && matchesDate
}))

const statusMeta: Record<string, { label: string, color: 'warning' | 'success' | 'neutral' | 'error' }> = {
  pending: { label: 'Në pritje', color: 'warning' },
  confirmed: { label: 'Konfirmuar', color: 'success' },
  completed: { label: 'Përfunduar', color: 'neutral' },
  cancelled: { label: 'Anuluar', color: 'error' }
}

function openCreate() {
  selectedReservation.value = null
  formOpen.value = true
}

function openEdit(reservation: ReservationView) {
  selectedReservation.value = reservation
  formOpen.value = true
}

async function cancelReservation(reservation: ReservationView) {
  if (!import.meta.client || !window.confirm('A je i sigurt që dëshiron ta anulosh këtë rezervim?')) return

  try {
    await dashboardApi.cancelReservation(reservation.id)
    toast.add({ title: 'Rezervimi u anulua', color: 'success' })
    await refresh()
  } catch (cause) {
    toast.add({ title: 'Rezervimi nuk u anulua', description: cause instanceof Error ? cause.message : undefined, color: 'error' })
  }
}

async function deleteReservation(reservation: ReservationView) {
  if (!canManagePricing.value || !import.meta.client) return
  if (!window.confirm('A je i sigurt qe deshiron ta fshish pergjithmone kete rezervim? Ky veprim nuk mund te kthehet.')) return

  try {
    await dashboardApi.deleteReservation(reservation.id)
    toast.add({ title: 'Rezervimi u fshi', color: 'success' })
    await refresh()
  } catch (cause) {
    toast.add({ title: 'Rezervimi nuk u fshi', description: cause instanceof Error ? cause.message : 'Provo perseri.', color: 'error' })
  }
}

onMounted(() => {
  if (route.query.new === '1') openCreate()
})
</script>

<template>
  <div>
    <header class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="dashboard-kicker">
          Menaxhimi
        </p>
        <h1 class="dashboard-page-title">
          Rezervimet
        </h1>
        <p class="dashboard-page-description">
          Krijo, filtro dhe menaxho terminet e akademisë.
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        size="lg"
        @click="openCreate"
      >
        Rezervim i ri
      </UButton>
    </header>

    <section class="mb-5 grid gap-3 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto] dark:border-slate-800 dark:bg-slate-900">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Kërko klientin ose telefonin..."
        class="w-full"
      />
      <select
        v-model="statusFilter"
        class="dashboard-select sm:w-44"
      >
        <option value="all">
          Të gjitha statuset
        </option><option value="pending">
          Në pritje
        </option><option value="confirmed">
          Konfirmuar
        </option><option value="completed">
          Përfunduar
        </option><option value="cancelled">
          Anuluar
        </option>
      </select>
      <UInput
        v-model="dateFilter"
        type="date"
        class="w-full sm:w-40"
      />
    </section>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-database-zap"
      title="Të dhënat nuk u ngarkuan"
      :description="error.message"
      class="mb-5"
    />

    <section class="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div
        v-if="status === 'pending'"
        class="space-y-3 p-6"
      >
        <USkeleton
          v-for="item in 5"
          :key="item"
          class="h-16 w-full rounded-2xl"
        />
      </div>

      <div
        v-else-if="filteredReservations.length"
        class="divide-y divide-slate-100 dark:divide-slate-800"
      >
        <article
          v-for="reservation in filteredReservations"
          :key="reservation.id"
          class="grid gap-4 p-5 transition hover:bg-slate-50/80 sm:grid-cols-[minmax(180px,1.2fr)_minmax(170px,1fr)_auto_auto] sm:items-center dark:hover:bg-slate-950/30"
        >
          <div class="min-w-0">
            <p class="dashboard-card-title truncate">
              {{ reservation.customers?.first_name }} {{ reservation.customers?.last_name }}
            </p>
            <p class="dashboard-meta mt-1 flex items-center gap-1.5">
              <UIcon
                name="i-lucide-phone"
                class="size-3.5"
              />{{ reservation.customers?.phone }}
            </p>
          </div>
          <div>
            <p class="dashboard-card-title">
              {{ reservation.courts?.name }}
            </p>
            <p class="dashboard-meta mt-1">
              {{ formatDateTime(reservation.start_at) }} · {{ Math.round((new Date(reservation.end_at).getTime() - new Date(reservation.start_at).getTime()) / 60000) }} min
            </p>
          </div>
          <div class="flex items-center gap-3 sm:block sm:text-right">
            <UBadge
              :color="statusMeta[reservation.status]?.color || 'neutral'"
              variant="subtle"
            >
              {{ statusMeta[reservation.status]?.label }}
            </UBadge>
            <p class="dashboard-card-title mt-0 sm:mt-2">
              {{ formatCurrency(reservation.price) }}
            </p>
          </div>
          <div class="flex justify-end gap-1">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              aria-label="Ndrysho"
              @click="openEdit(reservation)"
            />
            <UButton
              v-if="reservation.status !== 'cancelled'"
              color="error"
              variant="ghost"
              icon="i-lucide-calendar-x"
              aria-label="Anulo"
              @click="cancelReservation(reservation)"
            />
            <UButton
              v-if="canManagePricing"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              aria-label="Fshi përgjithmonë"
              @click="deleteReservation(reservation)"
            />
          </div>
        </article>
      </div>

      <div
        v-else
        class="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center"
      >
        <div class="mb-5 grid size-16 place-items-center rounded-3xl bg-[#062660]/5 text-[#062660] dark:bg-white/5 dark:text-[#d6ad63]">
          <UIcon
            name="i-lucide-calendar-search"
            class="size-8"
          />
        </div>
        <h2 class="dashboard-section-title">
          Nuk u gjet asnjë rezervim
        </h2>
        <p class="dashboard-section-description mt-2">
          Ndrysho filtrat ose krijo rezervimin e parë.
        </p>
        <UButton
          class="mt-5"
          icon="i-lucide-plus"
          @click="openCreate"
        >
          Rezervim i ri
        </UButton>
      </div>
    </section>

    <DashboardReservationForm
      v-model:open="formOpen"
      :reservation="selectedReservation"
      :initial-date="typeof route.query.date === 'string' ? route.query.date : null"
      @saved="refresh"
    />
  </div>
</template>
