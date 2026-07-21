import type { BookingDraft } from '~/types/booking'

export interface AssistantLaunchPayload {
  booking?: Partial<BookingDraft>
  message?: string
}

export function useAssistantLauncher() {
  function openAssistant(payload: AssistantLaunchPayload = {}) {
    if (!import.meta.client) {
      return
    }

    window.dispatchEvent(new CustomEvent<AssistantLaunchPayload>('diamond-assistant:open', {
      detail: payload
    }))
  }

  return {
    openAssistant
  }
}
