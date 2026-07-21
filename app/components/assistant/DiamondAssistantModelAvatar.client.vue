<script setup lang="ts">
import DiamondAssistantImageAvatar from './DiamondAssistantImageAvatar.vue'

withDefaults(defineProps<{
  size?: 'toggle' | 'header' | 'panel'
  modelPath?: string
}>(), {
  size: 'toggle',
  modelPath: '/models/diamond-assistant.glb'
})
</script>

<template>
  <DiamondAssistantImageAvatar :size="size" />
</template>
