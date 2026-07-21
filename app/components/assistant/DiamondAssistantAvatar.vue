<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { assistantConfig } from '~/config/assistant'
import DiamondAssistantImageAvatar from './DiamondAssistantImageAvatar.vue'
import DiamondAssistantModelAvatar from './DiamondAssistantModelAvatar.client.vue'

withDefaults(defineProps<{
  size?: 'toggle' | 'header' | 'panel'
}>(), {
  size: 'toggle'
})

const modelAvailable = ref(false)

onMounted(async () => {
  try {
    const response = await $fetch<{ available: boolean }>('/api/assistant/model-available')
    modelAvailable.value = response.available
  } catch {
    modelAvailable.value = false
  }
})
</script>

<template>
  <ClientOnly>
    <DiamondAssistantModelAvatar
      v-if="modelAvailable"
      :size="size"
      :model-path="assistantConfig.modelPath"
    />
    <DiamondAssistantImageAvatar
      v-else
      :size="size"
    />
    <template #fallback>
      <DiamondAssistantImageAvatar :size="size" />
    </template>
  </ClientOnly>
</template>
