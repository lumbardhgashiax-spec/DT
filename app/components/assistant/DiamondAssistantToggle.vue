<script setup lang="ts">
import DiamondAssistantAvatar from './DiamondAssistantAvatar.vue'
import { useAssistantMotion } from '~/composables/useAssistantMotion'
import { assistantConfig } from '~/config/assistant'

defineProps<{
  bubbleVisible: boolean
}>()

const emit = defineEmits<{
  toggle: []
  dismissBubble: []
}>()

const route = useRoute()
const isBookingPage = computed(() => route.path === '/rezervo')
const { avatarStyle, onPointerMove, resetPointer } = useAssistantMotion()
</script>

<template>
  <div
    v-if="!isBookingPage"
    class="diamond-assistant-toggle-wrap"
  >
    <Transition name="diamond-bubble">
      <div
        v-if="bubbleVisible"
        class="diamond-assistant-bubble"
        role="status"
      >
        <p>{{ assistantConfig.welcomeBubble }}</p>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Mbylle njoftimin"
          @click.stop="emit('dismissBubble')"
        />
      </div>
    </Transition>

    <button
      class="diamond-assistant-toggle"
      type="button"
      aria-label="Hape Diamond Assistant"
      @click="emit('toggle')"
      @pointermove="onPointerMove"
      @pointerleave="resetPointer"
    >
      <span
        class="diamond-assistant-toggle__ring"
        aria-hidden="true"
      />
      <span
        class="diamond-assistant-toggle__avatar"
        :style="avatarStyle"
      >
        <DiamondAssistantAvatar size="toggle" />
      </span>
      <span
        class="diamond-assistant-toggle__status"
        aria-hidden="true"
      />
      <span class="sr-only">Diamond Assistant eshte online</span>
    </button>
  </div>
</template>

<style scoped>
.diamond-assistant-toggle-wrap {
  position: fixed;
  right: max(18px, env(safe-area-inset-right));
  bottom: max(18px, calc(env(safe-area-inset-bottom) + 16px));
  z-index: 999;
  display: grid;
  justify-items: end;
  gap: 12px;
}

.diamond-assistant-toggle {
  position: relative;
  width: clamp(76px, 18vw, 112px);
  height: clamp(76px, 18vw, 112px);
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  transform: translate3d(0, 0, 0);
  transition: transform 180ms ease, filter 180ms ease;
}

.diamond-assistant-toggle:hover {
  transform: translate3d(0, -4px, 0);
  filter: drop-shadow(0 14px 22px rgba(223, 255, 63, 0.24));
}

.diamond-assistant-toggle:focus-visible {
  outline: 3px solid #DFFF3F;
  outline-offset: 4px;
  border-radius: 999px;
}

.diamond-assistant-toggle__ring {
  position: absolute;
  inset: 18%;
  border: 0;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(223, 255, 63, 0.22), rgba(99, 199, 255, 0.12) 46%, transparent 72%);
  filter: blur(8px);
  transform: translateY(18%);
}

.diamond-assistant-toggle__avatar {
  position: absolute;
  inset: -13% -7% -1%;
  display: grid;
  place-items: center;
  transition: transform 120ms ease-out;
}

.diamond-assistant-toggle__status {
  position: absolute;
  right: 13%;
  bottom: 15%;
  width: 14px;
  height: 14px;
  border: 2px solid #F7F8EF;
  border-radius: 999px;
  background: #DFFF3F;
  animation: diamond-status-pulse 2.4s ease-out infinite;
}

.diamond-assistant-bubble {
  width: min(280px, calc(100vw - 116px));
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 12px 12px 14px;
  border: 1px solid rgba(17, 24, 22, 0.12);
  border-radius: 8px;
  background: #FFFFFF;
  color: #111816;
  box-shadow: 0 18px 36px rgba(17, 24, 22, 0.2);
}

.diamond-assistant-bubble p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.35;
}

.diamond-bubble-enter-active,
.diamond-bubble-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.diamond-bubble-enter-from,
.diamond-bubble-leave-to {
  opacity: 0;
  transform: translate3d(8px, 8px, 0) scale(0.96);
}

@keyframes diamond-status-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(223, 255, 63, 0.34);
  }

  50% {
    box-shadow: 0 0 0 7px rgba(223, 255, 63, 0);
  }
}

@media (max-width: 420px) {
  .diamond-assistant-toggle-wrap {
    right: 12px;
    bottom: max(14px, calc(env(safe-area-inset-bottom) + 12px));
  }

  .diamond-assistant-toggle {
    width: 52px;
    height: 52px;
  }

  .diamond-assistant-toggle__avatar {
    inset: -16% -9% 1%;
  }

  .diamond-assistant-bubble {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .diamond-assistant-toggle,
  .diamond-assistant-toggle__avatar,
  .diamond-bubble-enter-active,
  .diamond-bubble-leave-active {
    transition: none;
  }

  .diamond-assistant-toggle__status {
    animation: none;
  }
}
</style>
