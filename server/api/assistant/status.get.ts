export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)

  return {
    available: Boolean(config.openRouterApiKey),
    provider: config.openRouterApiKey ? 'openrouter' : 'unavailable',
    model: config.openRouterApiKey ? config.openRouterModel : null
  }
})
