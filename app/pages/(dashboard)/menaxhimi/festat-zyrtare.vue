<script setup lang="ts">
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
import { h, resolveComponent } from 'vue'
import type { TableRow } from '~/types/database.types'
import { addIsoDays } from '~/utils/officialHolidays'

definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Festat zyrtare | Diamond Tennis Academy', robots: 'noindex, nofollow' })

type Holiday = TableRow<'official_holidays'>
type StatusFilter = 'all' | 'active' | 'inactive'

const dashboardApi = useDashboardApi()
const toast = useToast()
const { loadProfile } = useDashboardProfile()
await loadProfile()

const today = new Date().toISOString().slice(0, 10)
const modalOpen = ref(false)
const confirmOpen = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editingId = ref<string | null>(null)
const holidayToDelete = ref<Holiday | null>(null)
const search = ref('')
const statusFilter = ref<StatusFilter>('all')
const pagination = ref({ pageIndex: 0, pageSize: 10 })
const form = reactive({ name: '', startsOn: today, endsOn: today, notes: '', isActive: true })
const maximumEndDate = computed(() => addIsoDays(form.startsOn, 30))

const { data: holidays, status, error, refresh } = await useAsyncData('official-holidays-management', () => (
  dashboardApi.listOfficialHolidays()
))

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')

const statusItems = [
  { label: 'Të gjitha', value: 'all' },
  { label: 'Aktive', value: 'active' },
  { label: 'Joaktive', value: 'inactive' }
]

const filteredHolidays = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('sq')
  return (holidays.value || []).filter((holiday) => {
    const matchesStatus = statusFilter.value === 'all'
      || (statusFilter.value === 'active' && holiday.is_active)
      || (statusFilter.value === 'inactive' && !holiday.is_active)
    const matchesSearch = !query
      || holiday.name.toLocaleLowerCase('sq').includes(query)
      || holiday.notes?.toLocaleLowerCase('sq').includes(query)
    return matchesStatus && Boolean(matchesSearch)
  })
})

const activeCount = computed(() => (holidays.value || []).filter(holiday => holiday.is_active).length)
const upcomingHoliday = computed(() => (holidays.value || []).find(holiday => holiday.is_active && holiday.ends_on >= today) || null)
const blockedDates = computed(() => {
  const dates = new Set<string>()
  for (const holiday of holidays.value || []) {
    if (!holiday.is_active) continue
    let date = holiday.starts_on
    while (date <= holiday.ends_on) {
      dates.add(date)
      date = addIsoDays(date, 1)
    }
  }
  return dates.size
})

function formatDate(value: string) {
  return new Intl.DateTimeFormat('sq-AL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${value}T12:00:00Z`))
}

function dateLabel(holiday: Holiday) {
  return holiday.starts_on === holiday.ends_on
    ? formatDate(holiday.starts_on)
    : `${formatDate(holiday.starts_on)} – ${formatDate(holiday.ends_on)}`
}

function durationLabel(holiday: Holiday) {
  const days = Math.round((Date.parse(`${holiday.ends_on}T12:00:00Z`) - Date.parse(`${holiday.starts_on}T12:00:00Z`)) / 86_400_000) + 1
  return `${days} ${days === 1 ? 'ditë' : 'ditë'}`
}

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', startsOn: today, endsOn: today, notes: '', isActive: true })
  modalOpen.value = true
}

function openEdit(holiday: Holiday) {
  editingId.value = holiday.id
  Object.assign(form, {
    name: holiday.name,
    startsOn: holiday.starts_on,
    endsOn: holiday.ends_on,
    notes: holiday.notes || '',
    isActive: holiday.is_active
  })
  modalOpen.value = true
}

async function save() {
  if (saving.value) return
  if (
    form.name.trim().length < 2
    || !form.startsOn
    || !form.endsOn
    || form.endsOn < form.startsOn
    || form.endsOn > maximumEndDate.value
  ) {
    toast.add({ title: 'Kontrollo emrin dhe datat e festës', color: 'warning' })
    return
  }

  saving.value = true
  try {
    await dashboardApi.saveOfficialHoliday({
      id: editingId.value || undefined,
      name: form.name,
      startsOn: form.startsOn,
      endsOn: form.endsOn,
      notes: form.notes,
      isActive: form.isActive
    })
    toast.add({ title: editingId.value ? 'Festa u përditësua' : 'Festa u shtua', color: 'success' })
    modalOpen.value = false
    await refresh()
  } catch (cause) {
    toast.add({
      title: 'Festa nuk u ruajt',
      description: cause instanceof Error ? cause.message : 'Kontrollo datat dhe provo përsëri.',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

function askDelete(holiday: Holiday) {
  holidayToDelete.value = holiday
  confirmOpen.value = true
}

async function deleteHoliday() {
  if (!holidayToDelete.value || deleting.value) return
  deleting.value = true
  try {
    await dashboardApi.deleteOfficialHoliday(holidayToDelete.value.id)
    toast.add({ title: 'Festa u fshi', color: 'success' })
    confirmOpen.value = false
    holidayToDelete.value = null
    await refresh()
  } catch (cause) {
    toast.add({
      title: 'Festa nuk u fshi',
      description: cause instanceof Error ? cause.message : 'Provo përsëri.',
      color: 'error'
    })
  } finally {
    deleting.value = false
  }
}

watch([search, statusFilter], () => {
  pagination.value.pageIndex = 0
})

const columns: TableColumn<Holiday>[] = [
  {
    accessorKey: 'name',
    header: 'Festa',
    cell: ({ row }) => h('div', { class: 'min-w-52' }, [
      h('p', { class: 'font-semibold text-highlighted' }, row.original.name),
      row.original.notes
        ? h('p', { class: 'mt-0.5 max-w-md truncate text-xs text-muted', title: row.original.notes }, row.original.notes)
        : null
    ])
  },
  {
    id: 'period',
    header: 'Periudha',
    cell: ({ row }) => h('div', [
      h('p', { class: 'font-medium text-highlighted' }, dateLabel(row.original)),
      h('p', { class: 'text-xs text-muted' }, durationLabel(row.original))
    ])
  },
  {
    accessorKey: 'is_active',
    header: 'Statusi',
    cell: ({ row }) => h(UBadge, {
      color: row.original.is_active ? 'success' : 'neutral',
      variant: 'subtle'
    }, () => row.original.is_active ? 'Bllokon rezervimet' : 'Joaktive')
  },
  {
    id: 'actions',
    header: '',
    meta: { class: { th: 'w-24', td: 'text-right' } },
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UTooltip, { text: 'Ndrysho' }, () => h(UButton, {
        'color': 'neutral',
        'variant': 'ghost',
        'icon': 'i-lucide-pencil',
        'aria-label': `Ndrysho festën ${row.original.name}`,
        'onClick': () => openEdit(row.original)
      })),
      h(UTooltip, { text: 'Fshi' }, () => h(UButton, {
        'color': 'error',
        'variant': 'ghost',
        'icon': 'i-lucide-trash-2',
        'aria-label': `Fshi festën ${row.original.name}`,
        'onClick': () => askDelete(row.original)
      }))
    ])
  }
]
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="dashboard-kicker">
          Menaxhimi
        </p>
        <h1 class="dashboard-page-title">
          Festat zyrtare
        </h1>
        <p class="dashboard-page-description">
          Menaxho ditët kur rezervimi online mbyllet automatikisht për të gjitha fushat.
        </p>
      </div>
      <UButton
        icon="i-lucide-calendar-plus"
        size="lg"
        @click="openCreate"
      >
        Shto festë
      </UButton>
    </header>

    <div class="grid gap-4 sm:grid-cols-3">
      <UCard>
        <div class="flex items-center gap-3">
          <span class="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <UIcon
              name="i-lucide-calendar-off"
              class="size-5"
            />
          </span>
          <div>
            <p class="text-xs text-muted">
              Festa aktive
            </p><strong class="text-2xl">{{ activeCount }}</strong>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-3">
          <span class="grid size-10 place-items-center rounded-xl bg-warning/10 text-warning">
            <UIcon
              name="i-lucide-ban"
              class="size-5"
            />
          </span>
          <div>
            <p class="text-xs text-muted">
              Ditë të bllokuara
            </p><strong class="text-2xl">{{ blockedDates }}</strong>
          </div>
        </div>
      </UCard>
      <UCard>
        <p class="text-xs text-muted">
          Festa e ardhshme
        </p>
        <strong class="mt-1 block truncate text-highlighted">{{ upcomingHoliday?.name || 'Nuk ka të planifikuar' }}</strong>
        <span class="text-xs text-muted">{{ upcomingHoliday ? dateLabel(upcomingHoliday) : '—' }}</span>
      </UCard>
    </div>

    <UAlert
      color="info"
      variant="subtle"
      icon="i-lucide-shield-check"
      title="Bllokim automatik dhe i sigurt"
      description="Festat aktive bllokohen në kalendar, API dhe databazë. Stafi vazhdon të mund të krijojë rezervime manuale kur është e nevojshme."
    />

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Festat nuk u ngarkuan"
      :description="error.message"
    />

    <section class="overflow-hidden rounded-2xl border border-default bg-white shadow-xs dark:bg-slate-900">
      <div class="flex flex-col gap-3 border-b border-default p-4 sm:flex-row">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Kërko festë..."
          class="w-full sm:max-w-sm"
        />
        <USelect
          v-model="statusFilter"
          :items="statusItems"
          value-key="value"
          class="w-full sm:ml-auto sm:w-44"
        />
      </div>

      <UTable
        v-model:pagination="pagination"
        :data="filteredHolidays"
        :columns="columns"
        :loading="status === 'pending'"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        class="min-h-72"
      >
        <template #empty>
          <div class="grid min-h-52 place-items-center px-6 text-center">
            <div>
              <UIcon
                name="i-lucide-calendar-search"
                class="mx-auto mb-3 size-9 text-muted"
              />
              <p class="font-semibold text-highlighted">
                Nuk u gjet asnjë festë
              </p>
              <p class="mt-1 text-sm text-muted">
                Shto festën e parë ose ndrysho filtrat.
              </p>
            </div>
          </div>
        </template>
      </UTable>
      <DashboardTablePagination
        v-if="filteredHolidays.length"
        v-model:page-index="pagination.pageIndex"
        :page-size="pagination.pageSize"
        :total="filteredHolidays.length"
      />
    </section>

    <UModal
      v-model:open="modalOpen"
      :title="editingId ? 'Ndrysho festën zyrtare' : 'Shto festë zyrtare'"
      description="Mund të bllokosh një ditë ose një periudhë deri në 31 ditë."
    >
      <template #body>
        <form
          id="official-holiday-form"
          class="space-y-4"
          @submit.prevent="save"
        >
          <UFormField
            label="Emri i festës"
            required
          >
            <UInput
              v-model="form.name"
              maxlength="100"
              placeholder="p.sh. Dita e Pavarësisë"
              class="w-full"
            />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Fillon"
              required
            >
              <UInput
                v-model="form.startsOn"
                type="date"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Përfundon"
              required
            >
              <UInput
                v-model="form.endsOn"
                type="date"
                :min="form.startsOn"
                :max="maximumEndDate"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField label="Shënime">
            <UTextarea
              v-model="form.notes"
              maxlength="500"
              :rows="3"
              placeholder="Opsionale, vetëm për stafin"
              class="w-full"
            />
          </UFormField>
          <USwitch
            v-model="form.isActive"
            label="Aktive — bllokon rezervimet online"
          />
        </form>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            @click="modalOpen = false"
          >
            Anulo
          </UButton>
          <UButton
            type="submit"
            form="official-holiday-form"
            :loading="saving"
          >
            Ruaj
          </UButton>
        </div>
      </template>
    </UModal>

    <DashboardConfirmActionModal
      v-model:open="confirmOpen"
      title="Fshi festën zyrtare?"
      :description="`Festa '${holidayToDelete?.name || ''}' do të fshihet përgjithmonë.`"
      confirm-label="Fshi festën"
      confirm-icon="i-lucide-trash-2"
      :loading="deleting"
      @confirm="deleteHoliday"
    />
  </div>
</template>
