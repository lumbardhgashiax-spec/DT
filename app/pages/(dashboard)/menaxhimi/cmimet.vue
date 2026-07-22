<script setup lang="ts">
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
import { h, resolveComponent } from 'vue'
import type { PriceRuleView } from '~/types/dashboard'
import { formatCurrency } from '~/utils/dashboard'

definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Cmimet | Diamond Tennis Academy', robots: 'noindex, nofollow' })

const dashboardApi = useDashboardApi()
const toast = useToast()
const { canManagePricing, loadProfile } = useDashboardProfile()
await loadProfile()

const modalOpen = ref(false)
const confirmOpen = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editingId = ref<string | null>(null)
const priceToDelete = ref<PriceRuleView | null>(null)
const pagination = ref({ pageIndex: 0, pageSize: 10 })
const form = reactive({ seasonId: '', courtType: 'indoor' as 'indoor' | 'outdoor', price: 0, isActive: true })

const { data, status, error, refresh } = await useAsyncData('price-management', async () => {
  const [seasons, prices] = await Promise.all([dashboardApi.listSeasons(), dashboardApi.listPrices()])
  return { seasons, prices }
})

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

function openCreate() {
  editingId.value = null
  Object.assign(form, { seasonId: data.value?.seasons.find(item => item.is_active)?.id || '', courtType: 'indoor', price: 0, isActive: true })
  modalOpen.value = true
}

function openEdit(item: PriceRuleView) {
  editingId.value = item.id
  Object.assign(form, { seasonId: item.season_id, courtType: item.court_type, price: Number(item.price), isActive: item.is_active })
  modalOpen.value = true
}

async function save() {
  if (!canManagePricing.value || saving.value) return
  if (!form.seasonId || form.price < 0) {
    toast.add({ title: 'Ploteso te dhenat e cmimit', color: 'warning' })
    return
  }

  saving.value = true
  try {
    await dashboardApi.savePrice({ id: editingId.value || undefined, seasonId: form.seasonId, courtType: form.courtType, price: form.price, isActive: form.isActive })
    const seasonName = data.value?.seasons.find(item => item.id === form.seasonId)?.name || 'sezonin e zgjedhur'
    const courtLabel = form.courtType === 'indoor' ? 'fushë të mbyllur' : 'fushë të hapur'
    toast.add({
      title: editingId.value ? 'Çmimi u përditësua' : 'Çmimi u shtua',
      description: `Çmimi për ${seasonName} në ${courtLabel} u ${editingId.value ? 'përditësua' : 'shtua'} me sukses.`,
      color: 'success'
    })
    modalOpen.value = false
    await refresh()
  } catch (cause) {
    toast.add({ title: 'Ruajtja deshtoi', description: cause instanceof Error ? cause.message : 'Kontrollo te dhenat.', color: 'error' })
  } finally {
    saving.value = false
  }
}

function askDeletePrice(item: PriceRuleView) {
  if (!canManagePricing.value) return
  priceToDelete.value = item
  confirmOpen.value = true
}

async function deletePrice() {
  if (!canManagePricing.value || !priceToDelete.value || deleting.value) return
  deleting.value = true
  try {
    await dashboardApi.deletePrice(priceToDelete.value.id)
    toast.add({ title: 'Cmimi u fshi', color: 'success' })
    confirmOpen.value = false
    priceToDelete.value = null
    await refresh()
  } catch (cause) {
    toast.add({ title: 'Cmimi nuk u fshi', description: cause instanceof Error ? cause.message : 'Provo perseri.', color: 'error' })
  } finally {
    deleting.value = false
  }
}

const columns: TableColumn<PriceRuleView>[] = [
  {
    id: 'season',
    header: 'Sezoni',
    cell: ({ row }) => h('div', [
      h('p', { class: 'font-medium text-highlighted' }, row.original.seasons?.name || 'Pa sezon'),
      h('p', { class: 'text-xs text-muted' }, row.original.court_type === 'indoor' ? 'Fushe e mbyllur' : 'Fushe e hapur')
    ])
  },
  {
    accessorKey: 'price',
    header: 'Cmimi',
    meta: { class: { th: 'text-right', td: 'text-right font-semibold text-highlighted' } },
    cell: ({ row }) => formatCurrency(row.original.price)
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
        'aria-label': 'Ndrysho cmimin',
        'disabled': !canManagePricing.value,
        'onClick': () => openEdit(row.original)
      }),
      h(UButton, {
        'color': 'error',
        'variant': 'ghost',
        'size': 'xs',
        'icon': 'i-lucide-trash-2',
        'title': 'Fshi',
        'aria-label': 'Fshi cmimin',
        'disabled': !canManagePricing.value,
        'onClick': () => askDeletePrice(row.original)
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
          Cmimet
        </h1>
        <p class="dashboard-page-description">
          Percakto cmimet baze sipas sezonit, llojit te fushes dhe kohezgjatjes.
        </p>
      </div>
      <UButton
        v-if="canManagePricing"
        icon="i-lucide-plus"
        size="lg"
        :disabled="!data?.seasons.length"
        @click="openCreate"
      >
        Shto cmim
      </UButton>
    </header>

    <UAlert
      v-if="!canManagePricing"
      color="warning"
      variant="subtle"
      icon="i-lucide-shield-alert"
      title="Qasje vetem per lexim"
      description="Vetem admin dhe superadmin mund t'i ndryshojne cmimet."
    />
    <UAlert
      v-if="!data?.seasons.length && status !== 'pending'"
      color="info"
      variant="subtle"
      icon="i-lucide-sun-snow"
      title="Krijo fillimisht nje sezon"
      description="Cdo cmim duhet te lidhet me nje sezon."
      :actions="[{ label: 'Menaxho sezonet', to: '/menaxhimi/sezonet', color: 'neutral', variant: 'outline' }]"
    />
    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Te dhenat nuk u ngarkuan"
      :description="error.message"
    />

    <section class="overflow-hidden rounded-2xl border border-default bg-white p-3 shadow-xs sm:p-5 dark:bg-slate-900">
      <UTable
        v-model:pagination="pagination"
        :data="data?.prices || []"
        :columns="columns"
        :loading="status === 'pending'"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        class="min-h-72"
      />
      <DashboardTablePagination
        v-if="data?.prices.length"
        v-model:page-index="pagination.pageIndex"
        :page-size="pagination.pageSize"
        :total="data.prices.length"
      />
    </section>

    <UModal
      v-model:open="modalOpen"
      :title="editingId ? 'Ndrysho cmimin' : 'Shto cmim'"
      description="Rregulli perdoret per llogaritjen automatike te rezervimit."
    >
      <template #body>
        <form
          id="price-form"
          class="space-y-4"
          @submit.prevent="save"
        >
          <UFormField
            label="Sezoni"
            required
          >
            <USelect
              v-model="form.seasonId"
              :items="data?.seasons.map(item => ({ label: item.name, value: item.id })) || []"
              value-key="value"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Lloji i fushes"
            required
          >
            <USelect
              v-model="form.courtType"
              :items="[{ label: 'E mbyllur', value: 'indoor' }, { label: 'E hapur', value: 'outdoor' }]"
              value-key="value"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Cmimi per 1 ore ne EUR"
            required
          >
            <UInput
              v-model.number="form.price"
              type="number"
              min="0"
              step="0.01"
              class="w-full"
            />
          </UFormField>
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
            form="price-form"
            :loading="saving"
          >
            Ruaj
          </UButton>
        </div>
      </template>
    </UModal>

    <DashboardConfirmActionModal
      v-model:open="confirmOpen"
      title="Fshi cmimin?"
      description="Cmimi do te fshihet pergjithmone. Rezervimet ekzistuese nuk ndryshohen."
      confirm-label="Fshi cmimin"
      confirm-icon="i-lucide-trash-2"
      :loading="deleting"
      @confirm="deletePrice"
    />
  </div>
</template>
