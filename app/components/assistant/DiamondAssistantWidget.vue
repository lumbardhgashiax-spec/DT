<script setup lang="ts">
import { defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDiamondAssistant } from '~/composables/useDiamondAssistant'
import type { AssistantLaunchPayload } from '~/composables/useAssistantLauncher'
import DiamondAssistantToggle from './DiamondAssistantToggle.vue'

const DiamondAssistantPanel = defineAsyncComponent(() => import('./DiamondAssistantPanel.vue'))
const assistant = useDiamondAssistant()
const toggleWrapRef = ref<HTMLElement | null>(null)
let idleHandle: number | undefined

function openAssistant() {
  assistant.open()
}

function closeAssistant() {
  assistant.close()
}

function restoreToggleFocus() {
  nextTick(() => {
    toggleWrapRef.value?.querySelector<HTMLButtonElement>('button')?.focus()
  })
}

function handleAssistantOpen(event: Event) {
  const payload = (event as CustomEvent<AssistantLaunchPayload>).detail

  assistant.open()

  if (payload?.message) {
    assistant.sendMessage(payload.message)
  }
}

onMounted(() => {
  assistant.initBubble()
  window.addEventListener('diamond-assistant:open', handleAssistantOpen)

  const idle = window.requestIdleCallback ?? ((callback: IdleRequestCallback) => window.setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 1 }), 2400))
  idleHandle = idle(() => assistant.loadPanel(), { timeout: 5200 })
})

onBeforeUnmount(() => {
  assistant.teardownBubble()
  window.removeEventListener('diamond-assistant:open', handleAssistantOpen)

  if (idleHandle && window.cancelIdleCallback) {
    window.cancelIdleCallback(idleHandle)
  }
})

watch(() => assistant.isOpen.value, (open) => {
  if (!open) {
    restoreToggleFocus()
  }
})

watch(() => assistant.shouldRender.value, (shouldRender) => {
  if (!shouldRender) {
    closeAssistant()
  }
})
</script>

<template>
  <div v-if="assistant.shouldRender.value">
    <div ref="toggleWrapRef">
      <DiamondAssistantToggle
        :bubble-visible="assistant.bubbleVisible.value"
        @toggle="openAssistant"
        @dismiss-bubble="assistant.dismissBubble"
      />
    </div>

    <component
      :is="DiamondAssistantPanel"
      v-if="assistant.isOpen.value && assistant.panelLoaded.value"
      @close="restoreToggleFocus"
    />
  </div>
</template>
