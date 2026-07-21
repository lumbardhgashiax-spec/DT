import type { AssistantApiResponse } from '~/types/assistant'

const maintenanceMessage = 'Per momentin asistenti eshte ne mirembajtje dhe nuk mund te jap pergjigje te sakte. Te lutem provo perseri pas pak.'

export default defineEventHandler(async (event): Promise<AssistantApiResponse> => {
  const body = await readBody<{ message?: unknown }>(event)
  const message = typeof body?.message === 'string' ? body.message.trim() : ''

  if (!message || message.length > 1000) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Shkruaj nje mesazh te shkurter.'
    })
  }

  return {
    provider: 'unavailable',
    message: maintenanceMessage
  }
})
