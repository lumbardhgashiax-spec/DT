import type { H3Event } from 'h3'
import { randomUUID } from 'node:crypto'
import {
  ACADEMY_TIME_ZONE,
  PUBLIC_CLOSING_HOUR,
  PUBLIC_DURATION_MINUTES,
  PUBLIC_OPENING_HOUR,
  PUBLIC_SLOT_MINUTES,
  academyDateTimeToIso,
  parsePublicDate,
  parsePublicBookingSelection,
  publicDayRange,
  publicEndTime,
  publicQuoteResponse,
  publicSlotTimes,
  requirePublicBookingService,
  resolvePublicBookingQuote
} from './publicBooking'
import {
  createPublicPayseraCheckout,
  parsePublicCheckoutInput
} from './publicCheckout'
import { listPublicCourts, listPublicExtraServices } from './publicCourts'
import type { PublicCourt } from './publicCourts'

type AssistantBookingToolName
  = | 'get_booking_options'
    | 'find_available_slots'
    | 'get_booking_quote'
    | 'create_booking'

interface AssistantToolCall {
  name: string
  arguments: unknown
}

interface AssistantHistoryMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | null
}

interface ReservationRange {
  courtId: string
  startAt: number
  endAt: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function numberValue(value: unknown, fallback: number) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function stringArrayValue(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map(item => stringValue(item)).filter(Boolean)
}

function courtTypeLabel(courtType: PublicCourt['courtType']) {
  return courtType === 'indoor' ? 'e brendshme' : 'e jashtme'
}

function seasonGuidance(date: string) {
  const month = Number(date.slice(5, 7))
  if (month >= 11 || month <= 3) {
    return 'Per kete date zakonisht jemi ne periudhe dimri. Fushat e brendshme jane zgjedhja me e rehatshme.'
  }
  if (month >= 6 && month <= 9) {
    return 'Per kete date zakonisht jemi ne periudhe vere. Nese moti eshte i mire, fushat e jashtme jane opsion shume i mire.'
  }
  return 'Per kete date jemi ne periudhe kalimtare. Mund te zgjedhim fushen sipas motit dhe preferencen tende.'
}

function equipmentNote() {
  return 'Klienti duhet te sjelle raketen dhe topat e vet, pervec nese stafi konfirmon ndryshe.'
}

function hasExplicitBookingConfirmation(message: string) {
  return /\b(po|ok|dakord|konfirmoj|konfirmo|konfirmohet|confirm|confirmed|beje|b(?:e|\u00eb)je|rezervo|rezervoje|rregulloje|vazhdo|vazhdoje|yes)\b/i.test(message)
}

function hasPriorConfirmationRequest(history: AssistantHistoryMessage[]) {
  return [...history].reverse().slice(0, 6).some((item) => {
    if (item.role !== 'assistant' || typeof item.content !== 'string') return false

    const content = item.content.toLowerCase()
    const asksForConfirmation = /(konfirm|ta rezervoj|ta bej|ta b\u00ebj|vazhdoj|a pajtohesh)/i.test(content)
    const hasBookingContext = /(rezervim|termin|fushe|fush\u00eb|ora|date|dat\u00eb)/i.test(content)
    const hasPriceContext = /(cmim|\u00e7mim|total|eur|\u20ac|\d+[,.]?\d*\s*(?:eur|\u20ac))/i.test(content)

    return asksForConfirmation && hasBookingContext && hasPriceContext
  })
}

function toolError(error: unknown) {
  if (isRecord(error) && typeof error.statusMessage === 'string') {
    return error.statusMessage
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Nuk munda ta kryej kete veprim tani.'
}

function normalizedDate(value: unknown) {
  const date = stringValue(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Data duhet te jete ne formatin YYYY-MM-DD.')
  }
  return parsePublicDate(date)
}

function normalizedDuration(value: unknown) {
  const durationMinutes = numberValue(value, PUBLIC_DURATION_MINUTES)
  if (
    !Number.isInteger(durationMinutes)
    || durationMinutes < PUBLIC_DURATION_MINUTES
    || durationMinutes > 5 * PUBLIC_DURATION_MINUTES
    || durationMinutes % PUBLIC_SLOT_MINUTES !== 0
  ) {
    throw new Error('Kohezgjatja duhet te jete nga 1 deri ne 5 ore.')
  }
  return durationMinutes
}

function slotFitsClosingTime(time: string, durationMinutes: number) {
  const [hourText = '0', minuteText = '0'] = time.split(':')
  return (Number(hourText) * 60) + Number(minuteText) + durationMinutes <= PUBLIC_CLOSING_HOUR * 60
}

export function assistantBookingTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'get_booking_options',
        description: 'Merr fushat aktive, sherbimet shtese dhe orarin e rezervimeve.',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'find_available_slots',
        description: 'Gjen termine te lira per nje date te caktuar, per nje fushe ose per te gjitha fushat aktive.',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Data ne formatin YYYY-MM-DD.'
            },
            courtId: {
              type: 'string',
              description: 'ID e fushes, nese klienti ka zgjedhur fushe konkrete.'
            },
            courtType: {
              type: 'string',
              enum: ['indoor', 'outdoor'],
              description: 'Filtro sipas fushes se brendshme ose te jashtme.'
            },
            durationMinutes: {
              type: 'integer',
              description: 'Kohezgjatja ne minuta. Default 60.'
            }
          },
          required: ['date'],
          additionalProperties: false
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'get_booking_quote',
        description: 'Llogarit cmimin dhe permbledhjen per nje rezervim te mundshem.',
        parameters: {
          type: 'object',
          properties: {
            courtId: { type: 'string' },
            date: { type: 'string', description: 'YYYY-MM-DD' },
            time: { type: 'string', description: 'HH:00' },
            durationMinutes: { type: 'integer' },
            extraServiceIds: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['courtId', 'date', 'time'],
          additionalProperties: false
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'create_booking',
        description: 'Krijon rezervimin vetem pasi klienti e ka konfirmuar qarte permbledhjen.',
        parameters: {
          type: 'object',
          properties: {
            courtId: { type: 'string' },
            date: { type: 'string', description: 'YYYY-MM-DD' },
            time: { type: 'string', description: 'HH:00' },
            durationMinutes: { type: 'integer' },
            extraServiceIds: {
              type: 'array',
              items: { type: 'string' }
            },
            customer: {
              type: 'object',
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                phone: { type: 'string' },
                email: { type: 'string' }
              },
              required: ['firstName', 'lastName', 'phone'],
              additionalProperties: false
            },
            confirmedByCustomer: {
              type: 'boolean',
              description: 'Duhet te jete true vetem kur mesazhi i fundit i klientit e konfirmon rezervimin.'
            }
          },
          required: ['courtId', 'date', 'time', 'customer', 'confirmedByCustomer'],
          additionalProperties: false
        }
      }
    }
  ] as const
}

export async function executeAssistantBookingTool(
  event: H3Event,
  toolCall: AssistantToolCall,
  latestUserMessage: string,
  history: AssistantHistoryMessage[] = []
) {
  const args = isRecord(toolCall.arguments) ? toolCall.arguments : {}
  const name = toolCall.name as AssistantBookingToolName

  try {
    if (name === 'get_booking_options') {
      const client = await requirePublicBookingService(event)
      const [courts, extraServices] = await Promise.all([
        listPublicCourts(client, false),
        listPublicExtraServices(client)
      ])

      return {
        ok: true,
        timezone: ACADEMY_TIME_ZONE,
        openingHours: {
          start: `${String(PUBLIC_OPENING_HOUR).padStart(2, '0')}:00`,
          end: `${String(PUBLIC_CLOSING_HOUR).padStart(2, '0')}:00`
        },
        defaultDurationMinutes: PUBLIC_DURATION_MINUTES,
        slotMinutes: PUBLIC_SLOT_MINUTES,
        courts: courts.map(court => ({
          id: court.id,
          name: court.name,
          courtType: court.courtType,
          label: `${court.name} (${courtTypeLabel(court.courtType)})`
        })),
        extraServices,
        equipmentNote: equipmentNote()
      }
    }

    if (name === 'find_available_slots') {
      const date = normalizedDate(args.date)
      const durationMinutes = normalizedDuration(args.durationMinutes)
      const requestedCourtId = stringValue(args.courtId)
      const requestedCourtType = stringValue(args.courtType)
      const client = await requirePublicBookingService(event)
      const courts = (await listPublicCourts(client, false))
        .filter(court => !requestedCourtId || court.id === requestedCourtId)
        .filter(court => !requestedCourtType || court.courtType === requestedCourtType)

      if (!courts.length) {
        return {
          ok: false,
          message: 'Nuk gjeta fushe aktive me kete preference.'
        }
      }

      const { startAt, endAt } = publicDayRange(date)
      const courtIds = courts.map(court => court.id)
      const { data, error } = await client
        .from('reservations')
        .select('court_id, start_at, end_at')
        .in('court_id', courtIds)
        .neq('status', 'cancelled')
        .lt('start_at', endAt)
        .gt('end_at', startAt)

      if (error) throw error

      const reservations: ReservationRange[] = (data || []).map(reservation => ({
        courtId: reservation.court_id,
        startAt: new Date(reservation.start_at).getTime(),
        endAt: new Date(reservation.end_at).getTime()
      }))
      const now = Date.now()

      const courtSlots = courts.map((court) => {
        const availableTimes = publicSlotTimes()
          .filter(time => slotFitsClosingTime(time, durationMinutes))
          .filter((time) => {
            const slotStartAt = new Date(academyDateTimeToIso(date, time)).getTime()
            const slotEndAt = new Date(academyDateTimeToIso(date, publicEndTime(time, durationMinutes))).getTime()
            const occupied = reservations.some(range => (
              range.courtId === court.id
              && range.startAt < slotEndAt
              && range.endAt > slotStartAt
            ))

            return slotStartAt > now && !occupied
          })

        return {
          courtId: court.id,
          courtName: court.name,
          courtType: court.courtType,
          courtLabel: `${court.name} (${courtTypeLabel(court.courtType)})`,
          availableTimes
        }
      })

      return {
        ok: true,
        date,
        timezone: ACADEMY_TIME_ZONE,
        durationMinutes,
        seasonGuidance: seasonGuidance(date),
        equipmentNote: equipmentNote(),
        courts: courtSlots,
        hasAvailability: courtSlots.some(court => court.availableTimes.length > 0)
      }
    }

    if (name === 'get_booking_quote') {
      const input = parsePublicBookingSelection({
        courtId: args.courtId,
        date: args.date,
        time: args.time,
        durationMinutes: args.durationMinutes,
        extraServiceIds: stringArrayValue(args.extraServiceIds)
      }, true)
      const client = await requirePublicBookingService(event)
      const quote = await resolvePublicBookingQuote(client, input)

      return {
        ok: true,
        quote: publicQuoteResponse(quote),
        seasonGuidance: seasonGuidance(input.date),
        equipmentNote: equipmentNote()
      }
    }

    if (name === 'create_booking') {
      if (
        args.confirmedByCustomer !== true
        || !hasExplicitBookingConfirmation(latestUserMessage)
        || !hasPriorConfirmationRequest(history)
      ) {
        return {
          ok: false,
          needsConfirmation: true,
          message: 'Para krijimit te rezervimit, jep permbledhjen me fushe, date, ore, cmim dhe kerko konfirmim te qarte nga klienti.'
        }
      }

      const input = parsePublicCheckoutInput({
        courtId: args.courtId,
        date: args.date,
        time: args.time,
        durationMinutes: args.durationMinutes,
        extraServiceIds: stringArrayValue(args.extraServiceIds),
        customer: args.customer,
        checkoutRequestId: randomUUID()
      })
      const client = await requirePublicBookingService(event)
      const confirmation = await createPublicPayseraCheckout(event, client, input)

      return {
        ok: true,
        confirmation: {
          courtName: confirmation.courtName,
          date: confirmation.date,
          time: confirmation.time,
          endTime: confirmation.endTime,
          durationMinutes: confirmation.durationMinutes,
          totalPrice: confirmation.totalPrice,
          currency: confirmation.currency,
          status: confirmation.status,
          paymentStatus: confirmation.paymentStatus,
          checkoutUrl: confirmation.checkoutUrl,
          expiresAt: confirmation.expiresAt
        },
        equipmentNote: equipmentNote(),
        staffInstruction: 'Rezervimi konfirmohet vetem pas pageses. Pas konfirmimit, klienti duhet t\'ia tregoje referencen stafit administrativ kur te arrije.'
      }
    }

    return {
      ok: false,
      message: 'Ky veprim nuk njihet nga asistenti.'
    }
  } catch (error) {
    console.error(`[assistant-booking-tool] ${name} failed:`, error)

    return {
      ok: false,
      message: toolError(error)
    }
  }
}
