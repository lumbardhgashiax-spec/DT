<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { loadProfile, profileError, resetProfile } = useDashboardProfile()
const sidebarOpen = useCookie('dashboard-sidebar-open', {
  default: () => true,
  sameSite: 'lax'
})

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

if (user.value) {
  await navigateTo('/dashboard')
}

async function login() {
  if (isSubmitting.value) return

  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value
    })

    if (error) {
      errorMessage.value = 'Email-i ose fjalëkalimi nuk është i saktë.'
      return
    }

    resetProfile()
    const dashboardProfile = await loadProfile(true, data.user.id)

    if (!dashboardProfile || !dashboardProfile.is_active) {
      const accessError = profileError.value || 'Kjo llogari nuk ka qasje aktive në dashboard.'
      await supabase.auth.signOut()
      resetProfile()
      errorMessage.value = accessError
      return
    }

    // Start every new dashboard session with the desktop sidebar expanded.
    sidebarOpen.value = true
    await navigateTo('/dashboard')
  } catch {
    errorMessage.value = 'Hyrja nuk mund të kryhej. Provo përsëri.'
  } finally {
    isSubmitting.value = false
  }
}

useSeoMeta({
  title: 'Login | Diamond Tennis Academy',
  description: 'Hyr në dashboard-in e Diamond Tennis Academy.'
})
</script>

<template>
  <UContainer class="flex min-h-[calc(100vh-16rem)] items-center justify-center py-12">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="space-y-2 text-center">
          <UIcon
            name="i-lucide-lock-keyhole"
            class="mx-auto size-10 text-primary"
          />
          <h1 class="text-2xl font-bold tracking-tight text-balance text-highlighted">
            Hyr në dashboard
          </h1>
          <p class="text-sm/6 text-pretty text-muted">
            Përdor llogarinë tënde të Diamond Tennis Academy.
          </p>
        </div>
      </template>

      <form
        class="space-y-5"
        @submit.prevent="login"
      >
        <UAlert
          v-if="errorMessage"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :description="errorMessage"
        />

        <UFormField
          label="Email"
          name="email"
          required
        >
          <UInput
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="emri@shembull.com"
            icon="i-lucide-mail"
            class="w-full"
            :disabled="isSubmitting"
            required
          />
        </UFormField>

        <UFormField
          label="Fjalëkalimi"
          name="password"
          required
        >
          <UInput
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="Shkruaj fjalëkalimin"
            icon="i-lucide-key-round"
            class="w-full"
            :disabled="isSubmitting"
            required
          />
        </UFormField>

        <UButton
          type="submit"
          block
          size="lg"
          icon="i-lucide-log-in"
          :loading="isSubmitting"
        >
          Hyr
        </UButton>
      </form>

      <template #footer>
        <p class="text-center text-sm text-muted">
          <NuxtLink
            to="/"
            class="font-medium text-primary hover:underline"
          >
            Kthehu në faqen kryesore
          </NuxtLink>
        </p>
      </template>
    </UCard>
  </UContainer>
</template>
