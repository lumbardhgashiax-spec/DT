import type { BookingDraft } from './booking'

export type AssistantRole = 'assistant' | 'user' | 'system'

export type AssistantStatus = 'idle' | 'thinking' | 'error'

export type AssistantQuickActionId
  = | 'availability'
    | 'book-open'
    | 'book-indoor'
    | 'prices'
    | 'contact'

export interface AssistantMessage {
  id: string
  role: AssistantRole
  content: string
  createdAt: string
  status?: AssistantStatus
}

export interface AssistantQuickAction {
  id: AssistantQuickActionId
  label: string
  icon: string
  intent: string
}

export interface AssistantApiRequest {
  sessionId?: string
  message: string
  quickAction?: AssistantQuickActionId
  booking?: BookingDraft
  history?: Pick<AssistantMessage, 'role' | 'content'>[]
}

export interface AssistantApiResponse {
  message: string
  booking?: BookingDraft
  provider: 'openrouter' | 'openai' | 'unavailable'
}

export interface AssistantUiError {
  title: string
  message: string
  retryable: boolean
}
