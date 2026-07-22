<script setup lang="ts">
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
import { h, resolveComponent } from 'vue'
import type { TableRow } from '~/types/database.types'
import { daysInSeasonMonth, formatRecurringSeasonDate } from '~/utils/seasons'

definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Sezonet | Diamond Tennis Academy', robots: 'noindex, nofollow' })

const dashboardApi = useDashboardApi()
const toast = useToast()
const { canManagePricing, loadProfile } = useDashboardProfile()
await loadProfile()

const modalOpen = ref(false)
const confirmOpen = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editingId = ref<string | null>(null)
const seasonToDelete = ref<TableRow<'seasons'> | null>(null)
const pagination = ref({ pageIndex: 0, pageSize: 10 })
const currentDate = new Date()
const form = reactive({
  name: '',
  startsMonth: currentDate.getMonth() + 1,
  startsDay: currentDate.getDate(),
  endsMonth: currentDate.getMonth() + 1,
  endsDay: currentDate.getDate(),
  isActive: true
})
const monthItems = Array.from({ length: 12 }, (_, index) => {
  const value = index + 1
  const label = new Intl.DateTimeFormat('sq-AL', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, index, 1)))
  return { label: label.charAt(0).toUpperCase() + label.slice(1), value }
})
const startDayItems = computed(() => Array.from({ length: daysInSeasonMonth(form.startsMonth) }, (_, index) => ({ label: String(index + 1), value: index + 1 })))
const endDayItems = computed(() => Array.from({ length: daysInSeasonMonth(form.endsMonth) }, (_, index) => ({ label: String(index + 1), value: index + 1 })))

watch(() => form.startsMonth, () => {
  form.startsDay = Math.min(form.startsDay, daysInSeasonMonth(form.startsMonth))
})
watch(() => form.endsMonth, () => {
  form.endsDay = Math.min(form.endsDay, daysInSeasonMonth(form.endsMonth))
})

const { data: seasons, status, error, refresh } = await useAsyncData('season-management', async () => {
  return dashboardApi.listSeasons()
})

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

function openCreate() {
  editingId.value = null
  Object.assign(form, {
    name: '',
    startsMonth: currentDate.getMonth() + 1,
    startsDay: currentDate.getDate(),
    endsMonth: currentDate.getMonth() + 1,
    endsDay: currentDate.getDate(),
    isActive: true
  })
  modalOpen.value = true
}

function openEdit(item: TableRow<'seasons'>) {
  editingId.value = item.id
  Object.assign(form, {
    name: item.name,
    startsMonth: item.starts_month,
    startsDay: item.starts_day,
    endsMonth: item.ends_month,
    endsDay: item.ends_day,
    isActive: item.is_active
  })
  modalOpen.value = true
}

async function save() {
  if (!canManagePricing.value || saving.value) return
  if (!form.name.trim()) {
    toast.add({ title: 'Kontrollo emrin dhe datat e sezonit', color: 'warning' })
    return
  }

  saving.value = true
  try {
    await dashboardApi.saveSeason({
      id: editingId.value || undefined,
      name: form.name,
      startsMonth: form.startsMonth,
      startsDay: form.startsDay,
      endsMonth: form.endsMonth,
      endsDay: form.endsDay,
      isActive: form.isActive
    })
    toast.add({ title: editingId.value ? 'Sezoni u perditesua' : 'Sezoni u shtua', color: 'success' })
    modalOpen.value = false
    await refresh()
  } catch (cause) {
    toast.add({ title: 'Ruajtja deshtoi', description: cause instanceof Error ? cause.message : 'Sezonet aktive nuk duhet te mbivendosen.', color: 'error' })
  } finally {
    saving.value = false
  }
}

function askDeleteSeason(item: TableRow<'seasons'>) {
  if (!canManagePricing.value) return
  seasonToDelete.value = item
  confirmOpen.value = true
}

async function deleteSeason() {
  if (!canManagePricing.value || !seasonToDelete.value || deleting.value) return
  deleting.value = true
  try {
    await dashboardApi.deleteSeason(seasonToDelete.value.id)
    toast.add({ title: 'Sezoni u fshi', color: 'success' })
    confirmOpen.value = false
    seasonToDelete.value = null
    await refresh()
  } catch (cause) {
    toast.add({ title: 'Sezoni nuk u fshi', description: cause instanceof Error ? cause.message : 'Provo perseri.', color: 'error' })
  } finally {
    deleting.value = false
  }
}

const columns: TableColumn<TableRow<'seasons'>>[] = [
  {
    accessorKey: 'name',
    header: 'Sezoni',
    cell: ({ row }) => h('p', { class: 'font-medium text-highlighted' }, row.original.name)
  },
  {
    accessorKey: 'created_at',
    header: 'Datat e sezonit',
    cell: ({ row }) => h('span', { class: 'text-sm text-muted whitespace-nowrap' }, `${formatRecurringSeasonDate(row.original.starts_month, row.original.starts_day)} - ${formatRecurringSeasonDate(row.original.ends_month, row.original.ends_day)}`)
  },
  {
    accessorKey: 'is_active',
    header: 'Statusi',
    cell: ({ row }) => h(UBadge, { color: row.original.is_active ? 'success' : 'neutral', variant: 'subtle' }, () => row.original.is_active ? 'Aktiv' : 'Joaktiv')
  },
  {
    id: 'actions',
    header: 'Veprimet',
    meta: { class: { th: 'w-24', td: 'text-right' } },
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UButton, {
        'color': 'neutral',
        'variant': 'ghost',
        'size': 'xs',
        'icon': 'i-lucide-pencil',
        'title': 'Ndrysho',
        'aria-label': 'Ndrysho sezonin',
        'disabled': !canManagePricing.value,
        'onClick': () => openEdit(row.original)
      }),
      h(UButton, {
        'color': 'error',
        'variant': 'ghost',
        'size': 'xs',
        'icon': 'i-lucide-trash-2',
        'title': 'Fshi',
        'aria-label': 'Fshi sezonin',
        'disabled': !canManagePricing.value,
        'onClick': () => askDeleteSeason(row.original)
      })
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
          Sezonet
        </h1>
        <p class="dashboard-page-description">
          Menaxho sezonet dhe periudhat qe percaktojne cmimet e rezervimeve.
        </p>
      </div>
      <UButton
        v-if="canManagePricing"
        icon="i-lucide-plus"
        size="lg"
        @click="openCreate"
      >
        Shto sezon
      </UButton>
    </header>

    <UAlert
      v-if="!canManagePricing"
      color="warning"
      variant="subtle"
      icon="i-lucide-shield-alert"
      title="Qasje vetem per lexim"
      description="Vetem admin dhe superadmin mund t'i ndryshojne sezonet."
    />
    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Sezonet nuk u ngarkuan"
      :description="error.message"
    />

    <section class="overflow-hidden rounded-2xl border border-default bg-white p-3 shadow-xs sm:p-5 dark:bg-slate-900">
      <UTable
        v-model:pagination="pagination"
        :data="seasons || []"
        :columns="columns"
        :loading="status === 'pending'"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        class="min-h-72"
      />
      <DashboardTablePagination
        v-if="seasons?.length"
        v-model:page-index="pagination.pageIndex"
        :page-size="pagination.pageSize"
        :total="seasons.length"
      />
    </section>

    <UModal
      v-model:open="modalOpen"
      :title="editingId ? 'Ndrysho sezonin' : 'Shto sezon'"
      description="Periudha përsëritet automatikisht çdo vit dhe sezonet aktive nuk mund të mbivendosen."
    >
      <template #body>
        <form
          id="season-form"
          class="space-y-4"
          @submit.prevent="save"
        >
          <UFormField
            label="Emri"
            required
          >
            <UInput
              v-model="form.name"
              placeholder="p.sh. Sezona e pranveres"
              maxlength="80"
              class="w-full"
            />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <p class="text-sm font-medium text-highlighted">
                Fillon
              </p>
              <div class="grid grid-cols-[minmax(0,1fr)_92px] gap-2">
                <UFormField
                  label="Muaji"
                  required
                >
                  <USelect
                    v-model="form.startsMonth"
                    :items="monthItems"
                    value-key="value"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="Dita"
                  required
                >
                  <USelect
                    v-model="form.startsDay"
                    :items="startDayItems"
                    value-key="value"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </div>
            <div class="space-y-2">
              <p class="text-sm font-medium text-highlighted">
                Perfundon
              </p>
              <div class="grid grid-cols-[minmax(0,1fr)_92px] gap-2">
                <UFormField
                  label="Muaji"
                  required
                >
                  <USelect
                    v-model="form.endsMonth"
                    :items="monthItems"
                    value-key="value"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="Dita"
                  required
                >
                  <USelect
                    v-model="form.endsDay"
                    :items="endDayItems"
                    value-key="value"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </div>
          </div>
          <USwitch
            v-model="form.isActive"
            label="Aktiv"
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
            form="season-form"
            :loading="saving"
          >
            Ruaj
          </UButton>
        </div>
      </template>
    </UModal>

    <DashboardConfirmActionModal
      v-model:open="confirmOpen"
      title="Fshi sezonin?"
      :description="`Sezoni '${seasonToDelete?.name || ''}' do te fshihet pergjithmone. Ky veprim nuk mund te kthehet.`"
      confirm-label="Fshi sezonin"
      confirm-icon="i-lucide-trash-2"
      :loading="deleting"
      @confirm="deleteSeason"
    />
  </div>
</template>
