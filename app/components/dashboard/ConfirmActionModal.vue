<script setup lang="ts">
withDefaults(defineProps<{
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  confirmIcon?: string
  loading?: boolean
}>(), {
  confirmLabel: 'Konfirmo',
  confirmIcon: 'i-lucide-shield-check',
  loading: false
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
}>()
</script>

<template>
  <UModal
    :open="open"
    :title="title"
    :description="description"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="rounded-xl border border-error/20 bg-error/5 p-4 text-sm text-muted">
        Ky veprim kerkon konfirmim para se te ekzekutohet.
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          :disabled="loading"
          @click="emit('update:open', false)"
        >
          Anulo
        </UButton>
        <UButton
          color="error"
          :icon="confirmIcon"
          :loading="loading"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
