<script setup lang="ts">
import type { TableRow } from '~/types/database.types'
import { formatCurrency } from '~/utils/dashboard'

definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Shërbime shtesë | Diamond Tennis Academy', robots: 'noindex, nofollow' })

const dashboardApi = useDashboardApi()
const toast = useToast()
const { canManagePricing, loadProfile } = useDashboardProfile()
await loadProfile()

const modalOpen = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ name: '', description: '', price: 0, isActive: true })

const { data: services, status, error, refresh } = await useAsyncData('extra-services-management', async () => {
  return dashboardApi.listExtraServices()
})

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
    toast.add({ title: 'Kontrollo emrin dhe çmimin', color: 'warning' })
    return
  }

  saving.value = true
  try {
    await dashboardApi.saveExtraService({ id: editingId.value || undefined, name: form.name, description: form.description, price: form.price, isActive: form.isActive })
    toast.add({ title: editingId.value ? 'Shërbimi u përditësua' : 'Shërbimi u shtua', color: 'success' })
    modalOpen.value = false
    await refresh()
  } catch (cause) {
    toast.add({ title: 'Ruajtja dështoi', description: cause instanceof Error ? cause.message : 'Emri i shërbimit duhet të jetë unik.', color: 'error' })
  } finally {
    saving.value = false
  }
}

async function deleteService(service: TableRow<'extra_services'>) {
  if (!canManagePricing.value || !import.meta.client) return
  if (!window.confirm(`A je i sigurt qe deshiron ta fshish sherbimin "${service.name}"?`)) return

  try {
    await dashboardApi.deleteExtraService(service.id)
    toast.add({ title: 'Sherbimi u fshi', color: 'success' })
    await refresh()
  } catch (cause) {
    toast.add({ title: 'Sherbimi nuk u fshi', description: cause instanceof Error ? cause.message : 'Provo perseri.', color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="dashboard-kicker">
          Menaxhimi
        </p>
        <h1 class="dashboard-page-title">
          Shërbime shtesë
        </h1>
        <p class="dashboard-page-description">
          Shto shërbime si ngrohja, pajisjet ose çdo shërbim tjetër dhe cakto çmimin e tyre.
        </p>
      </div>
      <UButton
        v-if="canManagePricing"
        icon="i-lucide-plus"
        size="lg"
        @click="openCreate"
      >
        Shto shërbim
      </UButton>
    </header>

    <UAlert
      v-if="!canManagePricing"
      color="warning"
      variant="subtle"
      icon="i-lucide-shield-alert"
      title="Qasje vetëm për lexim"
      description="Vetëm admin dhe superadmin mund t’i menaxhojnë shërbimet."
    />
    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Shërbimet nuk u ngarkuan"
      :description="error.message"
    />

    <section class="overflow-hidden rounded-2xl border border-default bg-white shadow-xs dark:bg-slate-900">
      <div
        v-if="status === 'pending'"
        class="space-y-3 p-6"
      >
        <USkeleton
          v-for="item in 4"
          :key="item"
          class="h-16 rounded-xl"
        />
      </div>
      <div
        v-else
        class="divide-y divide-default"
      >
        <article
          v-for="service in services"
          :key="service.id"
          class="grid gap-4 p-5 sm:grid-cols-[1fr_auto_auto] sm:items-center"
        >
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <p class="dashboard-card-title">
                {{ service.name }}
              </p><UBadge
                :color="service.is_active ? 'success' : 'neutral'"
                variant="subtle"
              >
                {{ service.is_active ? 'Aktiv' : 'Joaktiv' }}
              </UBadge>
            </div>
            <p
              v-if="service.description"
              class="dashboard-meta mt-1"
            >
              {{ service.description }}
            </p>
          </div>
          <p class="text-lg font-bold text-highlighted">
            {{ formatCurrency(service.price) }}
          </p>
          <div class="flex items-center gap-1">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              aria-label="Ndrysho shërbimin"
              :disabled="!canManagePricing"
              @click="openEdit(service)"
            />
            <UButton
              v-if="canManagePricing"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              aria-label="Fshi shërbimin"
              @click="deleteService(service)"
            />
          </div>
        </article>
        <UEmpty
          v-if="!services?.length"
          icon="i-lucide-hand-platter"
          title="Nuk ka shërbime shtesë"
          description="Shto p.sh. Ngrohje ose pajisje tenisi."
          class="py-14"
        />
      </div>
    </section>

    <UModal
      v-model:open="modalOpen"
      :title="editingId ? 'Ndrysho shërbimin' : 'Shto shërbim'"
      description="Shërbimet mund të aktivizohen ose çaktivizohen pa humbur të dhënat."
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
          <UFormField label="Përshkrimi">
            <UTextarea
              v-model="form.description"
              maxlength="300"
              placeholder="Opsionale"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Çmimi në EUR"
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
          </UButton><UButton
            type="submit"
            form="extra-service-form"
            :loading="saving"
          >
            Ruaj
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
