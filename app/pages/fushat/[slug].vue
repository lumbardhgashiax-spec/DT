<script setup lang="ts">
import type { PublicCourt } from '~/types/publicCourts'

const route = useRoute()
const courtApi = usePublicCourtsApi()

const fallbackImages: Record<PublicCourt['courtType'], string> = {
  outdoor: '/courts/tennis-aerial.jpg',
  indoor: '/courts/tennis-courts-aerial.jpg'
}

const courtId = computed(() => {
  const value = route.params.slug
  return Array.isArray(value) ? value[0] || '' : value || ''
})

const { data: court, pending, error, refresh } = await useAsyncData(
  () => `public-court-${courtId.value || 'invalid'}`,
  () => courtApi.get(courtId.value),
  { default: () => null, watch: [courtId], server: false }
)

const heroImage = computed(() => court.value
  ? court.value.imageUrl || fallbackImages[court.value.courtType]
  : fallbackImages.outdoor
)

const additionalImages = computed(() => court.value?.images.slice(1) || [])

function courtTypeLabel(courtValue: PublicCourt) {
  return courtValue.courtType === 'indoor' ? 'Fushë e mbyllur' : 'Fushë e hapur'
}

function courtDescription(courtValue: PublicCourt) {
  return courtValue.courtType === 'indoor'
    ? 'Ambient i mbuluar për lojë gjatë çdo sezoni. Zgjidh datën dhe orën për të parë terminet e lira.'
    : 'Hapësirë për lojë në ajër të hapur. Zgjidh datën dhe orën për të parë terminet e lira.'
}

function courtLighting(courtValue: PublicCourt) {
  return courtValue.courtType === 'indoor' ? 'Ambient i mbuluar' : 'Lojë në ajër të hapur'
}

function retry() {
  void refresh()
}

function schemaJson(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

useSeoMeta({
  title: () => court.value?.name || 'Fusha e tenisit',
  description: () => court.value
    ? `${court.value.name} te Diamond Tennis Academy në Hajvali. Shiko detajet dhe rezervo online.`
    : 'Detaje për fushën e tenisit.'
})

useHead(() => ({
  script: court.value
    ? [{
        key: 'public-court-detail',
        type: 'application/ld+json',
        innerHTML: schemaJson({
          '@context': 'https://schema.org',
          '@type': 'SportsActivityLocation',
          'name': court.value.name,
          'url': `/fushat/${court.value.id}`
        })
      }]
    : []
}))
</script>

<template>
  <main
    v-if="court"
    class="court-detail"
  >
    <section class="court-detail__hero">
      <img
        :src="heroImage"
        :alt="court.name"
        width="960"
        height="680"
        fetchpriority="high"
      >
      <div>
        <p>{{ courtTypeLabel(court) }}</p>
        <h1>{{ court.name }}</h1>
        <span>{{ courtDescription(court) }}</span>
        <div class="court-detail__actions">
          <UButton
            :to="{ path: '/rezervo', query: { court: court.id } }"
            size="lg"
            color="neutral"
            icon="i-lucide-calendar-plus"
            label="Rezervo këtë fushë"
            class="court-detail__button public-lime-button"
          />
          <UButton
            to="/fushat"
            size="md"
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            label="Kthehu te fushat"
          />
        </div>
      </div>
    </section>

    <section class="court-detail__facts">
      <article>
        <UIcon :name="court.courtType === 'indoor' ? 'i-lucide-warehouse' : 'i-lucide-sun'" />
        <strong>Ambienti</strong>
        <span>{{ courtLighting(court) }}</span>
      </article>
      <article>
        <UIcon name="i-lucide-scan-line" />
        <strong>Sipërfaqja</strong>
        <span>Sipërfaqe sportive për tenis.</span>
      </article>
      <article>
        <UIcon name="i-lucide-calendar-check" />
        <strong>Rezervimi</strong>
        <span>Zgjidh fushën, datën dhe orën online para se të konfirmosh termin.</span>
      </article>
    </section>

    <section
      v-if="additionalImages.length"
      class="court-gallery"
      aria-labelledby="court-gallery-title"
    >
      <header>
        <p>Galeria</p>
        <h2 id="court-gallery-title">
          Shiko fushën.
        </h2>
      </header>
      <div>
        <img
          v-for="image in additionalImages"
          :key="image.id"
          :src="image.url"
          :alt="`${court.name} – pamje nga fusha`"
          width="1200"
          height="800"
          loading="lazy"
        >
      </div>
    </section>
  </main>

  <main
    v-else
    class="court-detail court-detail--state"
  >
    <section
      class="court-detail__state"
      :class="{ 'court-detail__state--error': error }"
      role="status"
      :aria-live="pending ? 'polite' : undefined"
    >
      <UIcon
        :name="pending ? 'i-lucide-loader-circle' : error ? 'i-lucide-circle-alert' : 'i-lucide-trophy'"
        :class="{ 'court-detail__spinner': pending }"
        aria-hidden="true"
      />
      <div>
        <strong>{{ pending ? 'Po ngarkohet fusha' : error ? 'Fusha nuk u gjet' : 'Nuk ka të dhëna për këtë fushë' }}</strong>
        <span>{{ pending ? 'Po përgatisim detajet për ty.' : error ? 'Mund të jetë çaktivizuar ose adresa nuk është valide.' : 'Kthehu te lista e fushave.' }}</span>
      </div>
      <UButton
        v-if="error"
        color="neutral"
        variant="outline"
        label="Provo përsëri"
        @click="retry"
      />
      <UButton
        v-else-if="!pending"
        to="/fushat"
        color="primary"
        label="Shiko fushat"
        trailing-icon="i-lucide-arrow-right"
      />
    </section>
  </main>
</template>

<style scoped>
.court-detail {
  min-height: 100dvh;
  background: #F7F6F1;
  color: #061735;
}

.court-detail__hero {
  display: grid;
  grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.05fr);
  gap: clamp(24px, 5vw, 68px);
  align-items: center;
  padding: calc(76px + clamp(42px, 7vw, 78px)) max(22px, 7vw) clamp(42px, 7vw, 78px);
}

.court-detail__hero img {
  width: 100%;
  height: min(54vw, 540px);
  min-height: 320px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 24px 72px rgba(6, 23, 53, 0.16);
}

.court-detail__hero p {
  margin: 0 0 12px;
  color: #C6A15B;
  font-size: 0.78rem;
  font-weight: 850;
  text-transform: uppercase;
}

.court-detail__hero h1 {
  margin: 0;
  font-size: clamp(1.85rem, 3.6vw, 3.05rem);
  line-height: 1.08;
}

.court-detail__hero span {
  display: block;
  max-width: 620px;
  margin-top: 18px;
  color: rgba(6, 23, 53, 0.68);
  line-height: 1.65;
}

.court-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.court-detail__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  padding: 0 max(22px, 7vw) clamp(52px, 8vw, 96px);
}

.court-detail__facts article {
  min-height: 180px;
  padding: 24px;
  background: #FFFFFF;
}

.court-detail__facts :deep(svg) {
  width: 28px;
  height: 28px;
  color: #C6A15B;
}

.court-detail__facts strong,
.court-detail__facts span {
  display: block;
}

.court-detail__facts strong {
  margin-top: 18px;
  font-size: 1rem;
}

.court-detail__facts span {
  margin-top: 8px;
  color: rgba(6, 23, 53, 0.64);
  line-height: 1.55;
}

.court-detail__button {
  min-height: 48px;
  border-radius: 999px;
  padding-inline: 18px;
  background: var(--lime);
  color: var(--ink);
  font-weight: 900;
}

.court-gallery {
  padding: 0 max(22px, 7vw) clamp(52px, 8vw, 96px);
}

.court-gallery header {
  margin-bottom: 20px;
}

.court-gallery header p {
  margin: 0;
  color: #C6A15B;
  font-size: 0.75rem;
  font-weight: 850;
  text-transform: uppercase;
}

.court-gallery h2 {
  margin: 8px 0 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2rem, 4vw, 3.4rem);
  font-weight: 500;
}

.court-gallery > div {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.court-gallery img {
  width: 100%;
  min-height: 230px;
  height: min(32vw, 370px);
  border-radius: 8px;
  object-fit: cover;
}

.court-detail--state {
  display: grid;
  place-items: center;
  padding: 140px max(22px, 7vw) 72px;
}

.court-detail__state {
  width: min(620px, 100%);
  min-height: 220px;
  display: flex;
  gap: 16px;
  align-items: center;
  border: 1px dashed rgba(6, 23, 53, 0.2);
  padding: 30px;
  background: #FFFFFF;
  box-shadow: 0 24px 72px rgba(6, 23, 53, 0.1);
}

.court-detail__state > svg {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  color: #C6A15B;
}

.court-detail__state strong,
.court-detail__state span {
  display: block;
}

.court-detail__state strong {
  font-size: 0.92rem;
}

.court-detail__state span {
  margin-top: 5px;
  color: rgba(6, 23, 53, 0.64);
  font-size: 0.8rem;
  line-height: 1.55;
}

.court-detail__state :deep(button),
.court-detail__state :deep(a) {
  margin-left: auto;
}

.court-detail__state--error > svg {
  color: #B73E50;
}

.court-detail__spinner {
  animation: court-detail-spin 900ms linear infinite;
}

@keyframes court-detail-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 850px) {
  .court-detail__hero,
  .court-detail__facts {
    grid-template-columns: 1fr;
  }

  .court-detail__hero img {
    height: 360px;
  }
}

@media (max-width: 560px) {
  .court-detail__hero {
    padding-top: calc(66px + clamp(34px, 7vw, 56px));
  }

  .court-detail__state {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .court-detail__state :deep(button),
  .court-detail__state :deep(a) {
    width: 100%;
    margin-left: 44px;
  }
}
</style>
