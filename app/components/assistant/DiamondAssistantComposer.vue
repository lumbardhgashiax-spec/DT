<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { AssistantStatus } from '~/types/assistant'

const props = defineProps<{
  status: AssistantStatus
  error: string | null
}>()

const emit = defineEmits<{
  send: [message: string]
  retry: []
}>()

const message = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const hasText = computed(() => message.value.trim().length > 0)

function resize() {
  const textarea = textareaRef.value

  if (!textarea) {
    return
  }

  textarea.style.height = '0'
  textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`
}

function send() {
  if (!hasText.value || props.status === 'thinking') {
    return
  }

  emit('send', message.value)
  message.value = ''
  nextTick(resize)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    send()
  }
}

watch(message, () => nextTick(resize))
</script>

<template>
  <footer class="diamond-assistant-composer">
    <div
      v-if="error"
      class="diamond-assistant-composer__error"
      role="alert"
    >
      <UIcon
        name="i-lucide-triangle-alert"
        aria-hidden="true"
      />
      <span>{{ error }}</span>
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-rotate-ccw"
        aria-label="Provo perseri"
        @click="emit('retry')"
      />
    </div>

    <div class="diamond-assistant-composer__box">
      <textarea
        ref="textareaRef"
        v-model="message"
        rows="1"
        placeholder="Shkruaj per rezervim, fusha ose lokacion..."
        aria-label="Mesazhi per Diamond Concierge"
        :disabled="status === 'thinking'"
        @keydown="onKeydown"
      />
      <UButton
        icon="i-lucide-send-horizontal"
        color="primary"
        :variant="hasText ? 'solid' : 'subtle'"
        aria-label="Dergo mesazhin"
        :loading="status === 'thinking'"
        :disabled="!hasText || status === 'thinking'"
        @click="send"
      />
    </div>
  </footer>
</template>

<style scoped>
.diamond-assistant-composer {
  position: sticky;
  bottom: 0;
  display: grid;
  gap: 8px;
  padding: 14px 16px calc(14px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), #FFFFFF);
}

.diamond-assistant-composer__box {
  display: grid;
  grid-template-columns: 1fr 46px;
  align-items: end;
  gap: 8px;
  padding: 7px 7px 7px 14px;
  border: 1px solid rgba(7, 17, 15, 0.14);
  border-radius: 18px;
  background: #F5F7F1;
  box-shadow: 0 14px 34px rgba(17, 24, 22, 0.08);
}

.diamond-assistant-composer__box textarea {
  width: 100%;
  max-height: 132px;
  min-height: 38px;
  resize: none;
  border: 0;
  outline: 0;
  padding: 9px 2px;
  background: transparent;
  color: #061735;
  font-size: 0.94rem;
  line-height: 1.4;
}

.diamond-assistant-composer__box textarea::placeholder {
  color: rgba(6, 23, 53, 0.52);
}

.diamond-assistant-composer__error {
  display: grid;
  grid-template-columns: 18px 1fr 32px;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  background: #FFF7ED;
  color: #7C2D12;
  font-size: 0.82rem;
}
</style>
