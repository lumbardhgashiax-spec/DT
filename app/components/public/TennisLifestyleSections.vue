<script setup lang="ts">
import { computed, ref } from 'vue'

const experience = [
  { number: '01', icon: 'i-lucide-layout-grid', title: 'Zgjidh ambientin', copy: 'Outdoor ose indoor, sipas lojes dhe motit.' },
  { number: '02', icon: 'i-lucide-calendar-days', title: 'Gjej termin', copy: 'Zgjidh daten dhe shiko oraret e lira.' },
  { number: '03', icon: 'i-lucide-circle-check', title: 'Dil ne fushe', copy: 'Dergo rezervimin pa hapur llogari.' }
]

const benefits = [
  {
    icon: 'i-lucide-focus',
    label: 'Fokus',
    title: 'Shiko topin. Lexo piken.',
    copy: 'Tenisi kerkon vemendje te vazhdueshme: nga momenti i goditjes deri te pozicionimi per topin e radhes.',
    image: '/courts/diamond-coaching-editorial.webp',
    alt: 'Trajner duke udhezu nje lojtare ne tekniken e forehand-it'
  },
  {
    icon: 'i-lucide-zap',
    label: 'Reagim',
    title: 'Pergatitu para se te vije topi.',
    copy: 'Hapat e vegjel dhe raketa gati te ndihmojne te reagosh me kontroll, jo vetem me shpejtesi.',
    image: '/hero/diamond-blue-hour-rally.webp',
    alt: 'Dy lojtare duke zhvilluar nje pike tenisi ne mbremje'
  },
  {
    icon: 'i-lucide-heart-pulse',
    label: 'Levizje',
    title: 'Balanca e ben goditjen me te lire.',
    copy: 'Pozicionimi i mire e lidh levizjen e kembeve me ritmin e trupit dhe kontaktin e paster me topin.',
    image: '/hero/diamond-hero-training.webp',
    alt: 'Lojtare duke ushtruar levizjen me trajnerin'
  }
]

const seasonModes = [
  {
    icon: 'i-lucide-sun',
    label: 'Outdoor',
    eyebrow: 'Dite te hapura',
    title: 'Luaj jashte kur moti te fton.',
    copy: 'Zgjidh fushen outdoor per loje ne ajer te hapur dhe kontrollo terminet e lira sipas dates.'
  },
  {
    icon: 'i-lucide-warehouse',
    label: 'Indoor',
    eyebrow: 'Ambient i mbuluar',
    title: 'Vazhdo lojen kur sezoni ndryshon.',
    copy: 'Zgjidh fushen indoor kur eshte aktive dhe shto sherbimet qe shfaqen per termin e zgjedhur.'
  }
]

const activeBenefit = ref(0)
const activeSeason = ref(0)
const selectedBenefit = computed(() => benefits[activeBenefit.value] ?? benefits[0]!)
const selectedSeason = computed(() => seasonModes[activeSeason.value] ?? seasonModes[0]!)
</script>

<template>
  <div class="tennis-story">
    <section class="tennis-story__intro" aria-labelledby="story-title">
      <div class="tennis-story__intro-inner">
        <div class="tennis-story__lead">
          <p><span aria-hidden="true" /> Nga rezervimi ne fushe</p>
          <h2 id="story-title">Me pak organizim.<br><em>Me shume tenis.</em></h2>
          <div class="tennis-story__description">
            <p>
              Zgjidh ambientin, daten dhe terminin. Pjesa tjeter mbetet vetem loja jote ne Diamond Tennis Academy.
            </p>
            <UButton
              to="/#availability"
              color="primary"
              size="lg"
              label="Kontrollo oraret"
              trailing-icon="i-lucide-arrow-down-right"
              class="tennis-story__cta"
            />
          </div>
        </div>

        <figure class="tennis-story__media">
          <img
            src="/hero/diamond-hero-lifestyle.webp"
            width="1776"
            height="887"
            alt="Dy lojtare duke ecur ne fushen e tenisit pas lojes"
            loading="lazy"
          >
          <figcaption>
            <span>Diamond Tennis Academy</span>
            <strong>Hajvali / Prishtine</strong>
          </figcaption>
        </figure>

        <div class="tennis-story__features" aria-label="Tre hapa per rezervim">
          <article v-for="item in experience" :key="item.number">
            <div class="tennis-story__feature-head">
              <UIcon :name="item.icon" aria-hidden="true" />
              <span class="tennis-story__feature-number">{{ item.number }}</span>
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.copy }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="coaching-editorial" aria-labelledby="learn-title">
      <div class="coaching-editorial__inner">
        <div class="coaching-editorial__heading">
          <div>
            <p>Meso tenis</p>
            <h2 id="learn-title">Teknika e mire e ben lojen me te lire.</h2>
          </div>
          <p>
            Nga kapja e raketes te pozicionimi dhe ritmi i goditjes, bazat e qarta ndihmojne cdo lojtar te ndihet me i sigurt ne fushe.
          </p>
        </div>

        <div class="coaching-editorial__workspace">
          <div
            class="coaching-editorial__tabs"
            role="tablist"
            aria-label="Dobite e tenisit"
          >
            <button
              v-for="(item, index) in benefits"
              :id="`benefit-tab-${index}`"
              :key="item.label"
              type="button"
              role="tab"
              :aria-selected="activeBenefit === index"
              :aria-controls="`benefit-panel-${index}`"
              :class="{ 'is-active': activeBenefit === index }"
              @click="activeBenefit = index"
            >
              <UIcon :name="item.icon" aria-hidden="true" />
              <strong>{{ item.label }}</strong>
              <span>0{{ index + 1 }}</span>
            </button>
          </div>

          <div class="coaching-editorial__media">
            <Transition name="content-fade" mode="out-in">
              <img
                :key="selectedBenefit.image"
                :src="selectedBenefit.image"
                width="1600"
                height="1067"
                :alt="selectedBenefit.alt"
                loading="lazy"
              >
            </Transition>
            <span>Teknike / Praktike</span>
          </div>

          <div
            :id="`benefit-panel-${activeBenefit}`"
            class="coaching-editorial__panel"
            role="tabpanel"
            :aria-labelledby="`benefit-tab-${activeBenefit}`"
          >
            <Transition name="content-fade" mode="out-in">
              <div :key="selectedBenefit.label">
                <span>{{ selectedBenefit.label }}</span>
                <h3>{{ selectedBenefit.title }}</h3>
                <p>{{ selectedBenefit.copy }}</p>
              </div>
            </Transition>
            <UButton
              to="/meso-tenis"
              color="neutral"
              variant="link"
              label="Shiko udhezuesin per fillestare"
              trailing-icon="i-lucide-arrow-up-right"
              class="coaching-editorial__link"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="season-band" aria-labelledby="season-title">
      <div class="season-band__inner">
        <div class="season-band__identity">
          <p>Diamond Tennis / Hajvali</p>
          <div class="season-band__metric">
            <strong>365</strong>
            <div>
              <span>Dite</span>
              <em>Ritmi yt</em>
            </div>
          </div>
          <dl>
            <div>
              <dt><UIcon name="i-lucide-calendar-days" aria-hidden="true" /> Ditet</dt>
              <dd>Cdo dite</dd>
            </div>
            <div>
              <dt><UIcon name="i-lucide-clock-3" aria-hidden="true" /> Orari</dt>
              <dd>10:00 - 22:00</dd>
            </div>
          </dl>
        </div>

        <div class="season-band__content">
          <p>Loje gjate vitit</p>

          <div
            class="season-band__tabs"
            role="tablist"
            aria-label="Zgjidh ambientin sipas sezonit"
          >
            <button
              v-for="(item, index) in seasonModes"
              :id="`season-tab-${index}`"
              :key="item.label"
              type="button"
              role="tab"
              :aria-selected="activeSeason === index"
              :aria-controls="`season-panel-${index}`"
              :class="{ 'is-active': activeSeason === index }"
              @click="activeSeason = index"
            >
              <UIcon :name="item.icon" aria-hidden="true" />
              {{ item.label }}
            </button>
          </div>

          <Transition name="content-fade" mode="out-in">
            <div
              :id="`season-panel-${activeSeason}`"
              :key="selectedSeason.label"
              class="season-band__panel"
              role="tabpanel"
              :aria-labelledby="`season-tab-${activeSeason}`"
            >
              <span>{{ selectedSeason.eyebrow }}</span>
              <h2 id="season-title">{{ selectedSeason.title }}</h2>
              <p>{{ selectedSeason.copy }}</p>
            </div>
          </Transition>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tennis-story {
  --section-space: clamp(76px, 9vw, 126px);
  background: #FFFFFF;
  color: var(--ink);
}

.tennis-story__intro,
.coaching-editorial,
.season-band {
  width: min(var(--container), calc(100% - 32px));
  margin: 0 auto;
}

.tennis-story__intro {
  width: 100%;
  padding: var(--section-space) 0;
  overflow: hidden;
  background: #071612;
  color: #FFFFFF;
}

.tennis-story__intro-inner {
  width: min(var(--container), calc(100% - 48px));
  display: grid;
  grid-template-columns: minmax(340px, 0.78fr) minmax(0, 1.22fr);
  gap: 48px clamp(42px, 6vw, 92px);
  align-items: center;
  margin: 0 auto;
}

.tennis-story__lead {
  display: grid;
  align-content: center;
}

.tennis-story__lead > p,
.coaching-editorial__copy > p,
.season-band__copy p {
  margin: 0 0 14px;
  color: #1A6B55;
  font-size: 0.7rem;
  font-weight: 840;
  text-transform: uppercase;
}

.tennis-story__lead > p {
  display: flex;
  gap: 10px;
  align-items: center;
  color: rgba(255, 255, 255, 0.66);
}

.tennis-story__lead > p span {
  width: 26px;
  height: 2px;
  background: var(--lime);
}

.tennis-story__lead h2,
.coaching-editorial__copy h2,
.season-band__copy h2 {
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-weight: 500;
  letter-spacing: 0;
}

.tennis-story__lead h2 {
  max-width: 650px;
  color: #FFFFFF;
  font-size: clamp(2.8rem, 5vw, 5.2rem);
  line-height: 0.98;
}

.tennis-story__lead h2 em {
  color: var(--lime);
  font-weight: 500;
}

.tennis-story__description {
  max-width: 480px;
  margin-top: 30px;
}

.tennis-story__description p {
  margin: 0;
  color: rgba(255, 255, 255, 0.66);
  font-size: 0.94rem;
  line-height: 1.72;
}

.tennis-story__cta {
  min-height: 50px;
  margin-top: 26px;
  border-radius: 5px;
  padding-inline: 18px;
  color: var(--ink);
  background: var(--lime);
  font-size: 0.84rem;
  font-weight: 830;
}

.tennis-story__media {
  position: relative;
  height: 500px;
  margin: 0;
  overflow: hidden;
  background: #12251F;
}

.tennis-story__media::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(180deg, transparent 56%, rgba(4, 17, 14, 0.76));
  pointer-events: none;
}

.tennis-story__media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
  transition: transform 700ms cubic-bezier(.2,.75,.25,1);
}

.tennis-story__media:hover img {
  transform: scale(1.025);
}

.tennis-story__media figcaption {
  position: absolute;
  z-index: 1;
  right: 22px;
  bottom: 20px;
  left: 22px;
  display: flex;
  justify-content: space-between;
  align-items: end;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  padding-top: 14px;
  color: #FFFFFF;
}

.tennis-story__media figcaption span,
.tennis-story__media figcaption strong {
  font-size: 0.68rem;
  font-weight: 780;
}

.tennis-story__media figcaption span {
  color: rgba(255, 255, 255, 0.64);
}

.tennis-story__features {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid rgba(255, 255, 255, 0.18);
}

.tennis-story__features article {
  min-height: 174px;
  padding: 24px 32px 0 0;
}

.tennis-story__features article + article {
  border-left: 1px solid rgba(255, 255, 255, 0.18);
  padding-left: 32px;
}

.tennis-story__feature-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tennis-story__feature-head > :first-child {
  width: 20px;
  height: 20px;
  color: var(--lime);
}

.tennis-story__feature-number {
  color: var(--coral);
  font-size: 0.68rem;
  font-weight: 860;
}

.tennis-story__features h3 {
  margin: 18px 0 0;
  color: #FFFFFF;
  font-size: 0.98rem;
  font-weight: 840;
}

.tennis-story__features p {
  max-width: 300px;
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.56);
  font-size: 0.82rem;
  line-height: 1.6;
}

.coaching-editorial,
.season-band {
  width: 100%;
  padding: var(--section-space) 0;
}

.coaching-editorial {
  background: #F5F7F1;
}

.coaching-editorial__inner,
.season-band__inner {
  width: min(var(--container), calc(100% - 48px));
  margin: 0 auto;
}

.coaching-editorial__heading {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.52fr);
  gap: clamp(34px, 7vw, 96px);
  align-items: end;
}

.coaching-editorial__heading > div > p {
  margin: 0 0 14px;
  color: #1A6B55;
  font-size: 0.7rem;
  font-weight: 840;
  text-transform: uppercase;
}

.coaching-editorial__heading h2 {
  max-width: 760px;
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.5rem, 4.8vw, 4.7rem);
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0;
}

.coaching-editorial__heading > p {
  margin: 0;
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.7;
}

.coaching-editorial__workspace {
  display: grid;
  grid-template-columns: minmax(170px, 0.22fr) minmax(0, 0.46fr) minmax(270px, 0.32fr);
  min-height: 520px;
  margin-top: 48px;
  background: #E7EDE8;
}

.coaching-editorial__tabs {
  display: grid;
  border-block: 1px solid rgba(10, 23, 20, 0.13);
  background: #FFFFFF;
}

.coaching-editorial__tabs button {
  display: grid;
  grid-template-columns: 24px 1fr 22px;
  gap: 10px;
  align-items: center;
  border: 0;
  border-bottom: 1px solid rgba(10, 23, 20, 0.13);
  padding: 20px;
  color: var(--ink);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: color 180ms ease, background-color 180ms ease;
}

.coaching-editorial__tabs button:last-child {
  border-bottom: 0;
}

.coaching-editorial__tabs button:hover,
.coaching-editorial__tabs button.is-active {
  color: #FFFFFF;
  background: var(--forest);
}

.coaching-editorial__tabs button svg {
  width: 18px;
  height: 18px;
  color: #1A6B55;
}

.coaching-editorial__tabs button:hover svg,
.coaching-editorial__tabs button.is-active svg {
  color: var(--lime);
}

.coaching-editorial__tabs button strong {
  font-size: 0.78rem;
  font-weight: 820;
}

.coaching-editorial__tabs button span {
  color: var(--coral);
  font-size: 0.62rem;
  font-weight: 840;
}

.coaching-editorial__tabs button:focus-visible,
.season-band__tabs button:focus-visible {
  position: relative;
  z-index: 1;
  outline: 2px solid var(--lime);
  outline-offset: -3px;
}

.coaching-editorial__media {
  position: relative;
  min-height: 520px;
  overflow: hidden;
  background: #12251F;
}

.coaching-editorial__media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.coaching-editorial__media > span {
  position: absolute;
  right: 16px;
  bottom: 16px;
  border-radius: 999px;
  padding: 7px 10px;
  color: #FFFFFF;
  background: rgba(4, 17, 14, 0.72);
  font-size: 0.62rem;
  font-weight: 760;
  backdrop-filter: blur(10px);
}

.coaching-editorial__panel {
  display: grid;
  align-content: center;
  justify-items: start;
  padding: clamp(28px, 4vw, 58px);
}

.coaching-editorial__panel > div > span {
  color: #1A6B55;
  font-size: 0.66rem;
  font-weight: 840;
  text-transform: uppercase;
}

.coaching-editorial__panel h3 {
  margin: 15px 0 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.7rem, 2.7vw, 2.7rem);
  font-weight: 500;
  line-height: 1.08;
}

.coaching-editorial__panel p {
  margin: 18px 0 0;
  color: var(--muted);
  font-size: 0.84rem;
  line-height: 1.68;
}

.coaching-editorial__link {
  margin-top: 26px;
  padding: 0;
  color: var(--ink);
  font-size: 0.76rem;
  font-weight: 820;
}

.season-band {
  position: relative;
  overflow: hidden;
  background: var(--forest);
  color: #FFFFFF;
}

.season-band::before,
.season-band::after {
  position: absolute;
  content: '';
  pointer-events: none;
}

.season-band::before {
  inset: 11% 5%;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.season-band::after {
  top: 11%;
  bottom: 11%;
  left: 50%;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
}

.season-band__inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(280px, 0.72fr) minmax(0, 1.28fr);
  gap: clamp(50px, 9vw, 130px);
  align-items: center;
  min-height: 520px;
}

.season-band__identity {
  display: grid;
  align-content: center;
}

.season-band__identity > p {
  margin: 0 0 22px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.64rem;
  font-weight: 800;
  text-transform: uppercase;
}

.season-band__metric {
  display: flex;
  gap: 22px;
  align-items: end;
}

.season-band__metric > strong {
  color: var(--lime);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(6.5rem, 13vw, 11rem);
  font-weight: 500;
  line-height: 0.74;
}

.season-band__metric > div {
  display: grid;
  gap: 3px;
  padding-bottom: 8px;
}

.season-band__metric span,
.season-band__metric em {
  font-style: normal;
  text-transform: uppercase;
}

.season-band__metric span {
  color: #FFFFFF;
  font-size: 0.72rem;
  font-weight: 850;
}

.season-band__metric em {
  color: rgba(255, 255, 255, 0.52);
  font-size: 0.62rem;
  font-weight: 760;
}

.season-band__identity dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 40px 0 0;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
}

.season-band__identity dl > div {
  padding: 18px 16px 0 0;
}

.season-band__identity dl > div + div {
  border-left: 1px solid rgba(255, 255, 255, 0.16);
  padding-left: 18px;
}

.season-band__identity dt {
  display: flex;
  gap: 7px;
  align-items: center;
  color: rgba(255, 255, 255, 0.48);
  font-size: 0.6rem;
}

.season-band__identity dt svg {
  width: 14px;
  height: 14px;
  color: var(--coral);
}

.season-band__identity dd {
  margin: 7px 0 0;
  color: #FFFFFF;
  font-size: 0.72rem;
  font-weight: 800;
}

.season-band__content > p {
  margin: 0 0 18px;
  color: var(--lime);
  font-size: 0.68rem;
  font-weight: 840;
  text-transform: uppercase;
}

.season-band__panel {
  min-height: 245px;
  margin-top: 34px;
}

.season-band__panel > span {
  color: var(--coral);
  font-size: 0.66rem;
  font-weight: 800;
  text-transform: uppercase;
}

.season-band__panel h2 {
  max-width: 700px;
  margin: 12px 0 0;
  color: #FFFFFF;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.3rem, 4.3vw, 4.3rem);
  font-weight: 500;
  line-height: 1;
}

.season-band__panel > p {
  max-width: 560px;
  min-height: 52px;
  margin: 20px 0 0;
  color: rgba(255, 255, 255, 0.64);
  font-size: 0.86rem;
  line-height: 1.65;
}

.season-band__tabs {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.season-band__tabs button {
  min-height: 48px;
  display: flex;
  gap: 9px;
  align-items: center;
  justify-content: center;
  border: 0;
  padding: 0 18px;
  color: rgba(255, 255, 255, 0.64);
  background: transparent;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
}

.season-band__tabs button + button {
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.season-band__tabs button.is-active {
  color: var(--ink);
  background: var(--lime);
}

.season-band__tabs svg {
  width: 17px;
  height: 17px;
}

.content-fade-enter-active,
.content-fade-leave-active {
  transition: opacity 200ms ease;
}

.content-fade-enter-from,
.content-fade-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .tennis-story__features {
    grid-template-columns: 1fr;
  }

  .tennis-story__features article + article {
    border-left: 0;
    padding-left: 0;
  }

  .tennis-story__features article {
    min-height: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.18);
    padding: 22px 0;
  }

  .tennis-story__intro-inner {
    grid-template-columns: 1fr;
  }

  .tennis-story__media {
    height: 440px;
  }

  .coaching-editorial__heading,
  .season-band__inner {
    grid-template-columns: 1fr;
  }

  .coaching-editorial__workspace {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .coaching-editorial__tabs {
    grid-column: 1 / -1;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .coaching-editorial__tabs button {
    border-right: 1px solid rgba(10, 23, 20, 0.13);
    border-bottom: 0;
  }

  .coaching-editorial__tabs button:last-child {
    border-right: 0;
  }

  .coaching-editorial__media {
    min-height: 440px;
  }

  .season-band__inner {
    gap: 54px;
  }
}

@media (max-width: 560px) {
  .tennis-story {
    --section-space: 64px;
  }

  .tennis-story__intro-inner {
    width: calc(100% - 32px);
    gap: 34px;
  }

  .tennis-story__lead h2 {
    font-size: clamp(2.7rem, 13vw, 4rem);
  }

  .tennis-story__media {
    height: 390px;
  }

  .tennis-story__media img {
    object-position: 78% center;
  }

  .tennis-story__media figcaption {
    right: 16px;
    bottom: 16px;
    left: 16px;
  }

  .coaching-editorial__inner,
  .season-band__inner {
    width: calc(100% - 32px);
  }

  .coaching-editorial__heading {
    gap: 22px;
  }

  .coaching-editorial__heading h2 {
    font-size: clamp(2.5rem, 12vw, 3.5rem);
  }

  .coaching-editorial__workspace {
    grid-template-columns: 1fr;
    margin-top: 34px;
  }

  .coaching-editorial__tabs {
    grid-column: auto;
  }

  .coaching-editorial__tabs button {
    min-height: 90px;
    grid-template-columns: 1fr;
    justify-items: center;
    gap: 7px;
    padding: 12px 8px;
  }

  .coaching-editorial__tabs button span {
    display: none;
  }

  .coaching-editorial__media {
    min-height: 340px;
  }

  .coaching-editorial__panel {
    min-height: 360px;
    padding: 32px 22px;
  }

  .season-band::before {
    inset: 32px 16px;
  }

  .season-band::after {
    display: none;
  }

  .season-band__inner {
    gap: 48px;
    min-height: 0;
  }

  .season-band__metric {
    gap: 14px;
  }

  .season-band__metric > strong {
    font-size: clamp(6.5rem, 31vw, 8.5rem);
  }

  .season-band__metric > div {
    padding-bottom: 5px;
  }

  .season-band__identity dl {
    margin-top: 30px;
  }

  .season-band__panel {
    min-height: 220px;
    margin-top: 30px;
  }

  .season-band__panel h2 {
    font-size: clamp(2.4rem, 11vw, 3.4rem);
  }

  .season-band__tabs {
    width: 100%;
  }

  .season-band__tabs button {
    padding-inline: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .content-fade-enter-active,
  .content-fade-leave-active {
    transition: none;
  }
}
</style>
