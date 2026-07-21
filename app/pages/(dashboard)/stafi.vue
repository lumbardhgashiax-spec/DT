<script setup lang="ts">
import type { TableRow, UserRole } from '~/types/database.types'

definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Stafi | Diamond Tennis Academy', robots: 'noindex, nofollow' })

const dashboardApi = useDashboardApi()
const toast = useToast()
const { profile: currentProfile, isSuperAdmin, loadProfile } = useDashboardProfile()
await loadProfile()

const search = ref('')
const formOpen = ref(false)
const deleteOpen = ref(false)
const saving = ref(false)
const selectedProfile = ref<TableRow<'profiles'> | null>(null)
const profileToDelete = ref<TableRow<'profiles'> | null>(null)

const form = reactive({
  full_name: '',
  email: '',
  phone: '',
  role: 'staff' as UserRole,
  password: '',
  is_active: true
})

const roleOptions = [
  { label: 'Staf', value: 'staff' },
  { label: 'admin', value: 'admin' },
  { label: 'superadmin', value: 'superadmin' }
]
const roleLabels: Record<UserRole, string> = { staff: 'Staf', admin: 'Administrator', superadmin: 'Superadmin' }

const { data: profiles, status, error, refresh } = await useAsyncData('staff-profiles', async () => {
  return dashboardApi.getStaff()
})

const filteredProfiles = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return profiles.value || []
  return (profiles.value || []).filter(item => `${item.full_name} ${item.email || ''} ${item.phone || ''}`.toLowerCase().includes(query))
})

const staffStats = computed(() => ({
  total: profiles.value?.length || 0,
  active: profiles.value?.filter(item => item.is_active).length || 0,
  admins: profiles.value?.filter(item => item.role !== 'staff').length || 0
}))

function resetForm() {
  form.full_name = ''
  form.email = ''
  form.phone = ''
  form.role = 'staff'
  form.password = ''
  form.is_active = true
}

function openCreate() {
  selectedProfile.value = null
  resetForm()
  formOpen.value = true
}

function openEdit(item: TableRow<'profiles'>) {
  selectedProfile.value = item
  form.full_name = item.full_name
  form.email = item.email || ''
  form.phone = item.phone || ''
  form.role = item.role
  form.password = ''
  form.is_active = item.is_active
  formOpen.value = true
}

function errorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const value = error as { data?: { statusMessage?: string, message?: string }, statusMessage?: string, message?: string }
    return value.data?.statusMessage || value.data?.message || value.statusMessage || value.message
  }
  return undefined
}

async function saveProfile() {
  if (!isSuperAdmin.value || saving.value) return
  if (!form.full_name.trim() || !form.email.trim() || (!selectedProfile.value && form.password.length < 8)) {
    toast.add({ title: 'Plotëso fushat e detyrueshme', description: 'Për llogari të reja fjalëkalimi duhet të ketë së paku 8 karaktere.', color: 'warning' })
    return
  }

  saving.value = true
  try {
    const payload = { ...form, password: form.password || undefined }
    if (selectedProfile.value) {
      await dashboardApi.updateStaff(selectedProfile.value.id, payload)
    } else {
      await dashboardApi.createStaff(payload)
    }
    toast.add({ title: selectedProfile.value ? 'Stafi u përditësua' : 'Llogaria e stafit u krijua', color: 'success' })
    formOpen.value = false
    await refresh()
  } catch (error) {
    toast.add({ title: 'Veprimi dështoi', description: errorMessage(error), color: 'error' })
  } finally {
    saving.value = false
  }
}

function askDelete(item: TableRow<'profiles'>) {
  profileToDelete.value = item
  deleteOpen.value = true
}

async function deleteProfile() {
  if (!profileToDelete.value || saving.value) return
  saving.value = true
  try {
    await dashboardApi.deleteStaff(profileToDelete.value.id)
    toast.add({ title: 'Llogaria u fshi', description: 'Përdoruesi u largua nga Auth dhe dashboard-i.', color: 'success' })
    deleteOpen.value = false
    await refresh()
  } catch (error) {
    toast.add({ title: 'Llogaria nuk u fshi', description: errorMessage(error), color: 'error' })
  } finally {
    saving.value = false
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
          Stafi dhe rolet
        </h1>
        <p class="dashboard-page-description">
          Krijo llogari, përditëso të dhënat, rolet dhe qasjen e stafit.
        </p>
      </div>
      <UButton
        v-if="isSuperAdmin"
        icon="i-lucide-user-plus"
        size="lg"
        @click="openCreate"
      >
        Shto staf
      </UButton>
    </header>

    <UAlert
      v-if="!isSuperAdmin"
      color="warning"
      variant="subtle"
      icon="i-lucide-shield-alert"
      title="Kërkohet superadmin"
      description="Vetëm superadmin mund të krijojë, ndryshojë ose fshijë llogari të stafit."
    />
    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Stafi nuk u ngarkua"
      :description="error.message"
    />

    <section class="grid overflow-hidden rounded-2xl border border-default bg-white shadow-xs sm:grid-cols-3 dark:bg-slate-900">
      <div class="p-5">
        <p class="dashboard-metric-label">
          Gjithsej
        </p>
        <p class="dashboard-metric-value mt-2">
          {{ staffStats.total }}
        </p>
      </div>
      <div class="border-t border-default p-5 sm:border-l sm:border-t-0">
        <p class="dashboard-metric-label">
          Aktivë
        </p>
        <p class="dashboard-metric-value mt-2 text-emerald-600">
          {{ staffStats.active }}
        </p>
      </div>
      <div class="border-t border-default p-5 sm:border-l sm:border-t-0">
        <p class="dashboard-metric-label">
          Administratorë
        </p>
        <p class="dashboard-metric-value mt-2">
          {{ staffStats.admins }}
        </p>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-default bg-white shadow-xs dark:bg-slate-900">
      <div class="border-b border-default p-4">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Kërko me emër, email ose telefon..."
          class="w-full sm:max-w-md"
        />
      </div>

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
        v-else-if="filteredProfiles.length"
        class="divide-y divide-default"
      >
        <article
          v-for="item in filteredProfiles"
          :key="item.id"
          class="grid gap-4 p-5 sm:grid-cols-[minmax(220px,1fr)_150px_110px_auto] sm:items-center"
        >
          <div class="flex min-w-0 items-center gap-3">
            <UAvatar
              :text="item.full_name.charAt(0).toUpperCase()"
              class="shrink-0 bg-[#062660] font-bold text-white"
            />
            <div class="min-w-0">
              <p class="dashboard-card-title truncate">
                {{ item.full_name }}
              </p>
              <p class="dashboard-meta truncate">
                {{ item.email }}<span v-if="item.phone"> · {{ item.phone }}</span>
              </p>
            </div>
          </div>
          <UBadge
            color="neutral"
            variant="subtle"
            class="w-fit"
          >
            {{ roleLabels[item.role] }}
          </UBadge>
          <UBadge
            :color="item.is_active ? 'success' : 'error'"
            variant="subtle"
            class="w-fit"
          >
            {{ item.is_active ? 'Aktiv' : 'Joaktiv' }}
          </UBadge>
          <div class="flex justify-end gap-1">
            <UTooltip text="Ndrysho">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-pencil"
                aria-label="Ndrysho stafin"
                :disabled="!isSuperAdmin"
                @click="openEdit(item)"
              />
            </UTooltip>
            <UTooltip text="Fshi">
              <UButton
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                aria-label="Fshi stafin"
                :disabled="!isSuperAdmin || item.id === currentProfile?.id"
                @click="askDelete(item)"
              />
            </UTooltip>
          </div>
        </article>
      </div>
      <UEmpty
        v-else
        icon="i-lucide-users"
        title="Nuk u gjet staf"
        description="Ndrysho kërkimin ose shto një llogari të re."
        class="py-14"
      />
    </section>

    <UModal
      v-model:open="formOpen"
      :title="selectedProfile ? 'Ndrysho stafin' : 'Shto staf të ri'"
      :description="selectedProfile ? 'Përditëso profilin, rolin ose fjalëkalimin.' : 'Krijo llogarinë Auth dhe profilin e dashboard-it.'"
    >
      <template #body>
        <form
          id="staff-form"
          class="space-y-4"
          @submit.prevent="saveProfile"
        >
          <UFormField
            label="Emri dhe mbiemri"
            required
          >
            <UInput
              v-model="form.full_name"
              autocomplete="name"
              class="w-full"
            />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Email"
              required
            >
              <UInput
                v-model="form.email"
                type="email"
                autocomplete="email"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Telefoni">
              <UInput
                v-model="form.phone"
                type="tel"
                autocomplete="tel"
                class="w-full"
              />
            </UFormField>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Roli"
              required
            >
              <USelect
                v-model="form.role"
                :items="roleOptions"
                value-key="value"
                class="w-full"
              />
            </UFormField>
            <UFormField
              :label="selectedProfile ? 'Fjalëkalim i ri' : 'Fjalëkalimi'"
              :required="!selectedProfile"
              :hint="selectedProfile ? 'Lëre bosh për të mos e ndryshuar' : undefined"
            >
              <UInput
                v-model="form.password"
                type="password"
                autocomplete="new-password"
                class="w-full"
              />
            </UFormField>
          </div>
          <div class="flex items-center justify-between rounded-xl border border-default p-4">
            <div>
              <p class="dashboard-card-title">
                Qasje aktive
              </p>
              <p class="dashboard-meta mt-1">
                Lejo përdoruesin të hyjë në dashboard.
              </p>
            </div>
            <USwitch
              v-model="form.is_active"
              :disabled="selectedProfile?.id === currentProfile?.id"
            />
          </div>
        </form>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            @click="formOpen = false"
          >
            Anulo
          </UButton>
          <UButton
            type="submit"
            form="staff-form"
            :loading="saving"
          >
            {{ selectedProfile ? 'Ruaj ndryshimet' : 'Krijo llogarinë' }}
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="deleteOpen"
      title="Fshi llogarinë"
      description="Ky veprim largon përdoruesin nga Supabase Auth dhe nuk mund të zhbëhet."
    >
      <template #body>
        <p class="text-sm text-muted">
          Jeni i sigurt që dëshironi të fshini <strong class="text-highlighted">{{ profileToDelete?.full_name }}</strong>?
        </p>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            @click="deleteOpen = false"
          >
            Anulo
          </UButton>
          <UButton
            color="error"
            icon="i-lucide-trash-2"
            :loading="saving"
            @click="deleteProfile"
          >
            Fshi përfundimisht
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
