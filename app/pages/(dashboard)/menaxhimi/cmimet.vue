<script setup lang="ts">
import type { TableRow } from '~/types/database.types'
import { formatCurrency } from '~/utils/dashboard'

definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Çmimet | Diamond Tennis Academy', robots: 'noindex, nofollow' })

const dashboardApi = useDashboardApi()
const toast = useToast()
const { canManagePricing, loadProfile } = useDashboardProfile()
await loadProfile()

const modalOpen = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ seasonId: '', courtType: 'indoor' as 'indoor' | 'outdoor', price: 0, isActive: true })

const { data, status, error, refresh } = await useAsyncData('price-management', async () => {
  const [seasons, prices] = await Promise.all([dashboardApi.listSeasons(), dashboardApi.listPrices()])
  return { seasons, prices }
})

function openCreate() {
  editingId.value = null
  Object.assign(form, { seasonId: data.value?.seasons.find(item => item.is_active)?.id || '', courtType: 'indoor', price: 0, isActive: true })
  modalOpen.value = true
}

function openEdit(item: TableRow<'price_rules'>) {
  editingId.value = item.id
  Object.assign(form, { seasonId: item.season_id, courtType: item.court_type, price: Number(item.price), isActive: item.is_active })
  modalOpen.value = true
}

async function save() {
  if (!canManagePricing.value || saving.value) return
  if (!form.seasonId || form.price < 0) {
    toast.add({ title: 'Plotëso të dhënat e çmimit', color: 'warning' })
    return
  }

  saving.value = true
  try {
    await dashboardApi.savePrice({ id: editingId.value || undefined, seasonId: form.seasonId, courtType: form.courtType, price: form.price, isActive: form.isActive })
    toast.add({ title: editingId.value ? 'Çmimi u përditësua' : 'Çmimi u shtua', color: 'success' })
    modalOpen.value = false
    await refresh()
  } catch (cause) {
    toast.add({ title: 'Ruajtja dështoi', description: cause instanceof Error ? cause.message : 'Kontrollo të dhënat.', color: 'error' })
  } finally {
    saving.value = false
  }
}

async function deletePrice(item: TableRow<'price_rules'>) {
  if (!canManagePricing.value || !import.meta.client) return
  if (!window.confirm('A je i sigurt qe deshiron ta fshish kete cmim?')) return

  try {
    await dashboardApi.deletePrice(item.id)
    toast.add({ title: 'Cmimi u fshi', color: 'success' })
    await refresh()
  } catch (cause) {
    toast.add({ title: 'Cmimi nuk u fshi', description: cause instanceof Error ? cause.message : 'Provo perseri.', color: 'error' })
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
          Çmimet
        </h1>
        <p class="dashboard-page-description">
          Përcakto çmimet bazë sipas sezonit, llojit të fushës dhe kohëzgjatjes.
        </p>
      </div>
      <UButton
        v-if="canManagePricing"
        icon="i-lucide-plus"
        size="lg"
        :disabled="!data?.seasons.length"
        @click="openCreate"
      >
        Shto çmim
      </UButton>
    </header>

    <UAlert
      v-if="!canManagePricing"
      color="warning"
      variant="subtle"
      icon="i-lucide-shield-alert"
      title="Qasje vetëm për lexim"
      description="Vetëm admin dhe superadmin mund t’i ndryshojnë çmimet."
    />
    <UAlert
      v-if="!data?.seasons.length && status !== 'pending'"
      color="info"
      variant="subtle"
      icon="i-lucide-sun-snow"
      title="Krijo fillimisht një sezon"
      description="Çdo çmim duhet të lidhet me një sezon."
      :actions="[{ label: 'Menaxho sezonet', to: '/menaxhimi/sezonet', color: 'neutral', variant: 'outline' }]"
    />
    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Të dhënat nuk u ngarkuan"
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
          v-for="item in data?.prices"
          :key="item.id"
          class="grid gap-4 p-5 sm:grid-cols-[1fr_auto_auto] sm:items-center"
        >
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <p class="dashboard-card-title">
                {{ item.seasons?.name || 'Pa sezon' }}
              </p>
              <UBadge
                :color="item.is_active ? 'success' : 'neutral'"
                variant="subtle"
              >
                {{ item.is_active ? 'Aktiv' : 'Joaktiv' }}
              </UBadge>
            </div>
            <p class="dashboard-meta mt-1">
              {{ item.court_type === 'indoor' ? 'Fushë e mbyllur' : 'Fushë e hapur' }} · Çmim për 1 orë
            </p>
          </div>
          <p class="text-lg font-bold text-highlighted">
            {{ formatCurrency(item.price) }}
          </p>
          <div class="flex items-center gap-1">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              aria-label="Ndrysho çmimin"
              :disabled="!canManagePricing"
              @click="openEdit(item)"
            />
            <UButton
              v-if="canManagePricing"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              aria-label="Fshi çmimin"
              @click="deletePrice(item)"
            />
          </div>
        </article>
        <UEmpty
          v-if="!data?.prices.length"
          icon="i-lucide-badge-euro"
          title="Nuk ka çmime"
          description="Shto rregullin e parë të çmimit për rezervimet."
          class="py-14"
        />
      </div>
    </section>

    <UModal
      v-model:open="modalOpen"
      :title="editingId ? 'Ndrysho çmimin' : 'Shto çmim'"
      description="Rregulli përdoret për llogaritjen automatike të rezervimit."
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
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Lloji i fushës"
              required
            >
              <USelect
                v-model="form.courtType"
                :items="[{ label: 'E mbyllur', value: 'indoor' }, { label: 'E hapur', value: 'outdoor' }]"
                value-key="value"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField
            label="Çmimi për 1 orë në EUR"
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
  </div>
</template>
