<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { AssistantMessage as AssistantMessageType, AssistantStatus } from '~/types/assistant'
import DiamondAssistantImageAvatar from './DiamondAssistantImageAvatar.vue'
import DiamondAssistantMessage from './DiamondAssistantMessage.vue'

const props = defineProps<{
  messages: AssistantMessageType[]
  status: AssistantStatus
}>()

const listRef = ref<HTMLElement | null>(null)

watch(() => [props.messages.length, props.status], async () => {
  await nextTick()
  listRef.value?.scrollTo({ top: listRef.value.scrollHeight, behavior: 'smooth' })
})
</script>

<template>
  <section
    ref="listRef"
    class="diamond-assistant-messages"
    aria-live="polite"
    aria-label="Biseda me Diamond Concierge"
  >
    <DiamondAssistantMessage
      v-for="message in messages"
      :key="message.id"
      :message="message"
    />

    <div
      v-if="status === 'thinking'"
      class="diamond-assistant-thinking-row"
      role="status"
    >
      <div
        class="diamond-assistant-thinking-row__avatar"
        aria-hidden="true"
      >
        <DiamondAssistantImageAvatar
          size="header"
          :animated="false"
        />
      </div>
      <div class="diamond-assistant-thinking">
        <span />
        <span />
        <span />
      </div>
      <span class="sr-only">Diamond Concierge po pergatit pergjigjen</span>
    </div>
  </section>
</template>

<style scoped>
.diamond-assistant-messages {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  overflow: auto;
  scroll-behavior: smooth;
  background:
    radial-gradient(circle at 8% 0%, rgba(223, 255, 63, 0.12), transparent 34%),
    linear-gradient(180deg, rgba(247, 248, 239, 0.98), rgba(232, 238, 236, 0.96)),
    #F7F8EF;
}

.diamond-assistant-thinking-row {
  display: inline-flex;
  gap: 9px;
  align-items: center;
}

.diamond-assistant-thinking-row__avatar {
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  overflow: visible;
  border: 0;
  border-radius: 999px;
  background: transparent;
  box-shadow: none;
}

.diamond-assistant-thinking-row__avatar :deep(.diamond-avatar) {
  width: 42px;
  height: 42px;
  animation: none;
  transform: translateY(-1px);
}

.diamond-assistant-thinking-row__avatar :deep(.diamond-avatar__glow),
.diamond-assistant-thinking-row__avatar :deep(.diamond-avatar__reflection) {
  display: none;
}

.diamond-assistant-thinking-row__avatar :deep(.diamond-avatar__picture) {
  filter: none;
}

.diamond-assistant-thinking {
  width: max-content;
  display: inline-flex;
  gap: 5px;
  padding: 12px 14px;
  border: 1px solid rgba(10, 108, 81, 0.14);
  border-radius: 18px 18px 18px 7px;
  background: #FFFFFF;
}

.diamond-assistant-thinking span:not(.sr-only) {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #0A6C51;
  animation: diamond-thinking 1.1s ease-in-out infinite;
}

.diamond-assistant-thinking span:nth-child(2) {
  animation-delay: 120ms;
}

.diamond-assistant-thinking span:nth-child(3) {
  animation-delay: 240ms;
}

@keyframes diamond-thinking {
  0%, 80%, 100% {
    opacity: 0.34;
    transform: translateY(0);
  }

  40% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .diamond-assistant-thinking span:not(.sr-only) {
    animation: none;
  }
}
</style>
