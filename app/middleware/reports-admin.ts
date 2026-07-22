export default defineNuxtRouteMiddleware(async () => {
  const { loadProfile } = useDashboardProfile()
  const profile = await loadProfile()

  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    return navigateTo('/dashboard')
  }
})
