import type { DashboardProfile } from '~/types/dashboard'

export function useDashboardProfile() {
  const dashboardApi = useDashboardApi()
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const profile = useState<DashboardProfile | null>('dashboard-profile', () => null)
  const profileLoaded = useState('dashboard-profile-loaded', () => false)
  const profileUserId = useState<string | null>('dashboard-profile-user-id', () => null)
  const profileError = useState<string | null>('dashboard-profile-error', () => null)

  function resetProfile() {
    profile.value = null
    profileLoaded.value = false
    profileUserId.value = null
    profileError.value = null
  }

  async function loadProfile(force = false, requestedUserId?: string) {
    // Gjatë login-it, useSupabaseUser mund të përditësohet pak pas përgjigjes së Auth.
    // ID-ja e kthyer nga signInWithPassword na lejon ta ngarkojmë profilin pa atë garë.
    let currentUserId = requestedUserId || user.value?.id

    // Në navigimin client-side, composable-i mund të hidratohet pak pas sesionit Auth.
    // Leximi nga Auth shmang pastrimin e një profili valid gjatë atij intervali.
    if (!currentUserId) {
      const { data: authData } = await supabase.auth.getUser()
      currentUserId = authData.user?.id
    }

    if (!currentUserId) {
      resetProfile()
      profileLoaded.value = true
      return null
    }

    if (profileLoaded.value && profileUserId.value === currentUserId && !force) {
      return profile.value
    }

    profile.value = null
    profileLoaded.value = false
    profileUserId.value = currentUserId
    profileError.value = null

    let data: DashboardProfile | null = null
    let error: unknown = null
    try {
      data = await dashboardApi.getProfile()
    } catch (cause) {
      error = cause
    }

    // Mos lejo që një kërkesë e vjetër të mbishkruajë profilin pas ndërrimit të sesionit.
    if (user.value?.id && user.value.id !== currentUserId) return null

    if (error) {
      profile.value = null
      profileLoaded.value = true
      profileError.value = 'Profili nuk mund të ngarkohej. Rifresko faqen ose hyr përsëri.'
      return null
    }

    if (!data) {
      profile.value = null
      profileLoaded.value = true
      profileError.value = 'Llogaria nuk ka profil të lidhur me dashboard-in.'
      return null
    }

    profile.value = data as DashboardProfile
    profileLoaded.value = true

    if (!profile.value.is_active) {
      profileError.value = 'Kjo llogari është çaktivizuar. Kontakto superadmin-in.'
    }

    return profile.value
  }

  const canManagePricing = computed(() => Boolean(
    profile.value?.is_active && ['admin', 'superadmin'].includes(profile.value.role)
  ))
  const isSuperAdmin = computed(() => Boolean(
    profile.value?.is_active && profile.value.role === 'superadmin'
  ))

  return {
    profile,
    profileLoaded,
    profileError,
    canManagePricing,
    isSuperAdmin,
    loadProfile,
    resetProfile
  }
}
