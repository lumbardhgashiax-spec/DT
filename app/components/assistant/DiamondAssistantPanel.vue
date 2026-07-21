<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useDiamondAssistant } from '~/composables/useDiamondAssistant'
import DiamondAssistantComposer from './DiamondAssistantComposer.vue'
import DiamondAssistantHeader from './DiamondAssistantHeader.vue'
import DiamondAssistantMessages from './DiamondAssistantMessages.vue'
import DiamondAssistantTennisIntro from './DiamondAssistantTennisIntro.vue'

const emit = defineEmits<{
  close: []
}>()

const assistant = useDiamondAssistant()
const panelRef = ref<HTMLElement | null>(null)
const hasConversation = computed(() => assistant.messages.value.length > 0 || assistant.status.value === 'thinking')
let previousOverflow = ''

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

function closePanel() {
  assistant.close()
  emit('close')
}

function trapFocus(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closePanel()
    return
  }

  if (event.key !== 'Tab') {
    return
  }

  const focusable = Array.from(panelRef.value?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])

  if (!focusable.length) {
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}

onMounted(async () => {
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', trapFocus)

  await nextTick()
  panelRef.value?.querySelector<HTMLElement>(focusableSelector)?.focus()
})

onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow
  document.removeEventListener('keydown', trapFocus)
})
</script>

<template>
  <Teleport to="body">
    <div class="diamond-assistant-layer">
      <button
        class="diamond-assistant-backdrop"
        type="button"
        aria-label="Mbylle Diamond Assistant"
        @click="closePanel"
      />
      <aside
        ref="panelRef"
        class="diamond-assistant-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="diamond-assistant-title"
      >
        <span
          id="diamond-assistant-title"
          class="sr-only"
        >Diamond Assistant</span>
        <DiamondAssistantHeader
          @close="closePanel"
          @new-session="assistant.startNewSession"
        />

        <div
          class="diamond-assistant-panel__body"
          :class="{ 'is-chatting': hasConversation }"
        >
          <DiamondAssistantTennisIntro v-if="!hasConversation" />
          <DiamondAssistantMessages
            v-if="hasConversation"
            :messages="assistant.messages.value"
            :status="assistant.status.value"
          />
        </div>

        <DiamondAssistantComposer
          :status="assistant.status.value"
          :error="assistant.error.value"
          @send="assistant.sendMessage"
          @retry="assistant.retryLastMessage"
        />
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.diamond-assistant-layer {
  position: fixed;
  inset: 0;
  z-index: 80;
  pointer-events: none;
  animation: diamond-panel-layer-in 190ms ease both;
}

.diamond-assistant-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background:
    radial-gradient(circle at 72% 82%, rgba(223, 255, 63, 0.16), transparent 28%),
    rgba(8, 15, 14, 0.38);
  backdrop-filter: blur(8px);
  pointer-events: auto;
}

.diamond-assistant-panel {
  position: absolute;
  right: 18px;
  bottom: 18px;
  width: min(520px, calc(100vw - 36px));
  height: min(820px, calc(100dvh - 36px));
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 24px;
  background: #07110F;
  box-shadow: 0 32px 110px rgba(3, 8, 7, 0.46);
  pointer-events: auto;
  animation: diamond-panel-in 230ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.diamond-assistant-panel__body {
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  overflow: hidden;
  background: #07110F;
}

.diamond-assistant-panel__body.is-chatting {
  background:
    radial-gradient(circle at 10% 0%, rgba(223, 255, 63, 0.12), transparent 32%),
    linear-gradient(180deg, #F7F8EF, #EEF4EF);
}

@media (max-width: 640px) {
  .diamond-assistant-backdrop {
    background: rgba(17, 24, 22, 0.28);
  }

  .diamond-assistant-panel {
    inset: auto 0 0 0;
    width: 100%;
    height: min(94dvh, 860px);
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 24px 24px 0 0;
  }
}

@keyframes diamond-panel-layer-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes diamond-panel-in {
  from {
    opacity: 0;
    transform: translate3d(18px, 16px, 0) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@media (max-width: 640px) {
  @keyframes diamond-panel-in {
    from {
      opacity: 0;
      transform: translate3d(0, 36px, 0);
    }

    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .diamond-assistant-layer,
  .diamond-assistant-panel {
    animation: none;
  }
}
</style>
