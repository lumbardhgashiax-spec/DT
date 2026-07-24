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
    'Asistenti dhe integrimi teknik jane zhvilluar nga Atomx Solutions SHPK.',
    'Diamond Tennis Academy eshte ne Rr. Hajvalia, Hajvali, Prishtine. Orari publik i faqes eshte cdo dite 10:00-22:00.',
    'Faqja publike ofron rezervim pa llogari, fusha aktive sipas disponueshmerise, sherbime shtese opsionale dhe pagese te detyrueshme permes Paysera checkout.',
    `Data e sotme ne akademi eshte ${academyTodayLabel()}. Per data relative si sot/neser, ktheji ne format YYYY-MM-DD para tool call.`,
    'Fol natyrshem, ngrohte dhe si person real ne shqip. Mos u zgjat pa nevoje, por mos tingello robotik.',
    'Qellimi yt kryesor eshte t\'i ndihmosh klientet te gjejne dhe rezervojne termine te lira.',
    'Kur klienti kerkon termin, pyet per daten, preferencen e fushes, oren, kohezgjatjen dhe sherbimet shtese vetem kur mungojne.',
    'Per disponueshmeri, cmime dhe rezervime perdor tools. Mos shpik fusha, ore, cmime, sherbime, politika ose reference rezervimi.',
    'Nese nuk e ke kontrolluar me tool, mos thuaj qe nje termin eshte i lire, mos jep cmim final dhe mos thuaj qe rezervimi u krijua.',
    'Per informata nga webfaqja perdor vetem faktet e dhena ne system prompt ose rezultatet e tools. Nese nje detaj nuk eshte i konfirmuar, thuaj me qetesi qe nuk e ke te konfirmuar dhe ofro ta kontrollosh nese ka tool per ate pune.',
    'Kur jep opsione, thuaj shkurt a eshte periudhe vere/dimer sipas dates dhe sugjero fushe te jashtme/brendshme vetem si ndihme, jo si rregull absolut.',
    'Gjithmone njofto me kujdes qe klienti duhet te sjelle raketen dhe topat e vet, pervec nese stafi konfirmon ndryshe.',
    'Para se te krijosh rezervim, jep permbledhje me fushe, date, ore, kohezgjatje, cmim total, emrin/telefonin dhe pyet qarte: "A e konfirmon rezervimin?".',
    'Krijo rezervim vetem pas konfirmimit te qarte te klientit. Nese mungon konfirmimi, mos e krijo.',
    'Pas krijimit te checkout-it, jep linkun e Paysera-s dhe sqaro qe rezervimi konfirmohet vetem pas pageses. Mos jep reference para pageses; referenca shfaqet ne faqen e konfirmimit pasi pagesa verifikohet.',
    'Mos kerko te dhena sensitive. Per rezervim mjaftojne emri, mbiemri, telefoni dhe email opsional.',
    'Nese nje tool kthen gabim ose nuk ka konfigurim, kerko falje shkurt dhe thuaj qe stafi mund ta konfirmoje.',
    'Mbaje tonin gjithmone te sjellshem, te dashur dhe profesional.'
  ].join(' ')
}

interface AssistantProviderMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_call_id?: string
  name?: string
  tool_calls?: AssistantProviderToolCall[]
}

interface AssistantProviderToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

interface AssistantProviderResponse {
  choices?: Array<{
    message?: {
      role?: 'assistant'
      content?: string | null
      tool_calls?: AssistantProviderToolCall[]
    }
  }>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function providerStatusCode(error: unknown) {
  if (!isRecord(error)) return null
  if (typeof error.statusCode === 'number') return error.statusCode
  if (typeof error.status === 'number') return error.status
  if (isRecord(error.response) && typeof error.response.status === 'number') return error.response.status
  return null
}

function responseProvider(value: unknown): AssistantApiResponse['provider'] {
  return value === 'openrouter' || value === 'openai'
    ? value
    : 'openai-compatible'
}

function normalizedHistory(value: unknown): AssistantProviderMessage[] {
  if (!Array.isArray(value)) return []

  return value
    .slice(-12)
    .map((item): AssistantProviderMessage | null => {
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
    .filter((item): item is AssistantProviderMessage => Boolean(item))
}

function parseToolArguments(value: string) {
  try {
    const parsed: unknown = JSON.parse(value || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function createdBookingMessage(result: unknown) {
  if (!isRecord(result) || result.ok !== true || !isRecord(result.confirmation)) return null

  const confirmation = result.confirmation
  const bookingReference = typeof confirmation.bookingReference === 'string'
    ? confirmation.bookingReference
    : typeof confirmation.reference === 'string'
      ? confirmation.reference
      : ''
  const courtName = typeof confirmation.courtName === 'string' ? confirmation.courtName : 'fusha e zgjedhur'
  const date = typeof confirmation.date === 'string' ? confirmation.date : ''
  const time = typeof confirmation.time === 'string' ? confirmation.time : ''
  const endTime = typeof confirmation.endTime === 'string' ? confirmation.endTime : ''
  const totalPrice = Number(confirmation.totalPrice)
  const priceText = Number.isFinite(totalPrice) ? `${totalPrice.toFixed(2)} EUR` : 'sipas cmimit te konfirmuar'
  const checkoutUrl = typeof confirmation.checkoutUrl === 'string' ? confirmation.checkoutUrl : ''
  const paymentStatus = typeof confirmation.paymentStatus === 'string' ? confirmation.paymentStatus : ''
  const usesOnlinePayment = paymentStatus === 'pending' && Boolean(checkoutUrl)

  const lines = [
    usesOnlinePayment
      ? 'Termini u mbajt perkohesisht per ty, por ende nuk eshte konfirmuar.'
      : 'Rezervimi u krijua me sukses.',
    '',
    `Fusha: ${courtName}`,
    `Termini: ${date}${time ? `, ${time}${endTime ? ` - ${endTime}` : ''}` : ''}`,
    `Totali: ${priceText}`,
    ''
  ]

  if (usesOnlinePayment) {
    lines.push(
      `Perfundo pagesen ne Paysera: ${checkoutUrl}`,
      '',
      'Rezervimi konfirmohet automatikisht pas pageses. Referenca do te shfaqet ne faqen e konfirmimit; tregoja stafit administrativ kur te arrish. Mos harro: raketen dhe topat duhet t\'i sillni vete, pervec nese stafi ju konfirmon ndryshe.'
    )
  } else {
    if (bookingReference) lines.splice(2, 0, `Referenca: ${bookingReference}`)
    lines.push('Kete reference tregoja stafit administrativ kur te arrish. Mos harro: raketen dhe topat duhet t\'i sillni vete, pervec nese stafi ju konfirmon ndryshe.')
  }

  return lines.join('\n')
}

function assistantChatCompletionsUrl(config: ReturnType<typeof useRuntimeConfig>) {
  const baseUrl = String(config.assistantBaseUrl || '').trim().replace(/\/+$/, '')
  if (!baseUrl) return ''

  if (baseUrl.endsWith('/chat/completions')) return baseUrl
  if (baseUrl.endsWith('/v1')) return `${baseUrl}/chat/completions`
  return `${baseUrl}/v1/chat/completions`
}

async function requestAssistantProvider(
  config: ReturnType<typeof useRuntimeConfig>,
  messages: AssistantProviderMessage[]
) {
  const url = assistantChatCompletionsUrl(config)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (config.assistantApiKey) {
    headers.Authorization = `Bearer ${config.assistantApiKey}`
  }

  return $fetch<AssistantProviderResponse>(url, {
    method: 'POST',
    timeout: 45_000,
    headers,
    body: {
      model: config.assistantModel,
      messages,
      tools: assistantBookingTools(),
      tool_choice: 'auto',
      temperature: 0.45,
      max_tokens: 700
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
      message: 'Shkruaj nje mesazh te shkurter.'
    })
  }

  if (!assistantChatCompletionsUrl(config) || !config.assistantModel) {
    return {
      provider: 'unavailable',
      message: maintenanceMessage
    }
  }

  try {
    const conversationHistory = normalizedHistory(body.history)
    const messages: AssistantProviderMessage[] = [
      { role: 'system', content: assistantSystemPrompt() },
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    for (let round = 0; round < 6; round += 1) {
      const response = await requestAssistantProvider(config, messages)
      const assistantMessage = response.choices?.[0]?.message
      if (!assistantMessage) throw new Error('Assistant provider returned an empty response.')

      const toolCalls = assistantMessage.tool_calls || []
      if (!toolCalls.length) {
        const content = assistantMessage.content?.trim()
        if (!content) throw new Error('Assistant provider returned an empty response.')

        return {
          provider: responseProvider(config.assistantProvider),
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
        const createdMessage = toolCall.function.name === 'create_booking' ? createdBookingMessage(result) : null

        if (createdMessage) {
          return {
            provider: responseProvider(config.assistantProvider),
            message: createdMessage
          }
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: JSON.stringify(result)
        })
      }
    }

    throw new Error('Assistant provider used too many tool rounds.')
  } catch (error) {
    const statusCode = providerStatusCode(error)
    if (statusCode && [401, 402, 403, 429].includes(statusCode)) {
      console.warn(`[assistant] provider unavailable: OpenAI-compatible provider returned ${statusCode}`)
    } else {
      console.error('[assistant] message failed:', error)
    }

    return {
      provider: 'unavailable',
      message: maintenanceMessage
    }
  }
})
