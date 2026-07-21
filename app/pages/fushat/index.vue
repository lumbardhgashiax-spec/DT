<script setup lang="ts">
import { businessConfig } from '~/config/business'
import type { PublicCourt } from '~/types/publicCourts'

const activeCourtIndex = ref(0)

const fallbackImages: Record<PublicCourt['courtType'], string> = {
  outdoor: '/courts/tennis-aerial.jpg',
  indoor: '/courts/tennis-courts-aerial.jpg'
}

const courtApi = usePublicCourtsApi()
const { data: courtData, pending, error, refresh } = await useAsyncData(
  'public-courts-page',
  () => courtApi.list(),
  { default: () => [], server: false }
)

const courts = computed(() => courtData.value)
const activeCourt = computed(() => courts.value[activeCourtIndex.value] ?? null)
const activeMeta = computed(() => activeCourt.value ? courtMeta(activeCourt.value) : null)

watch(courts, (nextCourts) => {
  if (!nextCourts.length || activeCourtIndex.value >= nextCourts.length) {
    activeCourtIndex.value = 0
  }
}, { immediate: true })

function courtMeta(court: PublicCourt) {
  if (court.courtType === 'indoor') {
    return {
      eyebrow: 'Lojë në ambient të mbyllur',
      headline: 'Vazhdo lojën në çdo sezon.',
      icon: 'i-lucide-warehouse',
      note: 'Ambient i mbuluar për vazhdimësi të lojës gjatë gjithë vitit.',
      features: [
        { icon: 'i-lucide-warehouse', label: 'Ambienti', value: 'Indoor' },
        { icon: 'i-lucide-calendar-days', label: 'Rezervimi', value: 'Online' },
        { icon: 'i-lucide-clock-3', label: 'Orari', value: businessConfig.hours.range }
      ]
    }
  }

  return {
    eyebrow: 'Lojë në ajër të hapur',
    headline: 'Hapësirë e hapur. Ritmi yt.',
    icon: 'i-lucide-sun',
    note: 'Zgjedhje për lojë në ambient të hapur dhe termine sipas orarit të lirë.',
    features: [
      { icon: 'i-lucide-sun', label: 'Ambienti', value: 'Outdoor' },
      { icon: 'i-lucide-calendar-days', label: 'Rezervimi', value: 'Online' },
      { icon: 'i-lucide-clock-3', label: 'Orari', value: businessConfig.hours.range }
    ]
  }
}

function courtImage(court: PublicCourt) {
  return court.imageUrl || fallbackImages[court.courtType]
}

function courtTypeLabel(court: PublicCourt) {
  return court.courtType === 'indoor' ? 'Indoor' : 'Outdoor'
}

function courtTypeIcon(court: PublicCourt) {
  return court.courtType === 'indoor' ? 'i-lucide-warehouse' : 'i-lucide-sun'
}

function courtNumber(index: number) {
  return String(index + 1).padStart(2, '0')
}

function courtLighting(court: PublicCourt) {
  return court.courtType === 'indoor' ? 'Ambient i mbuluar' : 'Për lojë në ajër të hapur'
}

function courtSeason(court: PublicCourt) {
  return court.courtType === 'indoor' ? 'Për çdo sezon' : 'Sipas motit'
}

function selectCourt(index: number) {
  activeCourtIndex.value = index
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
  title: 'Fushat e tenisit ne Hajvali',
  description: 'Eksploro fushat aktive të Diamond Tennis Academy në Hajvali. Shiko ambientin dhe rezervo online datën dhe orën.'
})

useHead(() => ({
  script: [{
    key: 'public-courts-list',
    type: 'application/ld+json',
    innerHTML: schemaJson({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'Fushat e Diamond Tennis Academy',
      'itemListElement': courts.value.map((court, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': court.name,
        'url': `/fushat/${court.id}`
      }))
    })
  }]
}))
</script>

<template>
  <main
    v-if="activeCourt && activeMeta"
    class="courts-page"
  >
    <section
      class="court-explorer"
      aria-labelledby="courts-title"
    >
      <Transition
        name="court-image"
        mode="out-in"
      >
        <img
          :key="activeCourt.id"
          class="court-explorer__image"
          :src="courtImage(activeCourt)"
          :alt="activeCourt.name"
          width="1600"
          height="1067"
          fetchpriority="high"
        >
      </Transition>
      <div
        class="court-explorer__shade"
        aria-hidden="true"
      />

      <div class="court-explorer__inner">
        <div class="court-explorer__copy">
          <p><span aria-hidden="true" /> Fushat / Hajvali</p>
          <h1 id="courts-title">
            Zgjidh ambientin<br><em>per lojen tende.</em>
          </h1>
          <span>
            Zgjidh fushën që përshtatet me mënyrën tënde të lojës dhe kontrollo terminin e lirë online.
          </span>
          <div class="court-explorer__actions">
            <UButton
              :to="{ path: '/rezervo', query: { court: activeCourt.id } }"
              color="neutral"
              size="lg"
              label="Rezervo kete fushe"
              icon="i-lucide-calendar-check-2"
              trailing-icon="i-lucide-arrow-right"
              class="court-explorer__primary public-lime-button"
            />
            <UButton
              :to="`/fushat/${activeCourt.id}`"
              color="neutral"
              variant="ghost"
              size="lg"
              label="Shiko detajet"
              trailing-icon="i-lucide-arrow-up-right"
              class="court-explorer__secondary"
            />
          </div>
        </div>

        <div
          class="court-switcher"
          role="tablist"
          aria-label="Zgjidh fushen"
        >
          <button
            v-for="(court, index) in courts"
            :id="`court-tab-${court.id}`"
            :key="court.id"
            type="button"
            role="tab"
            :aria-selected="activeCourtIndex === index"
            :aria-controls="`court-panel-${court.id}`"
            :class="{ 'is-active': activeCourtIndex === index }"
            @click="selectCourt(index)"
          >
            <span>{{ courtNumber(index) }}</span>
            <UIcon
              :name="courtTypeIcon(court)"
              aria-hidden="true"
            />
            <div>
              <small>{{ courtTypeLabel(court) }}</small>
              <strong>{{ court.name }}</strong>
            </div>
            <UIcon
              :name="activeCourtIndex === index ? 'i-lucide-check' : 'i-lucide-arrow-right'"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </section>

    <section
      class="court-profile"
      aria-labelledby="court-profile-title"
    >
      <div class="court-profile__intro">
        <p>Fusha aktive / {{ courtNumber(activeCourtIndex) }}</p>
        <span>Prek njeren fushe lart per te ndryshuar pamjen dhe informacionin.</span>
      </div>

      <Transition
        name="court-content"
        mode="out-in"
      >
        <div
          :id="`court-panel-${activeCourt.id}`"
          :key="activeCourt.id"
          class="court-profile__content"
          role="tabpanel"
          :aria-labelledby="`court-tab-${activeCourt.id}`"
        >
          <div class="court-profile__headline">
            <p>{{ activeMeta.eyebrow }}</p>
            <h2 id="court-profile-title">
              {{ activeMeta.headline }}
            </h2>
            <span>{{ activeMeta.note }}</span>
          </div>

          <div class="court-profile__facts">
            <article
              v-for="fact in activeMeta.features"
              :key="fact.label"
            >
              <UIcon
                :name="fact.icon"
                aria-hidden="true"
              />
              <span>{{ fact.label }}</span>
              <strong>{{ fact.value }}</strong>
            </article>
          </div>

          <div class="court-profile__schedule">
            <span>Orari i fushave</span>
            <strong>{{ businessConfig.hours.range }}</strong>
            <p>{{ businessConfig.hours.label }} / Rezervimi behet sipas termineve te lira.</p>
            <UButton
              :to="{ path: '/rezervo', query: { court: activeCourt.id } }"
              color="neutral"
              size="lg"
              label="Shiko oraret e lira"
              trailing-icon="i-lucide-arrow-up-right"
              class="court-schedule__button public-lime-button"
            />
          </div>
        </div>
      </Transition>
    </section>

    <section
      class="court-compare"
      aria-labelledby="compare-title"
    >
      <header>
        <p>Krahasim i shpejte</p>
        <h2 id="compare-title">
          Cila fushe te pershtatet?
        </h2>
        <span>Zgjedhja behet sipas ambientit dhe sezonit. Terminin e lire e kontrollon gjate rezervimit.</span>
      </header>

      <div
        class="court-compare__table"
        :style="{ '--court-count': String(courts.length) }"
      >
        <div
          class="court-compare__head"
          aria-hidden="true"
        >
          <span>Tipari</span>
          <strong
            v-for="court in courts"
            :key="court.id"
          >{{ court.name }}</strong>
        </div>
        <div>
          <span>Ambienti</span>
          <strong
            v-for="court in courts"
            :key="court.id"
          >
            <UIcon :name="courtTypeIcon(court)" /> {{ courtTypeLabel(court) }}
          </strong>
        </div>
        <div>
          <span>Përshtatja</span>
          <strong
            v-for="court in courts"
            :key="court.id"
          >
            <UIcon name="i-lucide-check" /> {{ courtLighting(court) }}
          </strong>
        </div>
        <div>
          <span>Sezoni</span>
          <strong
            v-for="court in courts"
            :key="court.id"
          >
            <UIcon :name="court.courtType === 'indoor' ? 'i-lucide-warehouse' : 'i-lucide-cloud-sun'" /> {{ courtSeason(court) }}
          </strong>
        </div>
        <div>
          <span>Rezervimi</span>
          <strong
            v-for="court in courts"
            :key="court.id"
          >
            <UIcon name="i-lucide-calendar-check" /> Online
          </strong>
        </div>
      </div>
    </section>

    <section
      class="courts-final"
      aria-labelledby="courts-final-title"
    >
      <div>
        <p>Rezervimi</p>
        <h2 id="courts-final-title">
          Fusha. Data. Ora.<br><em>Pastaj loja.</em>
        </h2>
      </div>
      <div class="courts-final__steps">
        <span><b>01</b> Zgjidh fushen</span>
        <span><b>02</b> Zgjidh daten</span>
        <span><b>03</b> Shiko oraret e lira</span>
      </div>
      <UButton
        to="/rezervo"
        color="neutral"
        size="xl"
        label="Fillo rezervimin"
        icon="i-lucide-calendar-days"
        trailing-icon="i-lucide-arrow-right"
        class="courts-final__button public-lime-button"
      />
    </section>
  </main>

  <main
    v-else
    class="courts-page courts-page--state"
  >
    <section
      class="courts-page__state"
      :class="{ 'courts-page__state--error': error }"
      role="status"
      :aria-live="pending ? 'polite' : undefined"
    >
      <UIcon
        :name="pending ? 'i-lucide-loader-circle' : error ? 'i-lucide-circle-alert' : 'i-lucide-trophy'"
        :class="{ 'courts-page__spinner': pending }"
        aria-hidden="true"
      />
      <div>
        <p>{{ pending ? 'Po ngarkohen fushat' : error ? 'Fushat nuk u ngarkuan' : 'Nuk ka fusha aktive për momentin' }}</p>
        <span>{{ pending ? 'Po përgatisim fushat aktive për ty.' : error ? 'Provo përsëri pas pak.' : 'Kontakto akademinë për më shumë informata.' }}</span>
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
        to="/rezervo"
        color="primary"
        label="Shko te rezervimi"
        trailing-icon="i-lucide-arrow-right"
      />
    </section>
  </main>
</template>

<style scoped>
.courts-page {
  min-height: 100dvh;
  overflow: hidden;
  background: var(--page-bg);
  color: var(--ink);
}

.courts-page--state {
  display: grid;
  place-items: center;
  padding: 150px max(16px, 4vw) 90px;
}

.courts-page__state {
  width: min(620px, 100%);
  min-height: 230px;
  display: flex;
  gap: 16px;
  align-items: center;
  border: 1px dashed var(--line);
  padding: 30px;
  background: #FFFFFF;
  box-shadow: 0 20px 60px rgba(13, 35, 29, 0.07);
}

.courts-page__state > svg {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  color: #1A6B55;
}

.courts-page__state p,
.courts-page__state span {
  display: block;
}

.courts-page__state p {
  margin: 0;
  color: var(--ink);
  font-size: 0.95rem;
  font-weight: 820;
}

.courts-page__state span {
  margin-top: 5px;
  color: var(--muted);
  font-size: 0.8rem;
  line-height: 1.55;
}

.courts-page__state :deep(button),
.courts-page__state :deep(a) {
  margin-left: auto;
}

.courts-page__state--error > svg {
  color: var(--coral);
}

.courts-page__spinner {
  animation: courts-page-spin 900ms linear infinite;
}

@keyframes courts-page-spin {
  to { transform: rotate(360deg); }
}

.court-explorer {
  position: relative;
  min-height: min(860px, 100dvh);
  display: grid;
  align-items: end;
  overflow: hidden;
  isolation: isolate;
  background: var(--forest);
  color: #FFFFFF;
}

.court-explorer__image,
.court-explorer__shade {
  position: absolute;
  inset: 0;
}

.court-explorer__image {
  z-index: -3;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.court-explorer__shade {
  z-index: -2;
  background:
    linear-gradient(90deg, rgba(5, 18, 15, 0.9) 0%, rgba(5, 18, 15, 0.54) 48%, rgba(5, 18, 15, 0.12) 100%),
    linear-gradient(0deg, rgba(5, 18, 15, 0.92) 0%, transparent 52%);
}

.court-explorer__inner {
  width: min(var(--container), calc(100% - 48px));
  margin: 0 auto;
  padding: 150px 0 38px;
}

.court-explorer__copy {
  max-width: 680px;
}

.court-explorer__copy > p,
.court-profile__intro p,
.court-profile__headline > p,
.court-compare header p,
.courts-final > div:first-child > p {
  margin: 0;
  color: var(--lime);
  font-size: 0.7rem;
  font-weight: 840;
  text-transform: uppercase;
}

.court-explorer__copy > p {
  display: flex;
  gap: 10px;
  align-items: center;
}

.court-explorer__copy > p span {
  width: 24px;
  height: 2px;
  background: var(--coral);
}

.court-explorer h1 {
  margin: 18px 0 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(3rem, 6.4vw, 6rem);
  font-weight: 500;
  line-height: 0.96;
}

.court-explorer h1 em,
.courts-final h2 em {
  color: var(--lime);
  font-style: normal;
}

.court-explorer__copy > span {
  display: block;
  max-width: 540px;
  margin-top: 22px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.94rem;
  line-height: 1.65;
}

.court-explorer__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}

.court-explorer__primary,
.court-schedule__button,
.courts-final__button {
  width: 220px;
  min-height: 48px;
  border-radius: 4px;
  background: var(--lime);
  color: var(--ink);
  font-weight: 850;
}

.court-explorer__secondary {
  min-height: 48px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: 4px;
  color: #FFFFFF;
}

.court-switcher {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 68px;
  border-top: 1px solid rgba(255, 255, 255, 0.25);
}

.court-switcher button {
  min-width: 0;
  min-height: 108px;
  display: grid;
  grid-template-columns: 30px 24px minmax(0, 1fr) 22px;
  gap: 14px;
  align-items: center;
  border: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.25);
  padding: 18px 24px;
  background: rgba(9, 28, 23, 0.38);
  color: rgba(255, 255, 255, 0.65);
  text-align: left;
  cursor: pointer;
  transition: background 220ms ease, color 220ms ease;
}

.court-switcher button:first-child {
  border-left: 1px solid rgba(255, 255, 255, 0.25);
}

.court-switcher button:hover,
.court-switcher button.is-active {
  background: rgba(216, 255, 62, 0.96);
  color: var(--ink);
}

.court-switcher button > span {
  font-size: 0.7rem;
  font-weight: 800;
}

.court-switcher button > svg {
  width: 20px;
  height: 20px;
}

.court-switcher button > svg:last-child {
  justify-self: end;
}

.court-switcher small,
.court-switcher strong {
  display: block;
}

.court-switcher small {
  margin-bottom: 5px;
  font-size: 0.64rem;
  font-weight: 800;
  text-transform: uppercase;
}

.court-switcher strong {
  font-size: 0.92rem;
}

.court-profile,
.court-compare {
  width: min(var(--container), calc(100% - 48px));
  margin-inline: auto;
  padding-block: clamp(76px, 9vw, 124px);
}

.court-profile__intro {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--line);
}

.court-profile__intro p,
.court-profile__headline > p,
.court-compare header p {
  color: #1A6B55;
}

.court-profile__intro > span {
  color: var(--muted);
  font-size: 0.78rem;
}

.court-profile__content {
  min-height: 390px;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(310px, 0.85fr);
  gap: 64px;
  padding-top: 48px;
}

.court-profile__headline h2,
.court-compare h2,
.courts-final h2 {
  margin: 14px 0 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.4rem, 5vw, 4.7rem);
  font-weight: 500;
  line-height: 1;
}

.court-profile__headline > span {
  display: block;
  max-width: 580px;
  margin-top: 22px;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.7;
}

.court-profile__facts {
  grid-column: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  align-self: end;
  background: var(--line);
}

.court-profile__facts article {
  min-height: 132px;
  padding: 20px;
  background: #FFFFFF;
}

.court-profile__facts svg {
  width: 20px;
  height: 20px;
  color: var(--coral);
}

.court-profile__facts span,
.court-profile__facts strong {
  display: block;
}

.court-profile__facts span {
  margin-top: 24px;
  color: var(--muted);
  font-size: 0.65rem;
  text-transform: uppercase;
}

.court-profile__facts strong {
  margin-top: 4px;
  font-size: 0.86rem;
}

.court-profile__schedule {
  grid-column: 2;
  grid-row: 1 / span 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 34px;
  background: var(--forest);
  color: #FFFFFF;
}

.court-profile__schedule > span {
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
}

.court-profile__schedule > strong {
  margin-top: 12px;
  color: var(--lime);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: 500;
}

.court-profile__schedule > p {
  margin: 10px 0 28px;
  color: rgba(255, 255, 255, 0.64);
  font-size: 0.78rem;
  line-height: 1.6;
}

.court-profile__schedule :deep(a) {
  width: 220px;
  min-height: 48px;
  justify-content: space-between;
  border-radius: 4px;
  font-weight: 850;
}

.court-compare {
  border-top: 1px solid var(--line);
}

.court-compare header {
  display: grid;
  grid-template-columns: 1fr minmax(260px, 380px);
  gap: 24px;
  align-items: end;
  margin-bottom: 42px;
}

.court-compare header p {
  grid-column: 1 / -1;
}

.court-compare header > span {
  color: var(--muted);
  font-size: 0.84rem;
  line-height: 1.65;
}

.court-compare__table {
  border-top: 1px solid var(--ink);
}

.court-compare__table > div {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) repeat(var(--court-count), minmax(0, 1fr));
  gap: 18px;
  align-items: center;
  min-height: 72px;
  border-bottom: 1px solid var(--line);
}

.court-compare__table span {
  color: var(--muted);
  font-size: 0.75rem;
}

.court-compare__table strong {
  display: flex;
  gap: 9px;
  align-items: center;
  font-size: 0.82rem;
}

.court-compare__table svg {
  color: #1A6B55;
}

.court-compare__head {
  min-height: 50px !important;
  background: rgba(10, 23, 20, 0.035);
}

.court-compare__head > * {
  font-size: 0.65rem !important;
  text-transform: uppercase;
}

.courts-final {
  width: min(var(--container), calc(100% - 32px));
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 0.7fr) auto;
  gap: 48px;
  align-items: end;
  margin: 0 auto clamp(16px, 4vw, 48px);
  padding: clamp(48px, 6vw, 78px);
  background: var(--ink);
  color: #FFFFFF;
}

.courts-final h2 {
  font-size: clamp(2.35rem, 4.8vw, 4.5rem);
}

.courts-final__steps {
  display: grid;
  gap: 13px;
}

.courts-final__steps span {
  display: flex;
  gap: 14px;
  align-items: center;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.78rem;
}

.courts-final__steps b {
  color: var(--coral);
  font-size: 0.65rem;
}

.court-image-enter-active,
.court-image-leave-active {
  transition: opacity 500ms ease, transform 700ms ease;
}

.court-image-enter-from,
.court-image-leave-to {
  opacity: 0;
  transform: scale(1.025);
}

.court-content-enter-active,
.court-content-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.court-content-enter-from,
.court-content-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 900px) {
  .court-profile__content,
  .courts-final {
    grid-template-columns: 1fr;
  }

  .court-profile__schedule {
    grid-column: 1;
    grid-row: auto;
    min-height: 300px;
  }

  .courts-final {
    align-items: start;
  }

  .courts-final__button {
    width: 220px;
  }
}

@media (max-width: 640px) {
  .court-explorer {
    min-height: 760px;
  }

  .court-explorer__shade {
    background:
      linear-gradient(180deg, rgba(5, 18, 15, 0.3), rgba(5, 18, 15, 0.9) 55%, rgba(5, 18, 15, 0.98)),
      linear-gradient(90deg, rgba(5, 18, 15, 0.55), transparent);
  }

  .court-explorer__inner,
  .court-profile,
  .court-compare {
    width: calc(100% - 32px);
  }

  .court-explorer__inner {
    padding: 118px 0 18px;
  }

  .court-explorer h1 {
    font-size: clamp(2.75rem, 13vw, 4.1rem);
  }

  .court-explorer__copy > span {
    max-width: 320px;
  }

  .court-explorer__actions {
    display: grid;
  }

  .court-explorer__actions :deep(a) {
    width: 100%;
    justify-content: space-between;
  }

  .court-switcher {
    grid-template-columns: 1fr;
    margin-top: 40px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.25);
  }

  .court-switcher button {
    min-height: 76px;
    border-left: 1px solid rgba(255, 255, 255, 0.25);
    padding: 12px 16px;
  }

  .court-profile,
  .court-compare {
    padding-block: 64px;
  }

  .court-profile__intro,
  .court-compare header {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .court-profile__content {
    min-height: 0;
    grid-template-columns: 1fr;
    gap: 32px;
    padding-top: 34px;
  }

  .court-profile__headline h2,
  .court-compare h2 {
    font-size: clamp(2.3rem, 11vw, 3.35rem);
  }

  .court-profile__facts {
    grid-template-columns: 1fr;
  }

  .court-profile__facts article {
    min-height: 92px;
    display: grid;
    grid-template-columns: 24px 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 16px;
  }

  .court-profile__facts span,
  .court-profile__facts strong {
    margin: 0;
  }

  .court-profile__schedule {
    min-height: 270px;
    padding: 26px;
  }

  .court-compare header {
    margin-bottom: 30px;
  }

  .court-compare__table > div {
    grid-template-columns: minmax(92px, 0.8fr) repeat(var(--court-count), minmax(0, 1fr));
    gap: 8px;
    min-height: 86px;
  }

  .court-compare__table strong {
    display: grid;
    gap: 6px;
    font-size: 0.7rem;
  }

  .courts-final {
    width: calc(100% - 32px);
    gap: 32px;
    padding: 34px 24px;
  }

  .courts-final__button {
    width: 100%;
    justify-content: space-between;
  }

  .court-explorer__primary,
  .court-schedule__button {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
