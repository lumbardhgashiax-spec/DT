import { computed, nextTick, ref } from 'vue'
import { assistantConfig } from '~/config/assistant'
import type { AssistantApiResponse, AssistantMessage, AssistantQuickActionId, AssistantStatus } from '~/types/assistant'

function createMessage(role: AssistantMessage['role'], content: string, status: AssistantStatus = 'idle'): AssistantMessage {
  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    role,
    content,
    status,
    createdAt: new Date().toISOString()
  }
}

export function useDiamondAssistant() {
  const route = useRoute()
  const isOpen = useState('diamond-assistant:open', () => false)
  const panelLoaded = useState('diamond-assistant:panel-loaded', () => false)
  const status = useState<AssistantStatus>('diamond-assistant:status', () => 'idle')
  const error = useState<string | null>('diamond-assistant:error', () => null)
  const messages = useState<AssistantMessage[]>('diamond-assistant:messages', () => [])
  const sessionId = useState('diamond-assistant:session-id', () => createSessionId())
  const bubbleVisible = ref(false)
  const bubbleDismissed = ref(true)
  let bubbleTimer: ReturnType<typeof setTimeout> | undefined

  const shouldRender = computed(() => {
    if (route.meta?.hideAssistant === true) {
      return false
    }

    return !assistantConfig.excludedRoutePatterns.some(pattern => pattern.test(route.path))
  })

  function loadPanel() {
    panelLoaded.value = true
  }

  function open() {
    loadPanel()
    isOpen.value = true
    bubbleVisible.value = false
  }

  function close() {
    isOpen.value = false
  }

  function startNewSession() {
    sessionId.value = createSessionId()
    messages.value = []
    error.value = null
    status.value = 'idle'
  }

  function toggle() {
    if (isOpen.value) {
      close()
      return
    }

    open()
  }

  function dismissBubble() {
    bubbleVisible.value = false
    bubbleDismissed.value = true

    if (import.meta.client) {
      localStorage.setItem(assistantConfig.storageKeys.bubbleDismissed, new Date().toISOString())
    }
  }

  function initBubble() {
    if (!import.meta.client) {
      return
    }

    const dismissedAt = localStorage.getItem(assistantConfig.storageKeys.bubbleDismissed)
    bubbleDismissed.value = Boolean(dismissedAt)

    if (dismissedAt || window.innerWidth < 380) {
      return
    }

    bubbleTimer = setTimeout(() => {
      if (!isOpen.value) {
        bubbleVisible.value = true
      }
    }, 4200)
  }

  function teardownBubble() {
    if (bubbleTimer) {
      clearTimeout(bubbleTimer)
    }
  }

  async function requestResponse(message: string, quickAction?: AssistantQuickActionId, appendUser = true) {
    const activeSessionId = sessionId.value

    if (appendUser) {
      messages.value.push(createMessage('user', message))
    }

    status.value = 'thinking'
    error.value = null

    try {
      const response = await $fetch<AssistantApiResponse>('/api/assistant/message', {
        method: 'POST',
        body: {
          sessionId: sessionId.value,
          message,
          quickAction,
          history: messages.value
            .slice(0, -1)
            .slice(-16)
            .filter(item => item.status !== 'error')
            .map(item => ({ role: item.role, content: item.content }))
        }
      })

      if (sessionId.value !== activeSessionId) {
        return
      }

      const responseStatus: AssistantStatus = response.provider === 'unavailable' ? 'error' : 'idle'
      messages.value.push(createMessage('assistant', response.message, responseStatus))

      if (response.provider === 'unavailable') {
        error.value = response.message
      }
    } catch {
      if (sessionId.value !== activeSessionId) {
        return
      }

      const maintenanceMessage = 'Per momentin asistenti eshte ne mirembajtje dhe nuk mund te jap pergjigje te sakte. Te lutem provo perseri pas pak.'
      error.value = maintenanceMessage
      messages.value.push(createMessage('assistant', maintenanceMessage, 'error'))
    } finally {
      if (sessionId.value === activeSessionId) {
        status.value = 'idle'
      }
      await nextTick()
    }
  }

  async function sendMessage(content: string, quickAction?: AssistantQuickActionId) {
    const message = content.trim()

    if (!message || status.value === 'thinking') {
      return
    }

    await requestResponse(message, quickAction)
  }

  async function retryLastMessage() {
    if (status.value === 'thinking') {
      return
    }

    const lastUserMessage = [...messages.value].reverse().find(item => item.role === 'user')

    if (!lastUserMessage) {
      return
    }

    const lastMessage = messages.value.at(-1)
    if (lastMessage?.role === 'assistant' && lastMessage.status === 'error') {
      messages.value.pop()
    }

    await requestResponse(lastUserMessage.content, undefined, false)
  }

  return {
    assistantConfig,
    isOpen,
    panelLoaded,
    status,
    error,
    messages,
    shouldRender,
    bubbleVisible,
    bubbleDismissed,
    initBubble,
    teardownBubble,
    dismissBubble,
    loadPanel,
    startNewSession,
    open,
    close,
    toggle,
    sendMessage,
    retryLastMessage
  }
}

function createSessionId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`
}
