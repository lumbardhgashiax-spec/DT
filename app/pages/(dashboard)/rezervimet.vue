<script setup lang="ts">
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
import { h, resolveComponent } from 'vue'
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
const confirmOpen = ref(false)
const confirmLoading = ref(false)
const pendingAction = ref<{ type: 'cancel' | 'delete', reservation: ReservationView } | null>(null)
const search = ref('')
const statusFilter = ref('all')
const dateFilter = ref('')
const pagination = ref({ pageIndex: 0, pageSize: 10 })

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

watch([search, statusFilter, dateFilter], () => {
  pagination.value.pageIndex = 0
})

const statusMeta: Record<string, { label: string, color: 'warning' | 'success' | 'neutral' | 'error' }> = {
  pending: { label: 'Ne pritje', color: 'warning' },
  confirmed: { label: 'Konfirmuar', color: 'success' },
  completed: { label: 'Perfunduar', color: 'neutral' },
  cancelled: { label: 'Anuluar', color: 'error' }
}

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')

function openCreate() {
  selectedReservation.value = null
  formOpen.value = true
}

function openEdit(reservation: ReservationView) {
  selectedReservation.value = reservation
  formOpen.value = true
}

function askReservationAction(type: 'cancel' | 'delete', reservation: ReservationView) {
  if (type === 'delete' && !canManagePricing.value) return
  pendingAction.value = { type, reservation }
  confirmOpen.value = true
}

async function cancelReservation(reservation: ReservationView) {
  try {
    await dashboardApi.cancelReservation(reservation.id)
    toast.add({ title: 'Rezervimi u anulua', color: 'success' })
    await refresh()
  } catch (cause) {
    toast.add({ title: 'Rezervimi nuk u anulua', description: cause instanceof Error ? cause.message : undefined, color: 'error' })
  }
}

async function deleteReservation(reservation: ReservationView) {
  if (!canManagePricing.value) return
  try {
    await dashboardApi.deleteReservation(reservation.id)
    toast.add({ title: 'Rezervimi u fshi', color: 'success' })
    await refresh()
  } catch (cause) {
    toast.add({ title: 'Rezervimi nuk u fshi', description: cause instanceof Error ? cause.message : 'Provo perseri.', color: 'error' })
  }
}

async function confirmReservationAction() {
  if (!pendingAction.value || confirmLoading.value) return
  confirmLoading.value = true
  try {
    if (pendingAction.value.type === 'cancel') {
      await cancelReservation(pendingAction.value.reservation)
    } else {
      await deleteReservation(pendingAction.value.reservation)
    }
    confirmOpen.value = false
    pendingAction.value = null
  } finally {
    confirmLoading.value = false
  }
}

const columns: TableColumn<ReservationView>[] = [
  {
    id: 'customer',
    header: 'Klienti',
    cell: ({ row }) => h('div', { class: 'min-w-0' }, [
      h('p', { class: 'font-medium text-highlighted truncate' }, `${row.original.customers?.first_name || ''} ${row.original.customers?.last_name || ''}`.trim() || 'Pa emer'),
      h('p', { class: 'text-xs text-muted truncate' }, row.original.customers?.phone || 'Pa telefon')
    ])
  },
  {
    id: 'court',
    header: 'Fusha',
    cell: ({ row }) => h('div', [
      h('p', { class: 'font-medium text-highlighted' }, row.original.courts?.name || 'Pa fushe'),
      h('p', { class: 'text-xs text-muted' }, row.original.courts?.court_type === 'indoor' ? 'E mbyllur' : 'E hapur')
    ])
  },
  {
    accessorKey: 'start_at',
    header: 'Termini',
    cell: ({ row }) => {
      const minutes = Math.round((new Date(row.original.end_at).getTime() - new Date(row.original.start_at).getTime()) / 60000)
      return h('div', [
        h('p', { class: 'font-medium text-highlighted' }, formatDateTime(row.original.start_at)),
        h('p', { class: 'text-xs text-muted' }, `${minutes} min`)
      ])
    }
  },
  {
    accessorKey: 'status',
    header: 'Statusi',
    cell: ({ row }) => {
      const meta = statusMeta[row.original.status] ?? { label: 'Ne pritje', color: 'warning' as const }
      return h(UBadge, { color: meta.color, variant: 'subtle' }, () => meta.label)
    }
  },
  {
    accessorKey: 'price',
    header: 'Cmimi',
    meta: { class: { th: 'text-right', td: 'text-right font-semibold text-highlighted' } },
    cell: ({ row }) => formatCurrency(row.original.price)
  },
  {
    id: 'actions',
    header: '',
    meta: { class: { th: 'w-32', td: 'text-right' } },
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UTooltip, { text: 'Ndrysho' }, () => h(UButton, {
        'color': 'neutral',
        'variant': 'ghost',
        'icon': 'i-lucide-pencil',
        'aria-label': 'Ndrysho rezervimin',
        'onClick': () => openEdit(row.original)
      })),
      row.original.status !== 'cancelled'
        ? h(UTooltip, { text: 'Anulo' }, () => h(UButton, {
            'color': 'error',
            'variant': 'ghost',
            'icon': 'i-lucide-calendar-x',
            'aria-label': 'Anulo rezervimin',
            'onClick': () => askReservationAction('cancel', row.original)
          }))
        : null,
      canManagePricing.value
        ? h(UTooltip, { text: 'Fshi' }, () => h(UButton, {
            'color': 'error',
            'variant': 'ghost',
            'icon': 'i-lucide-trash-2',
            'aria-label': 'Fshi rezervimin',
            'onClick': () => askReservationAction('delete', row.original)
          }))
        : null
    ])
  }
]

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
          Krijo, filtro dhe menaxho terminet e akademise.
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

    <section class="mb-5 grid gap-3 rounded-2xl border border-default bg-white p-4 shadow-xs sm:grid-cols-[1fr_auto_auto] dark:bg-slate-900">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Kerko klientin ose telefonin..."
        class="w-full"
      />
      <select
        v-model="statusFilter"
        class="dashboard-select sm:w-44"
      >
        <option value="all">
          Te gjitha statuset
        </option><option value="pending">
          Ne pritje
        </option><option value="confirmed">
          Konfirmuar
        </option><option value="completed">
          Perfunduar
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
      title="Te dhenat nuk u ngarkuan"
      :description="error.message"
      class="mb-5"
    />

    <section class="overflow-hidden rounded-2xl border border-default bg-white shadow-xs dark:bg-slate-900">
      <UTable
        v-model:pagination="pagination"
        :data="filteredReservations"
        :columns="columns"
        :loading="status === 'pending'"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        class="min-h-80"
      />
      <DashboardTablePagination
        v-if="filteredReservations.length"
        v-model:page-index="pagination.pageIndex"
        :page-size="pagination.pageSize"
        :total="filteredReservations.length"
      />
    </section>

    <DashboardReservationForm
      v-model:open="formOpen"
      :reservation="selectedReservation"
      :initial-date="typeof route.query.date === 'string' ? route.query.date : null"
      @saved="refresh"
    />

    <DashboardConfirmActionModal
      v-model:open="confirmOpen"
      :title="pendingAction?.type === 'cancel' ? 'Anulo rezervimin?' : 'Fshi rezervimin?'"
      :description="pendingAction?.type === 'cancel'
        ? 'Rezervimi do te shenohet si i anuluar dhe nuk do te llogaritet si aktiv.'
        : 'Rezervimi do te fshihet pergjithmone. Ky veprim nuk mund te kthehet.'"
      :confirm-label="pendingAction?.type === 'cancel' ? 'Anulo rezervimin' : 'Fshi perfundimisht'"
      :confirm-icon="pendingAction?.type === 'cancel' ? 'i-lucide-calendar-x' : 'i-lucide-trash-2'"
      :loading="confirmLoading"
      @confirm="confirmReservationAction"
    />
  </div>
</template>
