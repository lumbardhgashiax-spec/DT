<script setup lang="ts">
import type { TableRow } from '~/types/database.types'

interface CourtImage extends TableRow<'court_images'> {
  signedUrl: string
}

interface CourtWithImages extends TableRow<'courts'> {
  images: CourtImage[]
}

definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Fushat | Diamond Tennis Academy', robots: 'noindex, nofollow' })

const dashboardApi = useDashboardApi()
const toast = useToast()
const { canManagePricing, loadProfile } = useDashboardProfile()
await loadProfile()

const modalOpen = ref(false)
const deleteModalOpen = ref(false)
const courtDeleteOpen = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editingId = ref<string | null>(null)
const imageToDelete = ref<CourtImage | null>(null)
const courtToDelete = ref<CourtWithImages | null>(null)
const selectedFiles = ref<File[]>([])
const form = reactive({ name: '', type: 'indoor' as 'indoor' | 'outdoor', latitude: '', longitude: '', isActive: true })

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxFileSize = 8 * 1024 * 1024

const { data: courts, status, error, refresh } = await useAsyncData('court-management', async () => {
  return dashboardApi.listManagedCourts() as Promise<CourtWithImages[]>
})

function openCreate() {
  editingId.value = null
  selectedFiles.value = []
  Object.assign(form, { name: '', type: 'indoor', latitude: '', longitude: '', isActive: true })
  modalOpen.value = true
}

function openEdit(court: CourtWithImages) {
  editingId.value = court.id
  selectedFiles.value = []
  Object.assign(form, { name: court.name, type: court.court_type, latitude: court.latitude?.toString() || '', longitude: court.longitude?.toString() || '', isActive: court.is_active })
  modalOpen.value = true
}

function validateFiles(files: File[]) {
  const invalidType = files.find(file => !allowedTypes.has(file.type))
  if (invalidType) return `“${invalidType.name}” nuk është JPG, PNG ose WebP.`
  const oversized = files.find(file => file.size > maxFileSize)
  if (oversized) return `“${oversized.name}” tejkalon kufirin 8 MB.`
  return null
}

function coordinates() {
  const latitude = form.latitude.trim()
  const longitude = form.longitude.trim()
  if (!latitude && !longitude) return { latitude: null, longitude: null }
  if (!latitude || !longitude) return null

  const parsedLatitude = Number(latitude)
  const parsedLongitude = Number(longitude)
  if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude) || parsedLatitude < -90 || parsedLatitude > 90 || parsedLongitude < -180 || parsedLongitude > 180) return null
  return { latitude: parsedLatitude, longitude: parsedLongitude }
}

function mapsLink(court: CourtWithImages) {
  return court.latitude === null || court.longitude === null
    ? ''
    : `https://www.google.com/maps/search/?api=1&query=${court.latitude},${court.longitude}`
}

async function uploadImages(courtId: string, files: File[]) {
  if (!files.length) return
  await dashboardApi.uploadCourtImages(courtId, files)
}

async function save() {
  if (!canManagePricing.value || saving.value) return
  if (!form.name.trim()) {
    toast.add({ title: 'Shkruaj emrin e fushës', color: 'warning' })
    return
  }
  const location = coordinates()
  if (!location) {
    toast.add({ title: 'Kontrollo koordinatat', description: 'Vendos gjerësinë dhe gjatësinë bashkë, brenda kufijve të vlefshëm.', color: 'warning' })
    return
  }
  const fileError = validateFiles(selectedFiles.value)
  if (fileError) {
    toast.add({ title: 'Fotografi e papranueshme', description: fileError, color: 'warning' })
    return
  }

  saving.value = true
  try {
    const payload = { name: form.name.trim(), court_type: form.type, latitude: location.latitude, longitude: location.longitude, is_active: form.isActive }
    let courtId = editingId.value
    if (courtId) {
      await dashboardApi.updateCourt(courtId, payload)
    } else {
      courtId = (await dashboardApi.createCourt(payload)).id
    }

    await uploadImages(courtId, selectedFiles.value)
    toast.add({ title: editingId.value ? 'Fusha u përditësua' : 'Fusha u shtua', description: selectedFiles.value.length ? `${selectedFiles.value.length} fotografi u ruajtën.` : undefined, color: 'success' })
    modalOpen.value = false
    selectedFiles.value = []
    await refresh()
  } catch (cause) {
    toast.add({ title: 'Ruajtja dështoi', description: cause instanceof Error ? cause.message : 'Kontrollo të dhënat dhe provo përsëri.', color: 'error' })
  } finally {
    saving.value = false
  }
}

function confirmImageDelete(image: CourtImage) {
  imageToDelete.value = image
  courtToDelete.value = null
  deleteModalOpen.value = true
}

async function deleteImage() {
  if (!canManagePricing.value || !imageToDelete.value || deleting.value) return
  deleting.value = true
  const image = imageToDelete.value
  try {
    await dashboardApi.deleteCourtImage(image.court_id, image.id)
    toast.add({ title: 'Fotografia u fshi', color: 'success' })
    deleteModalOpen.value = false
    imageToDelete.value = null
    await refresh()
  } catch (cause) {
    toast.add({ title: 'Fotografia nuk u fshi plotësisht', description: cause instanceof Error ? cause.message : 'Provo përsëri.', color: 'error' })
    await refresh()
  } finally {
    deleting.value = false
  }
}

function confirmCourtDelete(court: CourtWithImages) {
  if (!canManagePricing.value) return
  courtToDelete.value = court
  imageToDelete.value = null
  courtDeleteOpen.value = true
}

async function deleteCourt() {
  if (!canManagePricing.value || !courtToDelete.value || deleting.value) return
  deleting.value = true
  try {
    const result = await dashboardApi.deleteCourt(courtToDelete.value.id)
    toast.add({
      title: 'Fusha u fshi',
      description: result.storageCleanupFailed ? 'Fusha u fshi, por disa fotografi duhen pastruar nga Storage.' : undefined,
      color: result.storageCleanupFailed ? 'warning' : 'success'
    })
    courtDeleteOpen.value = false
    courtToDelete.value = null
    await refresh()
  } catch (cause) {
    toast.add({ title: 'Fusha nuk u fshi', description: cause instanceof Error ? cause.message : 'Provo perseri.', color: 'error' })
  } finally {
    deleting.value = false
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
          Fushat
        </h1>
        <p class="dashboard-page-description">
          Menaxho fushat, disponueshmërinë, ngrohjen dhe galerinë e fotografive.
        </p>
      </div>
      <UButton
        v-if="canManagePricing"
        icon="i-lucide-plus"
        size="lg"
        @click="openCreate"
      >
        Shto fushë
      </UButton>
    </header>

    <UAlert
      v-if="!canManagePricing"
      color="warning"
      variant="subtle"
      icon="i-lucide-shield-alert"
      title="Qasje vetëm për lexim"
      description="Vetëm admin dhe superadmin mund t’i ndryshojnë fushat dhe fotografitë."
    />
    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Fushat nuk u ngarkuan"
      :description="error.message"
    />

    <div
      v-if="status === 'pending'"
      class="grid gap-5 p-3 md:grid-cols-2 sm:p-5 xl:grid-cols-3"
    >
      <USkeleton
        v-for="item in 6"
        :key="item"
        class="h-80 rounded-2xl"
      />
    </div>
    <div
      v-else-if="courts?.length"
      class="grid gap-5 p-3 md:grid-cols-2 sm:p-5 xl:grid-cols-3"
    >
      <article
        v-for="court in courts"
        :key="court.id"
        class="overflow-hidden rounded-2xl border border-default bg-white shadow-xs dark:bg-slate-900"
      >
        <div class="relative aspect-[16/10] bg-muted">
          <img
            v-if="court.images[0]?.signedUrl"
            :src="court.images[0].signedUrl"
            :alt="court.name"
            class="size-full object-cover"
            loading="lazy"
          >
          <div
            v-else
            class="flex size-full flex-col items-center justify-center gap-2 text-muted"
          >
            <UIcon
              name="i-lucide-image"
              class="size-9"
            /><span class="text-sm">Pa fotografi</span>
          </div>
          <UBadge
            class="absolute left-3 top-3"
            :color="court.is_active ? 'success' : 'neutral'"
            variant="solid"
          >
            {{ court.is_active ? 'Aktive' : 'Joaktive' }}
          </UBadge>
          <UBadge
            v-if="court.images.length"
            class="absolute right-3 top-3"
            color="neutral"
            variant="solid"
          >
            <UIcon
              name="i-lucide-images"
              class="mr-1 size-3.5"
            />{{ court.images.length }}
          </UBadge>
        </div>

        <div class="space-y-4 p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="dashboard-card-title">
                {{ court.name }}
              </h2><p class="dashboard-meta mt-1">
                {{ court.court_type === 'indoor' ? 'Fushë e mbyllur' : 'Fushë e hapur' }}
              </p>
            </div>
            <div class="flex items-center gap-1">
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-lucide-pencil"
                aria-label="Ndrysho fushën"
                :disabled="!canManagePricing"
                @click="openEdit(court)"
              />
              <UButton
                color="error"
                variant="ghost"
                size="xs"
                icon="i-lucide-trash-2"
                aria-label="Fshi fushën"
                :disabled="!canManagePricing"
                @click="confirmCourtDelete(court)"
              />
            </div>
          </div>

          <UButton
            v-if="court.latitude !== null && court.longitude !== null"
            :to="mapsLink(court)"
            target="_blank"
            rel="noopener noreferrer"
            color="neutral"
            variant="soft"
            icon="i-lucide-map-pin"
            block
          >
            Hape në hartë
          </UButton>

          <div
            v-if="court.images.length"
            class="grid grid-cols-4 gap-2"
          >
            <div
              v-for="image in court.images"
              :key="image.id"
              class="group relative aspect-square overflow-hidden rounded-lg bg-muted"
            >
              <img
                v-if="image.signedUrl"
                :src="image.signedUrl"
                :alt="image.original_name || court.name"
                class="size-full object-cover"
                loading="lazy"
              >
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="solid"
                size="xs"
                square
                class="absolute right-1 top-1 opacity-100 shadow-sm sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Fshi fotografinë"
                :disabled="!canManagePricing"
                @click="confirmImageDelete(image)"
              />
            </div>
          </div>
        </div>
      </article>
    </div>
    <UEmpty
      v-else
      icon="i-lucide-map-pinned"
      title="Nuk ka fusha"
      description="Shto fushën e parë dhe fotografinë e saj."
      class="rounded-2xl border border-default bg-white py-16 dark:bg-slate-900"
    />

    <UModal
      v-model:open="modalOpen"
      :title="editingId ? 'Ndrysho fushën' : 'Shto fushë'"
      description="Mund të ngarkosh një ose disa fotografi njëkohësisht."
    >
      <template #body>
        <form
          id="court-form"
          class="space-y-5"
          @submit.prevent="save"
        >
          <UFormField
            label="Emri i fushës"
            required
          >
            <UInput
              v-model="form.name"
              maxlength="100"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Lloji"
            required
          >
            <USelect
              v-model="form.type"
              :items="[{ label: 'E mbyllur', value: 'indoor' }, { label: 'E hapur', value: 'outdoor' }]"
              value-key="value"
              class="w-full"
            />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Gjerësia gjeografike (latitude)"
              hint="p.sh. 42.6629"
            >
              <UInput
                v-model="form.latitude"
                type="number"
                min="-90"
                max="90"
                step="0.000001"
                inputmode="decimal"
                placeholder="42.6629"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Gjatësia gjeografike (longitude)"
              hint="p.sh. 21.1655"
            >
              <UInput
                v-model="form.longitude"
                type="number"
                min="-180"
                max="180"
                step="0.000001"
                inputmode="decimal"
                placeholder="21.1655"
                class="w-full"
              />
            </UFormField>
          </div>
          <p class="dashboard-meta -mt-2">
            Të dyja koordinatat janë opsionale, por kur vendosen duhet të plotësohen bashkë.
          </p>
          <div class="space-y-3">
            <USwitch
              v-model="form.isActive"
              label="Aktive"
            />
          </div>
          <UFormField
            label="Fotografitë"
            hint="JPG, PNG ose WebP · maksimumi 8 MB secila"
          >
            <UFileUpload
              v-model="selectedFiles"
              multiple
              accept="image/jpeg,image/png,image/webp"
              label="Zgjidh ose tërhiq fotografitë"
              description="Mund të zgjedhësh më shumë se një fotografi"
              layout="grid"
              class="w-full"
            />
          </UFormField>
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
            form="court-form"
            :loading="saving"
          >
            Ruaj
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="deleteModalOpen"
      title="Fshi fotografinë?"
      description="Fotografia do të largohet përgjithmonë nga galeria dhe storage."
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            @click="deleteModalOpen = false"
          >
            Anulo
          </UButton>
          <UButton
            color="error"
            icon="i-lucide-trash-2"
            :loading="deleting"
            @click="deleteImage"
          >
            Fshi
          </UButton>
        </div>
      </template>
    </UModal>

    <DashboardConfirmActionModal
      v-model:open="courtDeleteOpen"
      title="Fshi fushen?"
      :description="`Fusha '${courtToDelete?.name || ''}' dhe fotografite e saj do te fshihen pergjithmone. Ky veprim nuk mund te kthehet.`"
      confirm-label="Fshi fushen"
      confirm-icon="i-lucide-trash-2"
      :loading="deleting"
      @confirm="deleteCourt"
    />
  </div>
</template>
