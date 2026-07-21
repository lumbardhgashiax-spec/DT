<script setup lang="ts">
import { computed } from 'vue'
import { assistantConfig } from '~/config/assistant'

const props = withDefaults(defineProps<{
  size?: 'toggle' | 'header' | 'panel'
  animated?: boolean
}>(), {
  size: 'toggle',
  animated: true
})

const imageSize = computed(() => {
  if (props.size === 'header') {
    return 92
  }

  if (props.size === 'panel') {
    return 160
  }

  return 132
})
</script>

<template>
  <div
    class="diamond-avatar"
    :class="[`diamond-avatar--${size}`, { 'diamond-avatar--animated': animated }]"
    :style="{ '--avatar-size': `${imageSize}px` }"
  >
    <span
      class="diamond-avatar__glow"
      aria-hidden="true"
    />
    <picture class="diamond-avatar__picture">
      <source
        :srcset="assistantConfig.assets.mobile"
        media="(max-width: 640px)"
        type="image/webp"
      >
      <img
        class="diamond-avatar__image"
        :src="assistantConfig.assets.desktop"
        :width="imageSize"
        :height="imageSize"
        alt="Diamond Concierge"
        loading="lazy"
        decoding="async"
      >
    </picture>
    <span
      class="diamond-avatar__reflection"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.diamond-avatar {
  --avatar-size: 132px;
  position: relative;
  width: var(--avatar-size);
  height: var(--avatar-size);
  display: grid;
  place-items: center;
  transform-style: preserve-3d;
  will-change: transform;
}

.diamond-avatar__glow {
  position: absolute;
  inset: 11%;
  border-radius: 999px;
  background: radial-gradient(circle at 50% 78%, rgba(99, 199, 255, 0.58), rgba(99, 199, 255, 0.1) 42%, transparent 69%);
  filter: blur(10px);
  transform: translate3d(0, 16%, -10px);
}

.diamond-avatar__picture {
  position: relative;
  width: 100%;
  height: 100%;
  display: block;
  filter: drop-shadow(0 20px 22px rgba(3, 12, 28, 0.32));
}

.diamond-avatar__image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

.diamond-avatar__reflection {
  position: absolute;
  inset: 13% 17% auto auto;
  width: 24%;
  height: 32%;
  border-radius: 999px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0));
  mix-blend-mode: screen;
  pointer-events: none;
}

.diamond-avatar--toggle {
  width: clamp(76px, 18vw, 132px);
  height: clamp(76px, 18vw, 132px);
}

.diamond-avatar--header {
  width: 72px;
  height: 72px;
}

.diamond-avatar--panel {
  width: 156px;
  height: 156px;
}

.diamond-avatar--animated {
  animation: diamond-assistant-float 4.8s ease-in-out infinite;
}

@keyframes diamond-assistant-float {
  0%, 100% {
    transform: translate3d(0, 0, 0);
  }

  50% {
    transform: translate3d(0, -7px, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .diamond-avatar--animated {
    animation: none;
  }
}
</style>
