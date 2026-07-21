<script setup lang="ts">
import type { TableRow } from '~/types/database.types'
import { toLocalDateInput } from '~/utils/dashboard'

definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Sezonet | Diamond Tennis Academy', robots: 'noindex, nofollow' })

const dashboardApi = useDashboardApi()
const toast = useToast()
const { canManagePricing, loadProfile } = useDashboardProfile()
await loadProfile()

const modalOpen = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const today = toLocalDateInput(new Date())
const form = reactive({ name: '', type: 'summer' as 'summer' | 'winter', startsOn: today, endsOn: today, isActive: true })

const { data: seasons, status, error, refresh } = await useAsyncData('season-management', async () => {
  return dashboardApi.listSeasons()
})

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
    toast.add({ title: editingId.value ? 'Sezoni u përditësua' : 'Sezoni u shtua', color: 'success' })
    modalOpen.value = false
    await refresh()
  } catch (cause) {
    toast.add({ title: 'Ruajtja dështoi', description: cause instanceof Error ? cause.message : 'Sezonet aktive nuk duhet të mbivendosen.', color: 'error' })
  } finally {
    saving.value = false
  }
}

async function deleteSeason(item: TableRow<'seasons'>) {
  if (!canManagePricing.value || !import.meta.client) return
  if (!window.confirm(`A je i sigurt qe deshiron ta fshish sezonin "${item.name}"?`)) return

  try {
    await dashboardApi.deleteSeason(item.id)
    toast.add({ title: 'Sezoni u fshi', color: 'success' })
    await refresh()
  } catch (cause) {
    toast.add({ title: 'Sezoni nuk u fshi', description: cause instanceof Error ? cause.message : 'Provo perseri.', color: 'error' })
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
          Sezonet
        </h1>
        <p class="dashboard-page-description">
          Menaxho periudhat verore dhe dimërore që përcaktojnë çmimet e rezervimeve.
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
      title="Qasje vetëm për lexim"
      description="Vetëm admin dhe superadmin mund t’i ndryshojnë sezonet."
    />
    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Sezonet nuk u ngarkuan"
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
          v-for="item in seasons"
          :key="item.id"
          class="grid gap-4 p-5 sm:grid-cols-[1fr_auto_auto] sm:items-center"
        >
          <div>
            <p class="dashboard-card-title">
              {{ item.name }}
            </p>
            <p class="dashboard-meta mt-1">
              {{ item.starts_on }} – {{ item.ends_on }}
            </p>
          </div>
          <UBadge
            :color="item.is_active ? 'success' : 'neutral'"
            variant="subtle"
          >
            {{ item.season_type === 'summer' ? 'Verë' : 'Dimër' }} · {{ item.is_active ? 'Aktiv' : 'Joaktiv' }}
          </UBadge>
          <div class="flex items-center gap-1">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              aria-label="Ndrysho sezonin"
              :disabled="!canManagePricing"
              @click="openEdit(item)"
            />
            <UButton
              v-if="canManagePricing"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              aria-label="Fshi sezonin"
              @click="deleteSeason(item)"
            />
          </div>
        </article>
        <UEmpty
          v-if="!seasons?.length"
          icon="i-lucide-sun-snow"
          title="Nuk ka sezone"
          description="Shto sezonin e parë për të konfiguruar çmimet."
          class="py-14"
        />
      </div>
    </section>

    <UModal
      v-model:open="modalOpen"
      :title="editingId ? 'Ndrysho sezonin' : 'Shto sezon'"
      description="Datat e sezoneve aktive nuk mund të mbivendosen."
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
              placeholder="p.sh. Dimër 2026"
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
              :items="[{ label: 'Verë', value: 'summer' }, { label: 'Dimër', value: 'winter' }]"
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
              label="Përfundon"
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
  </div>
</template>
