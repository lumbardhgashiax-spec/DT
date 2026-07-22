<script setup lang="ts">
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
import { h, resolveComponent } from 'vue'
import type { TableRow } from '~/types/database.types'
import { formatCurrency } from '~/utils/dashboard'

definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Sherbime shtese | Diamond Tennis Academy', robots: 'noindex, nofollow' })

const dashboardApi = useDashboardApi()
const toast = useToast()
const { canManagePricing, loadProfile } = useDashboardProfile()
await loadProfile()

const modalOpen = ref(false)
const confirmOpen = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editingId = ref<string | null>(null)
const serviceToDelete = ref<TableRow<'extra_services'> | null>(null)
const pagination = ref({ pageIndex: 0, pageSize: 10 })
const form = reactive({ name: '', description: '', price: 0, isActive: true })

const { data: services, status, error, refresh } = await useAsyncData('extra-services-management', async () => {
  return dashboardApi.listExtraServices()
})

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', description: '', price: 0, isActive: true })
  modalOpen.value = true
}

function openEdit(service: TableRow<'extra_services'>) {
  editingId.value = service.id
  Object.assign(form, { name: service.name, description: service.description || '', price: Number(service.price), isActive: service.is_active })
  modalOpen.value = true
}

async function save() {
  if (!canManagePricing.value || saving.value) return
  if (!form.name.trim() || form.price < 0) {
    toast.add({ title: 'Kontrollo emrin dhe cmimin', color: 'warning' })
    return
  }

  saving.value = true
  try {
    await dashboardApi.saveExtraService({ id: editingId.value || undefined, name: form.name, description: form.description, price: form.price, isActive: form.isActive })
    toast.add({ title: editingId.value ? 'Sherbimi u perditesua' : 'Sherbimi u shtua', color: 'success' })
    modalOpen.value = false
    await refresh()
  } catch (cause) {
    toast.add({ title: 'Ruajtja deshtoi', description: cause instanceof Error ? cause.message : 'Emri i sherbimit duhet te jete unik.', color: 'error' })
  } finally {
    saving.value = false
  }
}

function askDeleteService(service: TableRow<'extra_services'>) {
  if (!canManagePricing.value) return
  serviceToDelete.value = service
  confirmOpen.value = true
}

async function deleteService() {
  if (!canManagePricing.value || !serviceToDelete.value || deleting.value) return
  deleting.value = true
  try {
    await dashboardApi.deleteExtraService(serviceToDelete.value.id)
    toast.add({ title: 'Sherbimi u fshi', color: 'success' })
    confirmOpen.value = false
    serviceToDelete.value = null
    await refresh()
  } catch (cause) {
    toast.add({ title: 'Sherbimi nuk u fshi', description: cause instanceof Error ? cause.message : 'Provo perseri.', color: 'error' })
  } finally {
    deleting.value = false
  }
}

const columns: TableColumn<TableRow<'extra_services'>>[] = [
  {
    accessorKey: 'name',
    header: 'Sherbimi',
    cell: ({ row }) => h('div', { class: 'min-w-0' }, [
      h('p', { class: 'font-medium text-highlighted truncate' }, row.original.name),
      row.original.description ? h('p', { class: 'text-xs text-muted truncate' }, row.original.description) : null
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
        'aria-label': 'Ndrysho sherbimin',
        'disabled': !canManagePricing.value,
        'onClick': () => openEdit(row.original)
      }),
      h(UButton, {
        'color': 'error',
        'variant': 'ghost',
        'size': 'xs',
        'icon': 'i-lucide-trash-2',
        'title': 'Fshi',
        'aria-label': 'Fshi sherbimin',
        'disabled': !canManagePricing.value,
        'onClick': () => askDeleteService(row.original)
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
          Sherbime shtese
        </h1>
        <p class="dashboard-page-description">
          Shto sherbime si ngrohja, pajisjet ose cdo sherbim tjeter dhe cakto cmimin e tyre.
        </p>
      </div>
      <UButton
        v-if="canManagePricing"
        icon="i-lucide-plus"
        size="lg"
        @click="openCreate"
      >
        Shto sherbim
      </UButton>
    </header>

    <UAlert
      v-if="!canManagePricing"
      color="warning"
      variant="subtle"
      icon="i-lucide-shield-alert"
      title="Qasje vetem per lexim"
      description="Vetem admin dhe superadmin mund t'i menaxhojne sherbimet."
    />
    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Sherbimet nuk u ngarkuan"
      :description="error.message"
    />

    <section class="overflow-hidden rounded-2xl border border-default bg-white p-3 shadow-xs sm:p-5 dark:bg-slate-900">
      <UTable
        v-model:pagination="pagination"
        :data="services || []"
        :columns="columns"
        :loading="status === 'pending'"
        :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
        class="min-h-72"
      />
      <DashboardTablePagination
        v-if="services?.length"
        v-model:page-index="pagination.pageIndex"
        :page-size="pagination.pageSize"
        :total="services.length"
      />
    </section>

    <UModal
      v-model:open="modalOpen"
      :title="editingId ? 'Ndrysho sherbimin' : 'Shto sherbim'"
      description="Sherbimet mund te aktivizohen ose caktivizohen pa humbur te dhenat."
    >
      <template #body>
        <form
          id="extra-service-form"
          class="space-y-4"
          @submit.prevent="save"
        >
          <UFormField
            label="Emri"
            required
          >
            <UInput
              v-model="form.name"
              maxlength="100"
              placeholder="p.sh. Ngrohje"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Pershkrimi">
            <UTextarea
              v-model="form.description"
              maxlength="300"
              placeholder="Opsionale"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Cmimi ne EUR"
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
            form="extra-service-form"
            :loading="saving"
          >
            Ruaj
          </UButton>
        </div>
      </template>
    </UModal>

    <DashboardConfirmActionModal
      v-model:open="confirmOpen"
      title="Fshi sherbimin?"
      :description="`Sherbimi '${serviceToDelete?.name || ''}' do te fshihet pergjithmone. Ky veprim nuk mund te kthehet.`"
      confirm-label="Fshi sherbimin"
      confirm-icon="i-lucide-trash-2"
      :loading="deleting"
      @confirm="deleteService"
    />
  </div>
</template>
