<script setup lang="ts">
import type { AssistantMessage } from '~/types/assistant'
import DiamondAssistantImageAvatar from './DiamondAssistantImageAvatar.vue'

const props = defineProps<{
  message: AssistantMessage
}>()

const checkoutUrl = computed(() => props.message.content.match(
  /https:\/\/api\.paysera\.com\/checkout-payment-link\/payment-collection\/v1\/payment-links\/[A-Za-z0-9_-]+/
)?.[0] || '')
const messageParts = computed(() => checkoutUrl.value
  ? props.message.content.split(checkoutUrl.value)
  : [props.message.content])
</script>

<template>
  <article
    class="diamond-assistant-message"
    :class="`diamond-assistant-message--${message.role}`"
  >
    <div
      class="diamond-assistant-message__avatar"
      aria-hidden="true"
    >
      <DiamondAssistantImageAvatar
        v-if="message.role === 'assistant'"
        size="header"
        :animated="false"
      />
      <UIcon
        v-else
        name="i-lucide-user-round"
      />
    </div>
    <div class="diamond-assistant-message__bubble">
      <UIcon
        v-if="message.status === 'error'"
        name="i-lucide-circle-alert"
        class="diamond-assistant-message__icon"
        aria-hidden="true"
      />
      <p>
        {{ messageParts[0] }}
        <a
          v-if="checkoutUrl"
          :href="checkoutUrl"
          target="_blank"
          rel="noopener noreferrer"
        >Hap pagesen ne Paysera</a>
        {{ messageParts[1] || '' }}
      </p>
    </div>
  </article>
</template>

<style scoped>
.diamond-assistant-message {
  display: flex;
  gap: 9px;
  align-items: center;
}

.diamond-assistant-message--assistant {
  justify-content: flex-start;
}

.diamond-assistant-message--user {
  flex-direction: row-reverse;
  justify-content: flex-start;
}

.diamond-assistant-message__avatar {
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

.diamond-assistant-message--user .diamond-assistant-message__avatar {
  background: #07110F;
  color: #DFFF3F;
  box-shadow: 0 12px 24px rgba(7, 17, 15, 0.18);
}

.diamond-assistant-message__avatar :deep(.diamond-avatar) {
  width: 42px;
  height: 42px;
  animation: none;
  transform: translateY(-1px);
}

.diamond-assistant-message__avatar :deep(.diamond-avatar__glow),
.diamond-assistant-message__avatar :deep(.diamond-avatar__reflection) {
  display: none;
}

.diamond-assistant-message__avatar :deep(.diamond-avatar__picture) {
  filter: none;
}

.diamond-assistant-message__avatar svg {
  width: 18px;
  height: 18px;
}

.diamond-assistant-message__bubble {
  max-width: min(78%, 340px);
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 18px 18px 18px 7px;
  font-size: 0.93rem;
  line-height: 1.5;
  box-shadow: 0 14px 34px rgba(17, 24, 22, 0.08);
}

.diamond-assistant-message--assistant .diamond-assistant-message__bubble {
  border: 1px solid rgba(10, 108, 81, 0.12);
  background: #FFFFFF;
  color: #061735;
}

.diamond-assistant-message--user .diamond-assistant-message__bubble {
  border-radius: 18px 18px 7px 18px;
  background: #07110F;
  color: #FFFFFF;
}

.diamond-assistant-message__bubble p {
  margin: 0;
  white-space: pre-wrap;
}

.diamond-assistant-message__bubble a {
  color: #087A5B;
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.diamond-assistant-message__icon {
  flex: 0 0 auto;
  margin-top: 2px;
  color: #B45309;
}
</style>
