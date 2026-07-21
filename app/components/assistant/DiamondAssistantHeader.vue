<script setup lang="ts">
import DiamondAssistantAvatar from './DiamondAssistantAvatar.vue'

const { data: providerStatus } = useFetch<{ available: boolean }>('/api/assistant/status')
const isAvailable = computed(() => providerStatus.value?.available === true)

const emit = defineEmits<{
  close: []
  newSession: []
}>()
</script>

<template>
  <header class="diamond-assistant-header">
    <div
      class="diamond-assistant-header__light"
      aria-hidden="true"
    />
    <DiamondAssistantAvatar size="header" />
    <div class="diamond-assistant-header__copy">
      <p class="diamond-assistant-header__title">
        Diamond Concierge
      </p>
      <div
        class="diamond-assistant-header__status"
        :class="{ 'is-unavailable': !isAvailable }"
      >
        <span aria-hidden="true" />
        <strong>{{ isAvailable ? 'Online' : 'Ne mirembajtje' }}</strong>
      </div>
      <p class="diamond-assistant-header__subtitle">
        Diamond Tennis Academy
      </p>
    </div>
    <div class="diamond-assistant-header__actions">
      <UButton
        class="diamond-assistant-header__new"
        icon="i-lucide-rotate-ccw"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="Fillo session te ri"
        title="Fillo session te ri"
        @click="emit('newSession')"
      />
      <UButton
        class="diamond-assistant-header__close"
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="lg"
        aria-label="Mbylle Diamond Concierge"
        @click="emit('close')"
      />
    </div>
  </header>
</template>

<style scoped>
.diamond-assistant-header {
  position: relative;
  display: grid;
  grid-template-columns: 72px 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 18px 18px 16px;
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background:
    radial-gradient(circle at 20% 0%, rgba(223, 255, 63, 0.16), transparent 36%),
    linear-gradient(135deg, #07110F, #0A5C49);
  color: #F7F8EF;
}

.diamond-assistant-header__light {
  position: absolute;
  inset: auto 18% -42% 28%;
  height: 150px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(223, 255, 63, 0.22), transparent 66%);
  pointer-events: none;
}

.diamond-assistant-header__copy {
  position: relative;
  min-width: 0;
}

.diamond-assistant-header__title {
  margin: 0;
  color: #FFFFFF;
  font-size: 1.02rem;
  font-weight: 900;
  line-height: 1.2;
}

.diamond-assistant-header__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  color: #DFFF3F;
  font-size: 0.78rem;
}

.diamond-assistant-header__status span {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #DFFF3F;
}

.diamond-assistant-header__status.is-unavailable {
  color: rgba(247, 246, 241, 0.66);
}

.diamond-assistant-header__status.is-unavailable span {
  background: #F59E0B;
}

.diamond-assistant-header__subtitle {
  margin: 4px 0 0;
  color: rgba(247, 246, 241, 0.74);
  font-size: 0.8rem;
  line-height: 1.3;
}

.diamond-assistant-header__actions {
  position: relative;
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.diamond-assistant-header__new,
.diamond-assistant-header__close {
  position: relative;
  color: #F7F6F1;
}

@media (max-width: 420px) {
  .diamond-assistant-header {
    grid-template-columns: 62px 1fr auto;
    gap: 10px;
    padding: 14px;
  }
}
</style>
