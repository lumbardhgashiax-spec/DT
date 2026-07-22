<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const colorMode = useColorMode()
const { profile, profileLoaded, profileError, isSuperAdmin, loadProfile, resetProfile } = useDashboardProfile()

const sidebarOpen = useCookie('dashboard-sidebar-open', {
  default: () => true,
  sameSite: 'lax'
})
const isSigningOut = ref(false)
const searchQuery = ref('')

const roleLabel = computed(() => {
  if (!profileLoaded.value) return 'Duke u ngarkuar…'
  if (profileError.value && !profile.value) return 'Gabim profili'
  if (profile.value?.role === 'superadmin') return 'Superadmin'
  if (profile.value?.role === 'admin') return 'Administrator'
  if (profile.value?.role === 'staff') return 'Staf'
  return 'Pa profil'
})

const userInitial = computed(() => (
  profile.value?.full_name?.charAt(0) || user.value?.email?.charAt(0) || 'D'
).toUpperCase())

const canViewReports = computed(() => Boolean(
  profile.value?.is_active && ['admin', 'superadmin'].includes(profile.value.role)
))

function closeOnMobile() {
  if (import.meta.client && window.innerWidth < 1024) sidebarOpen.value = false
}

function navigationItems() {
  const managementChildren: NavigationMenuItem[] = [
    {
      label: 'Fushat',
      icon: 'i-lucide-map-pinned',
      to: '/menaxhimi/fushat',
      active: route.path.startsWith('/menaxhimi/fushat'),
      onSelect: closeOnMobile
    },
    {
      label: 'Sezonet',
      icon: 'i-lucide-sun-snow',
      to: '/menaxhimi/sezonet',
      active: route.path.startsWith('/menaxhimi/sezonet'),
      onSelect: closeOnMobile
    },
    {
      label: 'Çmimet',
      icon: 'i-lucide-badge-euro',
      to: '/menaxhimi/cmimet',
      active: route.path.startsWith('/menaxhimi/cmimet'),
      onSelect: closeOnMobile
    },
    {
      label: 'Shërbime shtesë',
      icon: 'i-lucide-hand-platter',
      to: '/menaxhimi/sherbime-shtese',
      active: route.path.startsWith('/menaxhimi/sherbime-shtese'),
      onSelect: closeOnMobile
    },
    ...(isSuperAdmin.value
      ? [{
          label: 'Stafi dhe rolet',
          icon: 'i-lucide-users-round',
          to: '/stafi',
          active: route.path.startsWith('/stafi'),
          onSelect: closeOnMobile
        }]
      : [])
  ]

  return [
    {
      label: 'Përmbledhja',
      icon: 'i-lucide-layout-dashboard',
      to: '/dashboard',
      active: route.path === '/dashboard',
      onSelect: closeOnMobile
    },
    {
      label: 'Kalendari',
      icon: 'i-lucide-calendar-days',
      to: '/kalendari',
      active: route.path.startsWith('/kalendari'),
      onSelect: closeOnMobile
    },
    {
      label: 'Rezervimet',
      icon: 'i-lucide-clipboard-check',
      to: '/rezervimet',
      active: route.path.startsWith('/rezervimet'),
      onSelect: closeOnMobile
    },
    ...(canViewReports.value
      ? [{
          label: 'Raportet',
          icon: 'i-lucide-chart-no-axes-combined',
          to: '/raportet',
          active: route.path.startsWith('/raportet'),
          onSelect: closeOnMobile
        }]
      : []),
    {
      label: 'Menaxhimi',
      icon: 'i-lucide-settings-2',
      defaultOpen: true,
      children: managementChildren
    }
  ] satisfies NavigationMenuItem[]
}

const visibleNavigationItems = computed<NavigationMenuItem[]>(() => {
  const items: NavigationMenuItem[] = navigationItems()
  const query = searchQuery.value.trim().toLocaleLowerCase('sq')
  if (!query) return items

  const filtered: NavigationMenuItem[] = []
  for (const item of items) {
    const ownMatch = String(item.label || '').toLocaleLowerCase('sq').includes(query)
    const children = item.children?.filter(child => String(child.label || '').toLocaleLowerCase('sq').includes(query))
    if (ownMatch) filtered.push(item)
    else if (children?.length) filtered.push({ ...item, defaultOpen: true, children })
  }
  return filtered
})

async function logout() {
  if (isSigningOut.value) return
  isSigningOut.value = true

  try {
    await supabase.auth.signOut()
  } finally {
    resetProfile()
    sidebarOpen.value = false
    isSigningOut.value = false
    await navigateTo('/login')
  }
}

const userMenuItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: roleLabel.value,
      type: 'label'
    }
  ],
  [
    {
      label: 'Pamja',
      icon: 'i-lucide-sun-moon',
      children: [
        {
          label: 'E çelët',
          icon: 'i-lucide-sun',
          type: 'checkbox',
          checked: colorMode.value === 'light',
          onUpdateChecked: checked => checked && (colorMode.preference = 'light'),
          onSelect: event => event.preventDefault()
        },
        {
          label: 'E errët',
          icon: 'i-lucide-moon',
          type: 'checkbox',
          checked: colorMode.value === 'dark',
          onUpdateChecked: checked => checked && (colorMode.preference = 'dark'),
          onSelect: event => event.preventDefault()
        }
      ]
    }
  ],
  [
    {
      label: 'Dil nga llogaria',
      icon: 'i-lucide-log-out',
      color: 'error',
      onSelect: logout
    }
  ]
])

onMounted(() => {
  loadProfile()

  // The dashboard should start expanded after authentication on desktop.
  // Keep the user's collapsed state while navigating inside the dashboard.
  if (user.value?.id && window.innerWidth >= 1024) sidebarOpen.value = true
})

watch(() => user.value?.id, (currentId, previousId) => {
  if (currentId !== previousId) {
    loadProfile()
    if (currentId && import.meta.client && window.innerWidth >= 1024) sidebarOpen.value = true
  }
})
</script>

<template>
  <USidebar
    v-model:open="sidebarOpen"
    collapsible="icon"
    mode="slideover"
    rail
    title="Diamond Tennis Academy"
    description="Paneli administrativ"
    :ui="{
      root: '[--sidebar-width:17.5rem] [--sidebar-width-icon:4.5rem]',
      container: 'h-svh',
      inner: 'bg-white dark:bg-slate-950',
      header: 'min-h-24 px-4',
      body: 'px-3 py-5',
      footer: 'p-3'
    }"
  >
    <template #header="{ state }">
      <NuxtLink
        to="/dashboard"
        class="flex min-w-0 flex-1 items-center overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Diamond Tennis Academy"
      >
        <AppLogo
          v-if="state === 'expanded'"
          class="h-auto w-48 max-w-full"
        />
        <img
          v-else
          src="/DiamondTenisAccademyMark.png"
          alt=""
          width="40"
          height="40"
          class="mx-auto size-10 object-contain"
          aria-hidden="true"
        >
      </NuxtLink>
    </template>

    <template #default="{ state }">
      <UInput
        v-if="state === 'expanded'"
        v-model="searchQuery"
        icon="i-lucide-search"
        placeholder="Kërko në panel..."
        aria-label="Kërko në navigim"
        class="mb-4 w-full"
        :ui="{ base: 'rounded-lg' }"
      />
      <UNavigationMenu
        :key="`${state}-${isSuperAdmin}`"
        :items="visibleNavigationItems"
        orientation="vertical"
        :collapsed="state === 'collapsed'"
        :popover="state === 'collapsed'"
        tooltip
        :ui="{
          link: 'min-h-10 overflow-hidden rounded-lg px-3 text-sm',
          linkLeadingIcon: 'size-5',
          childLink: 'min-h-9 rounded-lg'
        }"
      />
    </template>

    <template #footer="{ state }">
      <UDropdownMenu
        :items="userMenuItems"
        :content="{ align: 'center', collisionPadding: 12 }"
        :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width) min-w-56' }"
      >
        <UButton
          color="neutral"
          variant="ghost"
          :square="state === 'collapsed'"
          class="w-full overflow-hidden data-[state=open]:bg-elevated"
          :loading="isSigningOut"
        >
          <UAvatar
            :text="userInitial"
            size="sm"
            class="shrink-0 bg-[#062660] font-bold text-white"
          />
          <span
            v-if="state === 'expanded'"
            class="min-w-0 flex-1 text-left"
          >
            <span class="block truncate text-sm font-semibold text-highlighted">
              {{ profile?.full_name || user?.email || 'Përdorues' }}
            </span>
            <span class="block truncate text-xs font-normal text-muted">
              {{ roleLabel }}
            </span>
          </span>
          <UIcon
            v-if="state === 'expanded'"
            name="i-lucide-chevrons-up-down"
            class="ml-auto size-4 shrink-0 text-dimmed"
          />
        </UButton>
      </UDropdownMenu>
    </template>
  </USidebar>
</template>
