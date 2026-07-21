<script setup lang="ts">
import type { PublicCourt } from '~/types/publicCourts'

const fallbackImages: Record<PublicCourt['courtType'], string> = {
  outdoor: '/courts/tennis-aerial.jpg',
  indoor: '/courts/tennis-courts-aerial.jpg'
}

const courtApi = usePublicCourtsApi()
const { data: courts, pending, error, refresh } = await useAsyncData(
  'public-court-showcase',
  () => courtApi.list(),
  { default: () => [], server: false }
)

function courtImage(court: PublicCourt) {
  return court.imageUrl || fallbackImages[court.courtType]
}

function courtTypeLabel(court: PublicCourt) {
  return court.courtType === 'indoor' ? 'Indoor' : 'Outdoor'
}

function courtLightingLabel(court: PublicCourt) {
  return court.courtType === 'indoor'
    ? 'Ambient i mbyllur për lojë gjatë çdo sezoni'
    : 'Lojë në ajër të hapur'
}

function courtNumber(index: number) {
  return String(index + 1).padStart(2, '0')
}

function retry() {
  void refresh()
}
</script>

<template>
  <section
    id="fushat"
    class="court-showcase"
    aria-labelledby="courts-title"
  >
    <header class="court-showcase__heading">
      <div>
        <p>Fushat aktive</p>
        <h2 id="courts-title">
          Zgjidh ambientin.
        </h2>
      </div>
      <span>Çdo fushë aktive rezervohet online, sipas datës dhe orarit të lirë.</span>
    </header>

    <div
      v-if="pending && !courts.length"
      class="court-showcase__state"
      role="status"
      aria-live="polite"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="court-showcase__spinner"
        aria-hidden="true"
      />
      <div>
        <strong>Po ngarkohen fushat</strong>
        <span>Vetëm fushat aktive do të shfaqen këtu.</span>
      </div>
    </div>

    <div
      v-else-if="error && !courts.length"
      class="court-showcase__state court-showcase__state--error"
      role="alert"
    >
      <UIcon
        name="i-lucide-circle-alert"
        aria-hidden="true"
      />
      <div>
        <strong>Fushat nuk u ngarkuan</strong>
        <span>Provo përsëri pas pak.</span>
      </div>
      <UButton
        color="neutral"
        variant="outline"
        size="sm"
        label="Provo përsëri"
        @click="retry"
      />
    </div>

    <div
      v-else-if="courts.length"
      class="court-showcase__grid"
    >
      <NuxtLink
        v-for="(court, index) in courts"
        :key="court.id"
        :to="{ path: '/rezervo', query: { court: court.id } }"
        class="court-card"
      >
        <img
          :src="courtImage(court)"
          :alt="court.name"
          width="1200"
          height="900"
          loading="lazy"
        >
        <div class="court-card__shade" />
        <span class="court-card__number">{{ courtNumber(index) }}</span>
        <div class="court-card__content">
          <p>{{ courtTypeLabel(court) }}</p>
          <h3>{{ court.name }}</h3>
          <span>{{ courtLightingLabel(court) }}</span>
        </div>
        <span
          class="court-card__action"
          aria-hidden="true"
        >
          <UIcon name="i-lucide-arrow-up-right" />
        </span>
      </NuxtLink>
    </div>

    <div
      v-else
      class="court-showcase__state"
      role="status"
    >
      <UIcon
        name="i-lucide-trophy"
        aria-hidden="true"
      />
      <div>
        <strong>Nuk ka fusha aktive për momentin</strong>
        <span>Kontakto akademinë për më shumë informata.</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.court-showcase {
  padding: clamp(82px, 10vw, 144px) max(16px, 4vw);
  background: #FFFFFF;
  color: var(--ink);
}

.court-showcase__heading,
.court-showcase__grid,
.court-showcase__state {
  width: min(var(--container), 100%);
  margin-inline: auto;
}

.court-showcase__heading {
  display: grid;
  grid-template-columns: 1fr minmax(260px, 420px);
  gap: 30px;
  align-items: end;
  margin-bottom: 38px;
}

.court-showcase__heading p {
  margin: 0 0 12px;
  color: #1A6B55;
  font-size: 0.7rem;
  font-weight: 840;
  text-transform: uppercase;
}

.court-showcase__heading h2 {
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.5rem, 5vw, 4.8rem);
  font-weight: 500;
  line-height: 1;
}

.court-showcase__heading > span {
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.62;
}

.court-showcase__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.court-showcase__state {
  min-height: 180px;
  display: flex;
  gap: 16px;
  align-items: center;
  border: 1px dashed var(--line);
  padding: 28px;
  background: #FAFBF8;
  color: var(--muted);
}

.court-showcase__state > svg {
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  color: #1A6B55;
}

.court-showcase__state strong,
.court-showcase__state span {
  display: block;
}

.court-showcase__state strong {
  color: var(--ink);
  font-size: 0.88rem;
}

.court-showcase__state span {
  margin-top: 4px;
  font-size: 0.78rem;
}

.court-showcase__state :deep(button) {
  margin-left: auto;
}

.court-showcase__state--error > svg {
  color: var(--coral);
}

.court-showcase__spinner {
  animation: court-showcase-spin 900ms linear infinite;
}

.court-card {
  position: relative;
  min-height: 570px;
  display: grid;
  align-content: end;
  overflow: hidden;
  padding: 30px;
  color: #FFFFFF;
  text-decoration: none;
  isolation: isolate;
}

.court-card > img,
.court-card__shade {
  position: absolute;
  inset: 0;
}

.court-card > img {
  z-index: -3;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 700ms cubic-bezier(.2,.7,.2,1);
}

.court-card:first-child > img {
  object-position: center 64%;
}

.court-card__shade {
  z-index: -2;
  background: linear-gradient(180deg, rgba(6, 19, 16, 0.1), rgba(6, 19, 16, 0.82));
}

.court-card:hover > img {
  transform: scale(1.035);
}

.court-card__number {
  position: absolute;
  top: 24px;
  left: 24px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.72rem;
  font-weight: 820;
}

.court-card__content p,
.court-card__content h3,
.court-card__content > span {
  margin: 0;
}

.court-card__content p {
  color: var(--lime);
  font-size: 0.7rem;
  font-weight: 820;
  text-transform: uppercase;
}

.court-card__content h3 {
  margin-top: 8px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2rem, 4vw, 3.7rem);
  font-weight: 500;
  line-height: 1;
}

.court-card__content > span {
  display: block;
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.66);
  font-size: 0.78rem;
}

.court-card__action {
  position: absolute;
  right: 24px;
  bottom: 24px;
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--lime);
  color: var(--ink);
}

.court-card__action svg {
  width: 19px;
  height: 19px;
}

@keyframes court-showcase-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 760px) {
  .court-showcase__heading,
  .court-showcase__grid {
    grid-template-columns: 1fr;
  }

  .court-showcase__heading {
    gap: 14px;
  }

  .court-card {
    min-height: 460px;
    padding: 24px;
  }

  .court-showcase__state {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .court-showcase__state :deep(button) {
    width: 100%;
    margin-left: 42px;
  }
}
</style>
