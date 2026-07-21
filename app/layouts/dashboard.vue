<script setup lang="ts">
const route = useRoute()
const sidebarOpen = useCookie('dashboard-sidebar-open', {
  default: () => true,
  sameSite: 'lax'
})
const { profileError } = useDashboardProfile()

const pageTitle = computed(() => {
  if (route.path.startsWith('/kalendari')) return 'Kalendari'
  if (route.path.startsWith('/rezervimet')) return 'Rezervimet'
  if (route.path.startsWith('/menaxhimi/fushat')) return 'Fushat'
  if (route.path.startsWith('/menaxhimi/sezonet')) return 'Sezonet'
  if (route.path.startsWith('/menaxhimi/cmimet')) return 'Çmimet'
  if (route.path.startsWith('/menaxhimi/sherbime-shtese')) return 'Shërbime shtesë'
  if (route.path.startsWith('/stafi')) return 'Stafi dhe rolet'
  if (route.path.startsWith('/raportet')) return 'Raportet'
  return 'Përmbledhja'
})
</script>

<template>
  <div class="flex min-h-screen bg-[#f7f8fa] dark:bg-slate-950">
    <DashboardSidebar />

    <div class="min-w-0 flex-1">
      <header class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-default bg-white/90 px-4 backdrop-blur-xl sm:px-6 dark:bg-slate-950/90">
        <UButton
          icon="i-lucide-panel-left"
          color="neutral"
          variant="ghost"
          aria-label="Hap ose mbyll sidebar-in"
          @click="sidebarOpen = !sidebarOpen"
        />
        <USeparator
          orientation="vertical"
          class="h-5"
        />
        <p class="truncate text-sm font-semibold text-highlighted">
          {{ pageTitle }}
        </p>
      </header>

      <main>
        <div class="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10 xl:px-12">
          <UAlert
            v-if="profileError"
            color="error"
            variant="subtle"
            icon="i-lucide-shield-alert"
            title="Qasja në profil nuk u verifikua"
            :description="profileError"
            class="mb-6"
          />
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
