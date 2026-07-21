<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { brandConfig } from '~/config/brand'
import { publicNavigation } from '~/config/navigation'

const mobileOpen = ref(false)
const scrolled = ref(false)
const route = useRoute()

const navigationItems = computed(() => publicNavigation.map((item) => {
  const path = item.to.split('#')[0] || '/'
  return {
    ...item,
    class: route.path === path && !item.to.includes('#') ? 'is-page-active' : ''
  }
}))

function onScroll() {
  scrolled.value = window.scrollY > 28
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

watch(() => route.fullPath, () => {
  mobileOpen.value = false
})
</script>

<template>
  <UHeader
    v-model:open="mobileOpen"
    title="Diamond Tennis Academy"
    mode="drawer"
    :class="['site-header', { 'is-scrolled': scrolled, 'is-inner-page': route.path !== '/' }]"
    :toggle="{ icon: 'i-lucide-menu', color: 'neutral', variant: 'ghost', class: 'site-header__toggle' }"
    :menu="{ direction: 'right', handle: false }"
    :ui="{
      root: 'site-header__root',
      container: 'site-header__container',
      left: 'site-header__left',
      center: 'site-header__center',
      right: 'site-header__right',
      content: 'site-header__content',
      header: 'site-header__drawer-header',
      body: 'site-header__drawer-body'
    }"
  >
    <template #left>
      <NuxtLink class="site-header__brand" to="/" aria-label="Diamond Tennis Academy">
        <img :src="brandConfig.logo" width="170" height="54" alt="Diamond Tennis Academy">
      </NuxtLink>
    </template>

    <UNavigationMenu
      class="site-header__nav"
      :items="navigationItems"
      variant="link"
      :ui="{ list: 'site-header__nav-list', link: 'site-header__nav-link' }"
    />

    <template #right>
      <UButton
        class="site-header__reserve"
        to="/rezervo"
        label="Rezervo tani"
        icon="i-lucide-calendar-check-2"
        color="primary"
        size="lg"
      />
    </template>

    <template #body>
      <div class="site-header__mobile-panel">
        <div class="site-header__mobile-brand">
          <img :src="brandConfig.logo" width="180" height="70" alt="Diamond Tennis Academy">
          <UButton
            class="site-header__mobile-close"
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            aria-label="Mbyll menune"
            @click="mobileOpen = false"
          />
        </div>

        <nav aria-label="Navigimi mobil">
          <NuxtLink
            v-for="(item, index) in navigationItems"
            :key="item.to"
            :to="item.to"
            :class="{ 'is-active': item.class === 'is-page-active' }"
            @click="mobileOpen = false"
          >
            <span>0{{ index + 1 }}</span>
            {{ item.label }}
            <UIcon name="i-lucide-arrow-up-right" aria-hidden="true" />
          </NuxtLink>
        </nav>

        <div class="site-header__mobile-footer">
          <p>Hajvali, Prishtine</p>
          <UButton
            to="/rezervo"
            label="Rezervo nje fushe"
            icon="i-lucide-calendar-check-2"
            trailing-icon="i-lucide-arrow-right"
            color="primary"
            size="xl"
            block
            @click="mobileOpen = false"
          />
        </div>
      </div>
    </template>
  </UHeader>
</template>

<style>
.site-header {
  position: fixed !important;
  inset: 0 0 auto;
  z-index: 80;
  border: 0 !important;
  background: transparent !important;
  pointer-events: none;
  transition: background 220ms ease, backdrop-filter 220ms ease;
}

.site-header.is-scrolled,
.site-header.is-inner-page {
  background: rgba(8, 22, 18, 0.88) !important;
  backdrop-filter: blur(18px) saturate(130%);
}

.site-header .site-header__root {
  border: 0;
  background: transparent;
}

.site-header .site-header__container {
  width: min(var(--container), calc(100% - 48px));
  min-height: 76px;
  margin: 0 auto;
  padding: 10px 0;
  border: 0;
  background: transparent;
  pointer-events: auto;
}

.site-header__brand {
  width: 164px;
  height: 54px;
  display: flex;
  align-items: center;
}

.site-header__brand img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: left center;
  filter: brightness(0) invert(1);
}

.site-header .site-header__center {
  justify-content: center;
}

.site-header .site-header__nav-list {
  gap: 4px;
  border: 0;
  background: transparent;
}

.site-header .site-header__nav-link {
  position: relative;
  min-height: 40px;
  border-radius: 0;
  padding: 0 12px;
  color: rgba(255, 255, 255, 0.72);
  background: transparent;
  font-size: 0.8rem;
  font-weight: 720;
}

.site-header .site-header__nav-link:hover,
.site-header .site-header__nav-link.is-page-active {
  color: #FFFFFF;
  background: transparent;
}

.site-header .site-header__nav-link.is-page-active::after {
  content: '';
  position: absolute;
  right: 12px;
  bottom: 4px;
  left: 12px;
  height: 2px;
  background: var(--coral);
}

.site-header__reserve {
  min-height: 44px;
  border-radius: 5px;
  padding-inline: 17px;
  background: var(--lime);
  color: var(--ink);
  font-size: 0.8rem;
  font-weight: 820;
}

.site-header .site-header__toggle {
  display: none;
  width: 44px;
  height: 44px;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex: 0 0 44px;
  border-radius: 5px;
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.1);
}

.site-header .site-header__drawer-header {
  display: none;
}

.site-header__content {
  width: min(420px, 100vw) !important;
  max-width: 100vw !important;
  border-radius: 0 !important;
  background: #071612 !important;
  box-shadow: -24px 0 70px rgba(0, 0, 0, 0.32) !important;
}

.site-header__drawer-body {
  width: 100% !important;
  flex: 1 1 100%;
  padding: 0 !important;
  background: #071612 !important;
}

.site-header__mobile-panel {
  width: 100%;
  height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 24px;
  padding: 24px;
  color: #FFFFFF;
  background: #071612;
}

.site-header__mobile-brand {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.site-header__mobile-brand img {
  width: 146px;
  height: 48px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.site-header__mobile-close {
  width: 44px;
  height: 44px;
  aspect-ratio: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex: 0 0 44px;
  border-radius: 5px;
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.09);
}

.site-header__mobile-panel nav {
  display: grid;
  align-content: start;
  padding-top: clamp(20px, 5vh, 48px);
}

.site-header__mobile-panel nav a {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  padding: 20px 2px;
  color: rgba(255, 255, 255, 0.76);
  font-size: 1.18rem;
  font-weight: 780;
  text-decoration: none;
}

.site-header__mobile-panel nav a:first-child {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.site-header__mobile-panel nav a:hover,
.site-header__mobile-panel nav a.is-active {
  color: #FFFFFF;
}

.site-header__mobile-panel nav a.is-active {
  border-bottom-color: var(--coral);
}

.site-header__mobile-panel nav span {
  color: var(--lime);
  font-size: 0.66rem;
}

.site-header__mobile-panel nav svg {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.56);
}

.site-header__mobile-footer p {
  margin: 0 0 14px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.76rem;
}

.site-header__mobile-footer {
  padding-bottom: max(0px, env(safe-area-inset-bottom));
}

.site-header__mobile-footer a {
  border-radius: 5px;
  background: var(--lime);
  color: var(--ink);
  font-weight: 820;
}

@media (max-width: 1040px) {
  .site-header .site-header__center {
    display: none;
  }

  .site-header .site-header__toggle {
    display: inline-flex;
  }
}

@media (max-width: 600px) {
  .site-header .site-header__container {
    width: calc(100% - 28px);
    min-height: 66px;
    padding: 7px 0;
  }

  .site-header__brand {
    width: 116px;
    height: 42px;
  }

  .site-header__reserve {
    width: auto;
    min-width: 102px;
    min-height: 44px;
    padding-inline: 13px;
    font-size: 0.74rem;
  }
}

@media (max-width: 370px) {
  .site-header .site-header__container {
    width: calc(100% - 20px);
  }

  .site-header__brand {
    width: 102px;
  }

  .site-header__reserve {
    min-width: 92px;
    padding-inline: 10px;
  }

  .site-header__mobile-panel {
    padding: 18px;
  }
}
</style>
