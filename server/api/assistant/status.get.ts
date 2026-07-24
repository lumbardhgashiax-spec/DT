export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const available = Boolean(config.assistantBaseUrl && config.assistantModel)

  return {
    available,
    provider: available ? config.assistantProvider : 'unavailable',
    model: available ? config.assistantModel : null
  }
})
