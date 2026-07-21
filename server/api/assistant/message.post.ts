import type { AssistantApiResponse } from '~/types/assistant'
import {
  assistantBookingTools,
  executeAssistantBookingTool
} from '../../utils/assistantBookingTools'

const maintenanceMessage = 'Per momentin asistenti eshte ne mirembajtje dhe nuk mund te jap pergjigje te sakte. Te lutem provo perseri pas pak.'

function academyTodayLabel() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Belgrade',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

function assistantSystemPrompt() {
  return [
    'Je Diamond Concierge, asistenti zyrtar i Diamond Tennis Academy.',
    `Data e sotme ne akademi eshte ${academyTodayLabel()}. Per data relative si sot/neser, ktheji ne format YYYY-MM-DD para tool call.`,
    'Fol natyrshem, ngrohte dhe si person real ne shqip. Mos u zgjat pa nevoje, por mos tingello robotik.',
    'Qellimi yt kryesor eshte t\'i ndihmosh klientet te gjejne dhe rezervojne termine te lira.',
    'Kur klienti kerkon termin, pyet per daten, preferencen e fushes, oren, kohezgjatjen dhe sherbimet shtese vetem kur mungojne.',
    'Per disponueshmeri perdor tools. Mos shpik fusha, ore, cmime ose reference rezervimi.',
    'Kur jep opsione, thuaj shkurt a eshte periudhe vere/dimer sipas dates dhe sugjero fushe te jashtme/brendshme vetem si ndihme, jo si rregull absolut.',
    'Gjithmone njofto me kujdes qe klienti duhet te sjelle raketen dhe topat e vet, pervec nese stafi konfirmon ndryshe.',
    'Para se te krijosh rezervim, jep permbledhje me fushe, date, ore, kohezgjatje, cmim total, emrin/telefonin dhe pyet qarte: "A e konfirmon rezervimin?".',
    'Krijo rezervim vetem pas konfirmimit te qarte te klientit. Nese mungon konfirmimi, mos e krijo.',
    'Pas krijimit te rezervimit, kthe bookingReference/reference dhe thuaj qe kete duhet t\'ia tregoje stafit administrativ kur te arrije.',
    'Mos kerko te dhena sensitive. Per rezervim mjaftojne emri, mbiemri, telefoni dhe email opsional.',
    'Nese nje tool kthen gabim ose nuk ka konfigurim, kerko falje shkurt dhe thuaj qe stafi mund ta konfirmoje.'
  ].join(' ')
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_call_id?: string
  name?: string
  tool_calls?: OpenRouterToolCall[]
}

interface OpenRouterToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      role?: 'assistant'
      content?: string | null
      tool_calls?: OpenRouterToolCall[]
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

function parseToolArguments(value: string) {
  try {
    const parsed: unknown = JSON.parse(value || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function requestOpenRouter(
  config: ReturnType<typeof useRuntimeConfig>,
  messages: OpenRouterMessage[]
) {
  return $fetch<OpenRouterResponse>('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    timeout: 25_000,
    headers: {
      'Authorization': `Bearer ${config.openRouterApiKey}`,
      'HTTP-Referer': config.openRouterSiteUrl || 'https://diamondtennisacademy.com',
      'X-Title': config.openRouterSiteName || 'Diamond Tennis Academy',
      'X-OpenRouter-Title': config.openRouterSiteName || 'Diamond Tennis Academy',
      'Content-Type': 'application/json'
    },
    body: {
      model: config.openRouterModel,
      messages,
      tools: assistantBookingTools(),
      tool_choice: 'auto',
      temperature: 0.55,
      max_tokens: 650
    }
  })
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
    const conversationHistory = normalizedHistory(body.history)
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: assistantSystemPrompt() },
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    for (let round = 0; round < 4; round += 1) {
      const response = await requestOpenRouter(config, messages)
      const assistantMessage = response.choices?.[0]?.message
      if (!assistantMessage) throw new Error('OpenRouter returned an empty response.')

      const toolCalls = assistantMessage.tool_calls || []
      if (!toolCalls.length) {
        const content = assistantMessage.content?.trim()
        if (!content) throw new Error('OpenRouter returned an empty response.')

        return {
          provider: 'openrouter',
          message: content
        }
      }

      messages.push({
        role: 'assistant',
        content: assistantMessage.content || null,
        tool_calls: toolCalls
      })

      for (const toolCall of toolCalls.slice(0, 4)) {
        const result = await executeAssistantBookingTool(event, {
          name: toolCall.function.name,
          arguments: parseToolArguments(toolCall.function.arguments)
        }, message, conversationHistory)

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: JSON.stringify(result)
        })
      }
    }

    throw new Error('OpenRouter used too many tool rounds.')
  } catch {
    return {
      provider: 'unavailable',
      message: maintenanceMessage
    }
  }
})
