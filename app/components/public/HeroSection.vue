<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { businessConfig } from '~/config/business'

const highlights = [
  { icon: 'i-lucide-map-pin', value: 'Hajvali', label: 'Prishtine' },
  { icon: 'i-lucide-layout-grid', value: 'Fusha aktive', label: 'Rezervo online' },
  { icon: 'i-lucide-clock-3', value: '10:00 - 22:00', label: 'Cdo dite' }
]

const heroSlides = [
  '/hero/diamond-signature-court.webp',
  '/hero/diamond-blue-hour-rally.webp',
  '/hero/diamond-sunrise-serve.webp'
]

const activeSlide = ref(0)
let slideTimer: ReturnType<typeof setInterval> | undefined
const runtimeConfig = useRuntimeConfig()
const locationUrl = runtimeConfig.public.diamondTennisLocationUrl || businessConfig.contact.mapsUrl
const locationHighlight = highlights[0]!

function stopCarousel() {
  if (slideTimer) {
    clearInterval(slideTimer)
    slideTimer = undefined
  }
}

function startCarousel() {
  stopCarousel()

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  slideTimer = setInterval(() => {
    activeSlide.value = (activeSlide.value + 1) % heroSlides.length
  }, 3600)
}

function selectSlide(index: number) {
  activeSlide.value = index
  startCarousel()
}

onMounted(startCarousel)
onBeforeUnmount(stopCarousel)
</script>

<template>
  <section class="hero-section">
    <div class="hero-section__media" aria-hidden="true">
      <img
        v-for="(slide, index) in heroSlides"
        :key="slide"
        class="hero-section__image"
        :class="{ 'is-active': activeSlide === index }"
        :src="slide"
        width="1920"
        height="1080"
        alt=""
        :fetchpriority="index === 0 ? 'high' : 'auto'"
        decoding="async"
      >
    </div>
    <div class="hero-section__overlay" aria-hidden="true" />

    <div class="hero-section__inner">
      <div class="hero-section__content">
        <p class="hero-section__eyebrow">
          <span aria-hidden="true" />
          Diamond Tennis Academy / Hajvali
        </p>

        <h1>
          Fusha jote.<br>
          <em>Loja jote.</em>
        </h1>

        <p class="hero-section__copy">
          Rezervo online fushen outdoor ose indoor dhe zgjidh termin qe te pershtatet.
        </p>

        <div class="hero-section__actions">
          <UButton
            to="/#availability"
            size="xl"
            color="primary"
            label="Gjej nje termin"
            trailing-icon="i-lucide-arrow-down-right"
            class="hero-section__primary"
          />
          <UButton
            to="/fushat"
            size="xl"
            color="neutral"
            variant="ghost"
            label="Shiko fushat"
            trailing-icon="i-lucide-arrow-up-right"
            class="hero-section__secondary"
          />
        </div>

        <div class="hero-section__pagination" aria-label="Zgjidh fotografinë kryesore">
          <button
            v-for="(_, index) in heroSlides"
            :key="index"
            type="button"
            :class="{ 'is-active': activeSlide === index }"
            :aria-pressed="activeSlide === index"
            :aria-label="`Shfaq fotografinë ${index + 1}`"
            @click="selectSlide(index)"
          >
            <span />
          </button>
        </div>
      </div>

      <div class="hero-section__highlights" aria-label="Informata kryesore">
        <a
          :href="locationUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="hero-section__location-link"
          aria-label="Hap lokacionin e Diamond Tennis Academy ne harte"
        >
          <article>
            <UIcon :name="locationHighlight.icon" aria-hidden="true" />
            <div>
              <strong>{{ locationHighlight.value }}</strong>
              <span>{{ locationHighlight.label }}</span>
            </div>
            <UIcon
              name="i-lucide-arrow-up-right"
              aria-hidden="true"
              class="hero-section__location-arrow"
            />
          </article>
        </a>
        <article
          v-for="item in highlights.slice(1)"
          :key="item.value"
        >
          <UIcon :name="item.icon" aria-hidden="true" />
          <div>
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
          </div>
        </article>
      </div>
    </div>

    <div class="hero-section__scroll" aria-hidden="true">
      <span />
      Scroll
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  position: relative;
  min-height: 760px;
  height: min(920px, 100svh);
  overflow: hidden;
  background: #0A1714;
  color: #FFFFFF;
  isolation: isolate;
}

.hero-section__media,
.hero-section__overlay {
  position: absolute;
  inset: 0;
}

.hero-section__media {
  z-index: -3;
  background: #0A1714;
}

.hero-section__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  object-fit: cover;
  object-position: center;
  transform: scale(1.035);
  transition: opacity 1.1s ease, transform 6.2s cubic-bezier(.2,.75,.25,1);
}

.hero-section__image.is-active {
  opacity: 1;
  transform: scale(1);
}

.hero-section__overlay {
  z-index: -2;
  background:
    linear-gradient(90deg, rgba(4, 17, 14, 0.94) 0%, rgba(4, 17, 14, 0.78) 34%, rgba(4, 17, 14, 0.18) 68%, rgba(4, 17, 14, 0.12) 100%),
    linear-gradient(180deg, rgba(4, 17, 14, 0.44) 0%, transparent 34%, rgba(4, 17, 14, 0.72) 100%);
}

.hero-section__inner {
  width: min(var(--container), calc(100% - 48px));
  height: 100%;
  display: grid;
  align-content: center;
  margin: 0 auto;
  padding: 120px 0 112px;
}

.hero-section__content {
  max-width: 720px;
}

.hero-section__eyebrow {
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 0 0 24px;
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.72rem;
  font-weight: 780;
  text-transform: uppercase;
}

.hero-section__eyebrow span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--lime);
  box-shadow: 0 0 0 6px rgba(216, 255, 62, 0.16);
}

.hero-section h1 {
  margin: 0;
  color: #FFFFFF;
  font-size: clamp(3.2rem, 7.2vw, 6.5rem);
  font-weight: 860;
  line-height: 0.91;
  letter-spacing: 0;
}

.hero-section h1 em {
  color: var(--lime);
  font-family: Georgia, 'Times New Roman', serif;
  font-weight: 500;
}

.hero-section__copy {
  max-width: 520px;
  margin: 26px 0 0;
  color: rgba(255, 255, 255, 0.76);
  font-size: 1.05rem;
  font-weight: 520;
  line-height: 1.62;
}

.hero-section__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 32px;
}

.hero-section__primary,
.hero-section__secondary {
  min-height: 52px;
  border-radius: 6px;
  padding-inline: 20px;
  font-size: 0.9rem;
  font-weight: 820;
}

.hero-section__primary {
  background: var(--lime);
  color: var(--ink);
  box-shadow: 0 14px 34px rgba(216, 255, 62, 0.18);
}

.hero-section__secondary {
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.09);
  backdrop-filter: blur(14px);
}

.hero-section__pagination {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 28px;
}

.hero-section__pagination button {
  width: 34px;
  height: 20px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.hero-section__pagination button span {
  width: 100%;
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.34);
  transition: background-color 200ms ease, transform 200ms ease;
}

.hero-section__pagination button:hover span,
.hero-section__pagination button:focus-visible span {
  background: rgba(255, 255, 255, 0.7);
}

.hero-section__pagination button:focus-visible {
  outline: 2px solid #FFFFFF;
  outline-offset: 2px;
}

.hero-section__pagination button.is-active span {
  background: var(--lime);
  transform: scaleY(1.5);
}

.hero-section__highlights {
  position: absolute;
  right: max(24px, calc((100vw - var(--container)) / 2));
  bottom: 34px;
  left: max(24px, calc((100vw - var(--container)) / 2));
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid rgba(255, 255, 255, 0.22);
}

.hero-section__highlights article {
  min-height: 78px;
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 18px 20px 0 0;
}

.hero-section__highlights > a {
  display: block;
  color: inherit;
  text-decoration: none;
}

.hero-section__location-link article {
  transition: background-color 180ms ease, color 180ms ease;
}

.hero-section__location-link:hover article,
.hero-section__location-link:focus-visible article {
  color: var(--lime);
}

.hero-section__location-arrow {
  margin-left: auto;
  flex: 0 0 auto;
  color: var(--lime);
}

.hero-section__highlights > article {
  border-left: 1px solid rgba(255, 255, 255, 0.22);
  padding-left: 24px;
}

.hero-section__highlights article + article {
  border-left: 1px solid rgba(255, 255, 255, 0.22);
  padding-left: 24px;
}

.hero-section__highlights svg {
  width: 20px;
  height: 20px;
  color: var(--lime);
}

.hero-section__highlights strong,
.hero-section__highlights span {
  display: block;
}

.hero-section__highlights strong {
  font-size: 0.9rem;
  font-weight: 820;
}

.hero-section__highlights span {
  margin-top: 3px;
  color: rgba(255, 255, 255, 0.56);
  font-size: 0.72rem;
}

.hero-section__scroll {
  position: absolute;
  right: 12px;
  top: 50%;
  display: flex;
  gap: 10px;
  align-items: center;
  color: rgba(255, 255, 255, 0.48);
  font-size: 0.66rem;
  text-transform: uppercase;
  transform: rotate(90deg) translateX(50%);
  transform-origin: right center;
}

.hero-section__scroll span {
  width: 42px;
  height: 1px;
  background: rgba(255, 255, 255, 0.34);
}

@media (max-width: 760px) {
  .hero-section {
    min-height: 700px;
    height: 100svh;
  }

  .hero-section__image {
    object-position: 62% center;
  }

  .hero-section__overlay {
    background:
      linear-gradient(90deg, rgba(4, 17, 14, 0.84), rgba(4, 17, 14, 0.18)),
      linear-gradient(180deg, rgba(4, 17, 14, 0.52), rgba(4, 17, 14, 0.16) 38%, rgba(4, 17, 14, 0.92) 82%);
  }

  .hero-section__inner {
    width: min(100% - 32px, var(--container));
    align-content: end;
    padding: 108px 0 176px;
  }

  .hero-section h1 {
    font-size: clamp(3rem, 15vw, 4.5rem);
  }

  .hero-section__copy {
    max-width: 440px;
    font-size: 0.96rem;
  }

  .hero-section__highlights {
    right: 16px;
    bottom: 18px;
    left: 16px;
  }

  .hero-section__highlights article {
    min-height: 72px;
    gap: 8px;
    padding: 14px 8px 0 0;
  }

  .hero-section__highlights article + article {
    padding-left: 10px;
  }

  .hero-section__highlights svg {
    display: none;
  }

  .hero-section__highlights strong {
    font-size: 0.76rem;
  }

  .hero-section__highlights span {
    font-size: 0.64rem;
  }

  .hero-section__scroll {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-section__image {
    transform: none;
    transition: none;
  }
}

@media (max-width: 430px) {
  .hero-section__actions {
    display: grid;
  }

  .hero-section__primary,
  .hero-section__secondary {
    width: 100%;
  }
}
</style>
