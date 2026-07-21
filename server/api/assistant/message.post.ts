import type { AssistantApiResponse } from '~/types/assistant'

const maintenanceMessage = 'Per momentin asistenti eshte ne mirembajtje dhe nuk mund te jap pergjigje te sakte. Te lutem provo perseri pas pak.'
const assistantSystemPrompt = [
  'Je Diamond Concierge, asistenti zyrtar i Diamond Tennis Academy.',
  'Pergjigju shkurt, qarte dhe ne shqip.',
  'Ndihmo per rezervime, fusha, orare, cmime, lokacion dhe pyetje rreth akademise.',
  'Mos pretendo se ke krijuar rezervim nga chat-i. Per rezervim drejto perdoruesin te faqja /rezervo.',
  'Mos kerko te dhena sensitive pervec informacionit normal qe duhet per rezervim.',
  'Nese nuk je i sigurt per nje detaj operativ, thuaj qe stafi mund ta konfirmoje.'
].join(' ')

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

function normalizedHistory(value: unknown): OpenRouterMessage[] {
  if (!Array.isArray(value)) return []

  return value
    .slice(-12)
    .map((item): OpenRouterMessage | null => {
      if (!item || typeof item !== 'object') return null
      const role = 'role' in item ? item.role : undefined
      const content = 'content' in item && typeof item.content === 'string'
        ? item.content.trim()
        : ''

      if ((role !== 'user' && role !== 'assistant') || !content || content.length > 1200) {
        return null
      }

      return { role, content }
    })
    .filter((item): item is OpenRouterMessage => Boolean(item))
}

export default defineEventHandler(async (event): Promise<AssistantApiResponse> => {
  const config = useRuntimeConfig(event)
  const body = await readBody<{ message?: unknown, history?: unknown }>(event)
  const message = typeof body?.message === 'string' ? body.message.trim() : ''

  if (!message || message.length > 1000) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Shkruaj nje mesazh te shkurter.'
    })
  }

  if (!config.openRouterApiKey) {
    return {
      provider: 'unavailable',
      message: maintenanceMessage
    }
  }

  try {
    const response = await $fetch<OpenRouterResponse>('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      timeout: 20_000,
      headers: {
        'Authorization': `Bearer ${config.openRouterApiKey}`,
        'HTTP-Referer': config.openRouterSiteUrl || 'https://diamondtennisacademy.com',
        'X-Title': config.openRouterSiteName || 'Diamond Tennis Academy',
        'Content-Type': 'application/json'
      },
      body: {
        model: config.openRouterModel,
        messages: [
          { role: 'system', content: assistantSystemPrompt },
          ...normalizedHistory(body.history),
          { role: 'user', content: message }
        ],
        temperature: 0.4,
        max_tokens: 450
      }
    })

    const content = response.choices?.[0]?.message?.content?.trim()
    if (!content) throw new Error('OpenRouter returned an empty response.')

    return {
      provider: 'openrouter',
      message: content
    }
  } catch {
    return {
      provider: 'unavailable',
      message: maintenanceMessage
    }
  }
})
