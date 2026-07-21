<script setup lang="ts">
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
import { h, resolveComponent } from 'vue'
import type { TableRow } from '~/types/database.types'
import { toLocalDateInput } from '~/utils/dashboard'

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
const today = toLocalDateInput(new Date())
const form = reactive({ name: '', type: 'summer' as 'summer' | 'winter', startsOn: today, endsOn: today, isActive: true })

const { data: seasons, status, error, refresh } = await useAsyncData('season-management', async () => {
  return dashboardApi.listSeasons()
})

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', type: 'summer', startsOn: today, endsOn: today, isActive: true })
  modalOpen.value = true
}

function openEdit(item: TableRow<'seasons'>) {
  editingId.value = item.id
  Object.assign(form, { name: item.name, type: item.season_type, startsOn: item.starts_on, endsOn: item.ends_on, isActive: item.is_active })
  modalOpen.value = true
}

async function save() {
  if (!canManagePricing.value || saving.value) return
  if (!form.name.trim() || !form.startsOn || !form.endsOn || form.endsOn < form.startsOn) {
    toast.add({ title: 'Kontrollo emrin dhe datat e sezonit', color: 'warning' })
    return
  }

  saving.value = true
  try {
    await dashboardApi.saveSeason({ id: editingId.value || undefined, name: form.name, seasonType: form.type, startsOn: form.startsOn, endsOn: form.endsOn, isActive: form.isActive })
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
    cell: ({ row }) => h('div', [
      h('p', { class: 'font-medium text-highlighted' }, row.original.name),
      h('p', { class: 'text-xs text-muted' }, `${row.original.starts_on} - ${row.original.ends_on}`)
    ])
  },
  {
    accessorKey: 'season_type',
    header: 'Lloji',
    cell: ({ row }) => h(UBadge, { color: 'neutral', variant: 'subtle' }, () => row.original.season_type === 'summer' ? 'Vere' : 'Dimer')
  },
  {
    accessorKey: 'is_active',
    header: 'Statusi',
    cell: ({ row }) => h(UBadge, { color: row.original.is_active ? 'success' : 'neutral', variant: 'subtle' }, () => row.original.is_active ? 'Aktiv' : 'Joaktiv')
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
        'aria-label': 'Ndrysho sezonin',
        'disabled': !canManagePricing.value,
        'onClick': () => openEdit(row.original)
      })),
      canManagePricing.value
        ? h(UTooltip, { text: 'Fshi' }, () => h(UButton, {
            'color': 'error',
            'variant': 'ghost',
            'icon': 'i-lucide-trash-2',
            'aria-label': 'Fshi sezonin',
            'onClick': () => askDeleteSeason(row.original)
          }))
        : null
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
          Menaxho periudhat verore dhe dimerore qe percaktojne cmimet e rezervimeve.
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

    <section class="overflow-hidden rounded-2xl border border-default bg-white shadow-xs dark:bg-slate-900">
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
      description="Datat e sezoneve aktive nuk mund te mbivendosen."
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
              placeholder="p.sh. Dimer 2026"
              maxlength="80"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Lloji"
            required
          >
            <USelect
              v-model="form.type"
              :items="[{ label: 'Vere', value: 'summer' }, { label: 'Dimer', value: 'winter' }]"
              value-key="value"
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
              label="Perfundon"
              required
            >
              <UInput
                v-model="form.endsOn"
                type="date"
                :min="form.startsOn"
                class="w-full"
              />
            </UFormField>
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
