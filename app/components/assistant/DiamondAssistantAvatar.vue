<script setup lang="ts">
import DiamondAssistantImageAvatar from './DiamondAssistantImageAvatar.vue'

withDefaults(defineProps<{
  size?: 'toggle' | 'header' | 'panel'
}>(), {
  size: 'toggle'
})
</script>

<template>
  <DiamondAssistantImageAvatar :size="size" />
</template>
