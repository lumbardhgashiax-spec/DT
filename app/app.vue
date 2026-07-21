<script setup lang="ts">
import { brandConfig } from '~/config/brand'
import DiamondAssistantWidget from '~/components/assistant/DiamondAssistantWidget.vue'
import SiteFooter from '~/components/public/SiteFooter.vue'
import SiteHeader from '~/components/public/SiteHeader.vue'

const publicDescription = 'Diamond Tennis Academy ne Hajvali, Prishtine: fusha tenisi, rezervim online dhe sherbime shtese sipas disponueshmerise.'
const route = useRoute()
const runtimeConfig = useRuntimeConfig()

const usesDashboardLayout = computed(() => route.meta.layout === 'dashboard')
const isAuthRoute = computed(() => route.path === '/login' || route.path === '/confirm')
const isPublicRoute = computed(() => !usesDashboardLayout.value && !isAuthRoute.value)
const siteUrl = computed(() => runtimeConfig.public.siteUrl.replace(/\/+$/, ''))
const canonicalUrl = computed(() => siteUrl.value && isPublicRoute.value ? `${siteUrl.value}${route.path}` : '')

useHead({
  titleTemplate: title => isPublicRoute.value
    ? (title ? `${title} | ${brandConfig.name}` : brandConfig.name)
    : (title || brandConfig.name),
  htmlAttrs: {
    lang: 'sq'
  },
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'keywords', content: 'Diamond Tennis Academy, tennis Hajvali, tenis Prishtine, fusha tenisi, tennis academy Kosovo, rezervim tenis, fusha indoor tenis, fusha outdoor tenis' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
    { rel: 'icon', type: 'image/png', href: '/DiamondTenisAccademyMark.png', sizes: '256x256' },
    { rel: 'apple-touch-icon', href: '/DiamondTenisAccademyMark.png', sizes: '256x256' }
  ]
})

useHead(() => canonicalUrl.value
  ? { link: [{ rel: 'canonical' as const, href: canonicalUrl.value }] }
  : {})

useSeoMeta({
  title: brandConfig.name,
  description: publicDescription,
  ogTitle: brandConfig.name,
  ogDescription: publicDescription,
  ogImage: brandConfig.logo,
  ogUrl: () => canonicalUrl.value || undefined,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator color="#C6A15B" />

    <NuxtLayout v-if="usesDashboardLayout">
      <NuxtPage />
    </NuxtLayout>

    <div
      v-else-if="isPublicRoute"
      class="public-site"
    >
      <a
        class="skip-link"
        href="#main-content"
      >
        Kalo te permbajtja
      </a>

      <SiteHeader />

      <UMain id="main-content">
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </UMain>

      <DiamondAssistantWidget />
      <SiteFooter />
    </div>

    <UMain
      v-else
      class="min-h-screen"
    >
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>
  </UApp>
</template>

<style scoped>
.skip-link {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 1000;
  transform: translateY(-140%);
  border-radius: 6px;
  padding: 10px 14px;
  background: #DFFF3F;
  color: #101816;
  font-weight: 800;
  text-decoration: none;
  transition: transform 160ms ease;
}

.skip-link:focus {
  transform: translateY(0);
}
</style>
