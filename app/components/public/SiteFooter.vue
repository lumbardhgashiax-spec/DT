<script setup lang="ts">
import { brandConfig } from '~/config/brand'
import { businessConfig } from '~/config/business'
import { publicNavigation } from '~/config/navigation'

const copyrightYear = new Date().getFullYear()
const runtimeConfig = useRuntimeConfig()
const publicPhone = businessConfig.contact.phone as string
const publicEmail = businessConfig.contact.email as string

const mapUrl = computed(() => runtimeConfig.public.diamondTennisLocationUrl || businessConfig.contact.mapsUrl)
const instagramUrl = computed(() => runtimeConfig.public.diamondTennisInstagramUrl || brandConfig.social.instagram)
const phoneHref = computed(() => publicPhone
  ? `tel:${publicPhone.replace(/[^+\d]/g, '')}`
  : '')
const emailHref = computed(() => publicEmail ? `mailto:${publicEmail}` : '')
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__main">
      <div class="site-footer__brand">
        <img :src="brandConfig.logo" width="220" height="90" alt="Diamond Tennis Academy">
        <p>Fusha tenisi dhe rezervime online ne Hajvali, Prishtine.</p>
        <UButton
          to="/rezervo"
          label="Rezervo nje fushe"
          icon="i-lucide-calendar-check-2"
          trailing-icon="i-lucide-arrow-right"
          color="primary"
          size="lg"
          class="site-footer__cta public-lime-button"
        />
      </div>

      <nav aria-label="Navigimi ne footer">
        <span>Eksploro</span>
        <NuxtLink v-for="item in publicNavigation" :key="item.to" :to="item.to">
          {{ item.label }}
        </NuxtLink>
        <NuxtLink to="/rezervo">
          Rezervo
        </NuxtLink>
      </nav>

      <div class="site-footer__info">
        <span>Vizitona</span>
        <p class="site-footer__info-label">Adresa</p>
        <a
          v-if="mapUrl"
          :href="mapUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ businessConfig.contact.address || brandConfig.locationLabel }}
          <UIcon name="i-lucide-arrow-up-right" aria-hidden="true" />
        </a>
        <p v-else>{{ businessConfig.contact.address || brandConfig.locationLabel }}</p>
        <p class="site-footer__info-label">Orari</p>
        <p>{{ businessConfig.hours.label }}, {{ businessConfig.hours.range }}</p>
      </div>

      <div class="site-footer__info">
        <span>Kontakti</span>
        <a v-if="phoneHref" :href="phoneHref">
          <UIcon name="i-lucide-phone" aria-hidden="true" />
          {{ businessConfig.contact.phone }}
        </a>
        <a v-if="emailHref" :href="emailHref">
          <UIcon name="i-lucide-mail" aria-hidden="true" />
          {{ businessConfig.contact.email }}
        </a>
        <NuxtLink v-if="!phoneHref && !emailHref" to="/kontakt">
          Shiko lokacionin dhe orarin
          <UIcon name="i-lucide-arrow-right" aria-hidden="true" />
        </NuxtLink>
        <a
          v-if="instagramUrl"
          :href="instagramUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          <UIcon name="i-simple-icons-instagram" aria-hidden="true" />
          Instagram
          <UIcon name="i-lucide-arrow-up-right" aria-hidden="true" />
        </a>
      </div>
    </div>

    <div class="site-footer__bottom">
      <span>Copyright {{ copyrightYear }} Diamond Tennis Academy</span>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  padding: clamp(58px, 8vw, 100px) max(16px, calc((100vw - var(--container)) / 2)) max(28px, env(safe-area-inset-bottom));
  background: #081511;
  color: #FFFFFF;
}

.site-footer__main {
  display: grid;
  grid-template-columns: minmax(220px, 1.25fr) minmax(130px, 0.55fr) minmax(170px, 0.75fr) minmax(160px, 0.75fr);
  gap: clamp(32px, 5vw, 78px);
}

.site-footer__brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.site-footer__brand img {
  width: 210px;
  height: 88px;
  object-fit: contain;
  object-position: left center;
  filter: brightness(0) invert(1);
}

.site-footer__brand p {
  max-width: 330px;
  margin: 20px 0 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.82rem;
  line-height: 1.65;
}

.site-footer__cta {
  min-height: 46px;
  margin-top: 32px;
  border-radius: 5px;
  background: var(--lime);
  color: var(--ink);
  font-size: 0.76rem;
  font-weight: 820;
}

.site-footer nav,
.site-footer__info {
  display: grid;
  align-content: start;
  gap: 12px;
}

.site-footer nav > span,
.site-footer__info > span {
  margin-bottom: 7px;
  color: var(--lime);
  font-size: 0.65rem;
  font-weight: 840;
  text-transform: uppercase;
}

.site-footer a,
.site-footer__info p {
  margin: 0;
  color: rgba(255, 255, 255, 0.68);
  font-size: 0.78rem;
  text-decoration: none;
}

.site-footer__info-label {
  margin-top: 4px !important;
  color: rgba(255, 255, 255, 0.38) !important;
  font-size: 0.62rem !important;
  font-weight: 790;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.site-footer a:hover {
  color: #FFFFFF;
}

.site-footer__info a {
  display: inline-flex;
  gap: 7px;
  align-items: center;
}

.site-footer__info svg {
  width: 14px;
  height: 14px;
}

.site-footer__bottom {
  display: flex;
  justify-content: center;
  gap: 20px;
  align-items: center;
  margin-top: 66px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-top: 22px;
}

.site-footer__bottom span,
.site-footer__bottom-note {
  color: rgba(255, 255, 255, 0.38);
  font-size: 0.68rem;
}

.site-footer__bottom-note {
  text-align: right;
}

@media (max-width: 920px) {
  .site-footer__main {
    grid-template-columns: 1fr 1fr;
  }

  .site-footer__brand {
    grid-column: 1 / -1;
  }
}

@media (max-width: 460px) {
  .site-footer__main {
    grid-template-columns: 1fr;
  }

  .site-footer__brand {
    grid-column: auto;
  }

  .site-footer__bottom {
    text-align: center;
  }
}
</style>
