<script setup lang="ts">
import { computed, ref } from 'vue'

const basics = [
  {
    index: '01',
    title: 'Forehand',
    icon: 'i-lucide-move-up-right',
    image: '/hero/diamond-hero-training.webp',
    alt: 'Lojtare duke ushtruar forehand me trajnerin',
    copy: 'Goditja kryesore nga ana dominante. Nje levizje e qete dhe kontakti perpara trupit japin me shume kontroll.',
    cue: 'Kthe shpatullat, mbaj syte te topi dhe perfundo levizjen mbi shpatull.',
    drill: 'Luaj 10 goditje te ngadalshme diagonal pa kerkuar force.'
  },
  {
    index: '02',
    title: 'Backhand',
    icon: 'i-lucide-repeat-2',
    image: '/courts/diamond-coaching-editorial.webp',
    alt: 'Trajner duke shpjeguar tekniken e goditjes',
    copy: 'Goditja nga ana tjeter e trupit mund te luhet me nje ose dy duar. Per fillim, zgjidh variantin qe te jep stabilitet.',
    cue: 'Pergatite raketen heret dhe mbaje balancen gjate kthimit te trupit.',
    drill: 'Fillo nga mesi i fushes me topa te lehte drejt backhand-it.'
  },
  {
    index: '03',
    title: 'Sherbimi',
    icon: 'i-lucide-arrow-up',
    image: '/hero/diamond-hero-serve.webp',
    alt: 'Lojtare duke ushtruar sherbimin ne tenis',
    copy: 'Sherbimi nis piken. Saktesia e hedhjes se topit dhe nje ritem i perseritshem vlejne me shume se forca.',
    cue: 'Hidhe topin pak perpara dhe shtrije krahun lart drejt kontaktit.',
    drill: 'Bej 10 hedhje pa goditur, pastaj 10 sherbime me ritmin e njejte.'
  },
  {
    index: '04',
    title: 'Volley',
    icon: 'i-lucide-scan-line',
    image: '/hero/diamond-sunrise-serve.webp',
    alt: 'Dy lojtare ne nje fushe tenisi ne mengjes',
    copy: 'Volley luhet afer rrjetes. Kerkohet reagim i shpejte, raketa perpara dhe nje levizje e shkurter e kontrolluar.',
    cue: 'Bej nje hap drejt topit dhe mos e terhiq raketen shume prapa.',
    drill: 'Partneri te dergon 8 topa te lehte, kater ne secilen ane.'
  }
]

const scoring = [
  { value: '15', title: 'Pika e pare', copy: 'Fituesi i pikes kalon ne 15.' },
  { value: '30', title: 'Pika e dyte', copy: 'Pika e radhes e con rezultatin ne 30.' },
  { value: '40', title: 'Pika e trete', copy: 'Pas 40, pika tjeter mund ta mbylle game-in.' },
  { value: 'AD', title: 'Avantazhi', copy: 'Ne 40-40 duhen dy pike radhazi per ta fituar game-in.' }
]

const practice = [
  { time: '10', title: 'Ngrohja', copy: 'Levizje e lehte, hapa anesore dhe goditje pa force.' },
  { time: '20', title: 'Ritmi nga fundi', copy: 'Forehand dhe backhand me objektiv vazhdimesine.' },
  { time: '15', title: 'Sherbimi', copy: 'Hedhja e topit, sherbimi dhe kthimi i tij.' },
  { time: '15', title: 'Pike te shkurtra', copy: 'Rally ose game te shkurtra me partnerin.' }
]

const preparation = [
  { icon: 'i-lucide-shirt', title: 'Veshje per levizje', copy: 'Atlete sportive dhe veshje te rehatshme.' },
  { icon: 'i-lucide-droplets', title: 'Uje me vete', copy: 'Bej pushime te shkurtra dhe hidratoju.' },
  { icon: 'i-lucide-clock-3', title: 'Eja pak me heret', copy: 'Ke kohe te pergatitesh para fillimit te terminit.' }
]

const selectedBasic = ref(0)
const selectedStroke = computed(() => basics[selectedBasic.value] ?? basics[0]!)

useSeoMeta({
  title: 'Si te luash tenis',
  description: 'Udhezues i thjeshte per fillestare: goditjet baze, rregullat kryesore, pergatitja dhe rezervimi i fushes ne Diamond Tennis Academy.'
})
</script>

<template>
  <main class="learn-page">
    <section
      class="learn-hero"
      aria-labelledby="learn-title"
    >
      <img
        src="/hero/diamond-hero-training.webp"
        width="1776"
        height="887"
        alt="Lojtare duke mesuar tenis me trajnerin"
        fetchpriority="high"
      >
      <div
        class="learn-hero__overlay"
        aria-hidden="true"
      />
      <div class="learn-hero__content">
        <p><span aria-hidden="true" /> Udhezues per fillestare</p>
        <h1 id="learn-title">
          Hyr ne fushe me bazat e qarta.
        </h1>
        <span>
          Goditjet kryesore, rezultati dhe nje plan i thjeshte per oren e pare. Pa teori te panevojshme.
        </span>
        <UButton
          to="#goditjet"
          color="neutral"
          size="xl"
          trailing-icon="i-lucide-arrow-down"
          label="Fillo me goditjet"
          class="learn-hero__button public-lime-button"
          style="width: min(100%, 260px)"
        />
      </div>

      <nav
        class="learn-hero__chapters"
        aria-label="Kapitujt e udhezuesit"
      >
        <a href="#goditjet"><span>01</span> Goditjet</a>
        <a href="#rezultati"><span>02</span> Rezultati</a>
        <a href="#seanca"><span>03</span> Seanca</a>
      </nav>
    </section>

    <section
      id="goditjet"
      class="strokes-section"
      aria-labelledby="strokes-title"
    >
      <div class="section-heading">
        <p>01 / Goditjet</p>
        <h2 id="strokes-title">
          Nderto lojen nje goditje ne nje kohe.
        </h2>
        <span>Prek nje goditje per te pare pozicionin, fokusin dhe nje ushtrim te thjeshte.</span>
      </div>

      <div class="stroke-workspace">
        <div
          class="stroke-tabs"
          role="tablist"
          aria-label="Goditjet baze"
        >
          <button
            v-for="(item, index) in basics"
            :id="`stroke-tab-${index}`"
            :key="item.title"
            type="button"
            role="tab"
            :aria-selected="selectedBasic === index"
            :aria-controls="`stroke-panel-${index}`"
            :class="{ 'is-active': selectedBasic === index }"
            @click="selectedBasic = index"
          >
            <span>{{ item.index }}</span>
            <strong>{{ item.title }}</strong>
            <UIcon
              :name="item.icon"
              aria-hidden="true"
            />
          </button>
        </div>

        <div
          :id="`stroke-panel-${selectedBasic}`"
          class="stroke-panel"
          role="tabpanel"
          :aria-labelledby="`stroke-tab-${selectedBasic}`"
        >
          <div class="stroke-panel__media">
            <Transition
              name="stroke-image"
              mode="out-in"
            >
              <img
                :key="selectedStroke.image"
                :src="selectedStroke.image"
                width="1600"
                height="1067"
                :alt="selectedStroke.alt"
                loading="lazy"
              >
            </Transition>
            <span>{{ selectedStroke.index }} / 04</span>
          </div>
          <div class="stroke-panel__copy">
            <p>{{ selectedStroke.copy }}</p>
            <dl>
              <div>
                <dt>
                  <UIcon
                    name="i-lucide-focus"
                    aria-hidden="true"
                  /> Mbaje mend
                </dt>
                <dd>{{ selectedStroke.cue }}</dd>
              </div>
              <div>
                <dt>
                  <UIcon
                    name="i-lucide-repeat-2"
                    aria-hidden="true"
                  /> Provoje ne fushe
                </dt>
                <dd>{{ selectedStroke.drill }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>

    <section
      id="rezultati"
      class="score-section"
      aria-labelledby="score-title"
    >
      <div class="score-section__intro">
        <p>02 / Rezultati</p>
        <h2 id="score-title">
          15. 30. 40.<br><em>Pastaj game.</em>
        </h2>
        <span>
          Cdo rally jep nje pike. Nje set zakonisht fitohet me 6 game dhe me diference prej dy game.
        </span>
      </div>

      <div
        class="score-board"
        aria-label="Rrjedha e pikeve ne nje game"
      >
        <div class="score-board__top">
          <span>Rrjedha e nje game</span>
          <UIcon
            name="i-lucide-circle-dot"
            aria-hidden="true"
          />
        </div>
        <ol>
          <li
            v-for="item in scoring"
            :key="item.value"
          >
            <strong>{{ item.value }}</strong>
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.copy }}</p>
            </div>
          </li>
        </ol>
      </div>
    </section>

    <section
      id="seanca"
      class="practice-section"
      aria-labelledby="practice-title"
    >
      <div class="section-heading section-heading--practice">
        <p>03 / Seanca e pare</p>
        <h2 id="practice-title">
          Nje ore. Nje plan i qarte.
        </h2>
        <span>Mbaje ritmin te lehte. Qellimi i seances se pare eshte kontrolli dhe vazhdimesia.</span>
      </div>

      <div class="practice-timeline">
        <article
          v-for="(item, index) in practice"
          :key="item.time"
        >
          <div class="practice-timeline__time">
            <strong>{{ item.time }}</strong>
            <span>min</span>
          </div>
          <div>
            <span>0{{ index + 1 }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.copy }}</p>
          </div>
        </article>
      </div>
    </section>

    <section
      class="prepare-section"
      aria-labelledby="prepare-title"
    >
      <div class="prepare-section__media">
        <img
          src="/courts/tennis-training-net.jpg"
          width="1200"
          height="800"
          alt="Topa tenisi prane rrjetes ne fushe"
          loading="lazy"
        >
      </div>
      <div class="prepare-section__content">
        <p>Para terminit</p>
        <h2 id="prepare-title">
          Mjaftojne disa gjera te thjeshta.
        </h2>
        <div class="prepare-list">
          <article
            v-for="item in preparation"
            :key="item.title"
          >
            <UIcon
              :name="item.icon"
              aria-hidden="true"
            />
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.copy }}</p>
            </div>
          </article>
        </div>
        <UButton
          to="/#availability"
          color="primary"
          size="lg"
          label="Gjej nje termin"
          trailing-icon="i-lucide-arrow-up-right"
          class="prepare-section__button"
        />
      </div>
    </section>
  </main>
</template>

<style scoped>
.learn-page {
  background: #F5F7F1;
  color: var(--ink);
}

.learn-hero {
  position: relative;
  min-height: 760px;
  height: min(880px, 100svh);
  display: grid;
  align-items: center;
  overflow: hidden;
  background: #071612;
  color: #FFFFFF;
  isolation: isolate;
}

.learn-hero > img,
.learn-hero__overlay {
  position: absolute;
  inset: 0;
  z-index: -2;
  width: 100%;
  height: 100%;
}

.learn-hero > img {
  object-fit: cover;
  object-position: center;
}

.learn-hero__overlay {
  z-index: -1;
  background:
    linear-gradient(90deg, rgba(4, 17, 14, 0.94), rgba(4, 17, 14, 0.7) 42%, rgba(4, 17, 14, 0.08) 76%),
    linear-gradient(180deg, rgba(4, 17, 14, 0.38), transparent 42%, rgba(4, 17, 14, 0.86));
}

.learn-hero__content {
  width: min(var(--container), calc(100% - 48px));
  margin: 0 auto;
  padding: 128px 0 160px;
}

.learn-hero__content > p,
.section-heading > p,
.score-section__intro > p,
.prepare-section__content > p {
  margin: 0 0 16px;
  color: #1A6B55;
  font-size: 0.7rem;
  font-weight: 850;
  text-transform: uppercase;
}

.learn-hero__content > p {
  display: flex;
  gap: 10px;
  align-items: center;
  color: rgba(255, 255, 255, 0.72);
}

.learn-hero__content > p span {
  width: 28px;
  height: 2px;
  background: var(--lime);
}

.learn-hero h1 {
  max-width: 710px;
  margin: 0;
  color: #FFFFFF;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(3rem, 6.2vw, 5.8rem);
  font-weight: 500;
  line-height: 0.98;
  letter-spacing: 0;
}

.learn-hero__content > span {
  max-width: 520px;
  display: block;
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.98rem;
  line-height: 1.7;
}

.learn-hero__button,
.prepare-section__button {
  min-height: 50px;
  margin-top: 30px;
  border-radius: 5px;
  padding-inline: 18px;
  color: var(--ink);
  background: var(--lime);
  font-size: 0.84rem;
  font-weight: 830;
}

.learn-hero__button {
  min-height: 56px;
  margin-top: 52px;
  border-radius: 6px;
  justify-content: space-between;
  padding-inline: 24px;
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .learn-hero__button {
    width: 100%;
  }
}

.learn-hero__chapters {
  position: absolute;
  right: max(24px, calc((100vw - var(--container)) / 2));
  bottom: 30px;
  left: max(24px, calc((100vw - var(--container)) / 2));
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid rgba(255, 255, 255, 0.26);
}

.learn-hero__chapters a {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 20px 22px 4px 0;
  color: #FFFFFF;
  font-size: 0.76rem;
  font-weight: 780;
  text-decoration: none;
}

.learn-hero__chapters a + a {
  border-left: 1px solid rgba(255, 255, 255, 0.26);
  padding-left: 24px;
}

.learn-hero__chapters span {
  color: var(--lime);
  font-size: 0.64rem;
}

.strokes-section,
.practice-section {
  width: min(var(--container), calc(100% - 48px));
  margin: 0 auto;
  padding: clamp(76px, 9vw, 126px) 0;
}

.section-heading {
  max-width: 760px;
}

.section-heading h2,
.score-section h2,
.prepare-section h2 {
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.4rem, 4.7vw, 4.6rem);
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0;
}

.section-heading > span,
.score-section__intro > span {
  max-width: 590px;
  display: block;
  margin-top: 20px;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.7;
}

.stroke-workspace {
  display: grid;
  grid-template-columns: minmax(220px, 0.3fr) minmax(0, 0.7fr);
  margin-top: 48px;
  background: #FFFFFF;
}

.stroke-tabs {
  display: grid;
  align-content: stretch;
  border-block: 1px solid var(--line);
}

.stroke-tabs button {
  display: grid;
  grid-template-columns: 34px 1fr 22px;
  gap: 10px;
  align-items: center;
  border: 0;
  border-bottom: 1px solid var(--line);
  padding: 20px;
  color: var(--ink);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: color 180ms ease, background-color 180ms ease;
}

.stroke-tabs button:last-child {
  border-bottom: 0;
}

.stroke-tabs button:hover,
.stroke-tabs button.is-active {
  color: #FFFFFF;
  background: var(--forest);
}

.stroke-tabs button > span {
  color: var(--coral);
  font-size: 0.66rem;
  font-weight: 840;
}

.stroke-tabs button strong {
  font-size: 0.86rem;
  font-weight: 820;
}

.stroke-tabs button svg {
  width: 18px;
  height: 18px;
  color: #1A6B55;
}

.stroke-tabs button:hover svg,
.stroke-tabs button.is-active svg {
  color: var(--lime);
}

.stroke-tabs button:focus-visible {
  position: relative;
  z-index: 1;
  outline: 2px solid var(--lime);
  outline-offset: -3px;
}

.stroke-panel {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
  background: #E8EEE9;
}

.stroke-panel__media {
  position: relative;
  min-height: 520px;
  overflow: hidden;
  background: #12251F;
}

.stroke-panel__media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.stroke-panel__media > span {
  position: absolute;
  right: 16px;
  bottom: 16px;
  border-radius: 999px;
  padding: 7px 10px;
  color: #FFFFFF;
  background: rgba(4, 17, 14, 0.72);
  font-size: 0.62rem;
  font-weight: 780;
  backdrop-filter: blur(10px);
}

.stroke-panel__copy {
  display: grid;
  align-content: center;
  padding: clamp(28px, 4vw, 58px);
}

.stroke-panel__copy > p {
  margin: 0;
  color: var(--ink);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.35rem, 2vw, 2rem);
  line-height: 1.3;
}

.stroke-panel dl {
  display: grid;
  gap: 0;
  margin: 30px 0 0;
}

.stroke-panel dl > div {
  border-top: 1px solid rgba(10, 23, 20, 0.13);
  padding: 18px 0;
}

.stroke-panel dt {
  display: flex;
  gap: 8px;
  align-items: center;
  color: #1A6B55;
  font-size: 0.68rem;
  font-weight: 840;
  text-transform: uppercase;
}

.stroke-panel dt svg {
  width: 16px;
  height: 16px;
}

.stroke-panel dd {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 0.82rem;
  line-height: 1.58;
}

.stroke-image-enter-active,
.stroke-image-leave-active {
  transition: opacity 220ms ease;
}

.stroke-image-enter-from,
.stroke-image-leave-to {
  opacity: 0;
}

.score-section {
  display: grid;
  grid-template-columns: minmax(300px, 0.75fr) minmax(0, 1.25fr);
  gap: clamp(42px, 8vw, 120px);
  align-items: center;
  padding: clamp(76px, 10vw, 138px) max(24px, calc((100vw - var(--container)) / 2));
  background: var(--forest);
  color: #FFFFFF;
}

.score-section h2 {
  color: #FFFFFF;
}

.score-section h2 em {
  color: var(--lime);
  font-weight: 500;
}

.score-section__intro > p {
  color: var(--lime);
}

.score-section__intro > span {
  color: rgba(255, 255, 255, 0.64);
}

.score-board {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.04);
}

.score-board__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 16px 20px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.66rem;
  font-weight: 780;
  text-transform: uppercase;
}

.score-board__top svg {
  color: var(--lime);
}

.score-board ol {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
}

.score-board li {
  min-height: 260px;
  display: grid;
  align-content: space-between;
  padding: 24px 20px;
}

.score-board li + li {
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.score-board li > strong {
  color: var(--lime);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.6rem, 4vw, 4.2rem);
  font-weight: 500;
  line-height: 1;
}

.score-board h3 {
  margin: 0;
  font-size: 0.82rem;
}

.score-board p {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.56);
  font-size: 0.74rem;
  line-height: 1.52;
}

.section-heading--practice {
  display: grid;
  grid-template-columns: 1fr;
  margin-left: auto;
  text-align: right;
}

.section-heading--practice > span {
  margin-left: auto;
}

.practice-timeline {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 48px;
  border-top: 1px solid var(--line);
}

.practice-timeline article {
  min-height: 280px;
  display: grid;
  align-content: space-between;
  padding: 26px 26px 0 0;
}

.practice-timeline article + article {
  border-left: 1px solid var(--line);
  padding-left: 26px;
}

.practice-timeline__time {
  display: flex;
  gap: 6px;
  align-items: end;
}

.practice-timeline__time strong {
  color: #1A6B55;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(3rem, 5vw, 5.4rem);
  font-weight: 500;
  line-height: 0.8;
}

.practice-timeline__time span {
  color: var(--muted);
  font-size: 0.66rem;
  font-weight: 760;
}

.practice-timeline article > div:last-child > span {
  color: var(--coral);
  font-size: 0.64rem;
  font-weight: 840;
}

.practice-timeline h3 {
  margin: 10px 0 0;
  font-size: 0.92rem;
}

.practice-timeline p {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 0.78rem;
  line-height: 1.55;
}

.prepare-section {
  width: min(var(--container), calc(100% - 32px));
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
  min-height: 630px;
  margin: 0 auto clamp(76px, 9vw, 126px);
  background: #E8EEE9;
}

.prepare-section__media {
  min-height: 500px;
  overflow: hidden;
}

.prepare-section__media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.prepare-section__content {
  display: grid;
  align-content: center;
  justify-items: start;
  padding: clamp(30px, 5vw, 68px);
}

.prepare-section h2 {
  font-size: clamp(2.2rem, 3.7vw, 3.7rem);
}

.prepare-list {
  width: 100%;
  display: grid;
  margin-top: 28px;
}

.prepare-list article {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 14px;
  border-top: 1px solid rgba(10, 23, 20, 0.13);
  padding: 16px 0;
}

.prepare-list svg {
  width: 20px;
  height: 20px;
  color: #1A6B55;
}

.prepare-list h3,
.prepare-list p {
  margin: 0;
}

.prepare-list h3 {
  font-size: 0.8rem;
}

.prepare-list p {
  margin-top: 5px;
  color: var(--muted);
  font-size: 0.74rem;
  line-height: 1.5;
}

.prepare-section__button {
  margin-top: 22px;
}

@media (max-width: 1050px) {
  .stroke-workspace,
  .score-section,
  .prepare-section {
    grid-template-columns: 1fr;
  }

  .stroke-tabs {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .stroke-tabs button {
    grid-template-columns: 1fr;
    justify-items: start;
    border-right: 1px solid var(--line);
    border-bottom: 0;
  }

  .stroke-tabs button:last-child {
    border-right: 0;
  }

  .prepare-section__media {
    min-height: 440px;
  }
}

@media (max-width: 760px) {
  .learn-hero {
    min-height: 720px;
    height: 100svh;
  }

  .learn-hero > img {
    object-position: 68% center;
  }

  .learn-hero__overlay {
    background:
      linear-gradient(90deg, rgba(4, 17, 14, 0.78), rgba(4, 17, 14, 0.22)),
      linear-gradient(180deg, rgba(4, 17, 14, 0.44), rgba(4, 17, 14, 0.16) 35%, rgba(4, 17, 14, 0.94) 80%);
  }

  .learn-hero__content {
    width: calc(100% - 32px);
    align-self: end;
    padding: 104px 0 180px;
  }

  .learn-hero h1 {
    font-size: clamp(2.8rem, 13vw, 4rem);
  }

  .learn-hero__chapters {
    right: 16px;
    bottom: 20px;
    left: 16px;
  }

  .learn-hero__chapters a {
    display: grid;
    gap: 6px;
    padding-right: 8px;
    font-size: 0.68rem;
  }

  .learn-hero__chapters a + a {
    padding-left: 10px;
  }

  .strokes-section,
  .practice-section {
    width: calc(100% - 32px);
  }

  .stroke-panel {
    grid-template-columns: 1fr;
  }

  .stroke-panel__media {
    min-height: 390px;
  }

  .score-board ol,
  .practice-timeline {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .score-board li:nth-child(3) {
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    border-left: 0;
  }

  .score-board li:nth-child(4) {
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .practice-timeline article:nth-child(3) {
    border-top: 1px solid var(--line);
    border-left: 0;
  }

  .practice-timeline article:nth-child(4) {
    border-top: 1px solid var(--line);
  }
}

@media (max-width: 540px) {
  .stroke-tabs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stroke-tabs button {
    min-height: 92px;
    border-bottom: 1px solid var(--line);
  }

  .stroke-tabs button:nth-child(2) {
    border-right: 0;
  }

  .stroke-tabs button:nth-child(3),
  .stroke-tabs button:nth-child(4) {
    border-bottom: 0;
  }

  .stroke-panel__media {
    min-height: 330px;
  }

  .score-section {
    padding-inline: 16px;
  }

  .score-board li {
    min-height: 220px;
    padding: 20px 14px;
  }

  .practice-timeline {
    grid-template-columns: 1fr;
  }

  .practice-timeline article {
    min-height: 210px;
    border-bottom: 1px solid var(--line);
    padding: 24px 0;
  }

  .practice-timeline article + article,
  .practice-timeline article:nth-child(4) {
    border-top: 0;
    border-left: 0;
    padding-left: 0;
  }

  .prepare-section {
    width: 100%;
    margin-bottom: 0;
  }

  .prepare-section__media {
    min-height: 340px;
  }

  .prepare-section__content {
    padding: 34px 20px 42px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stroke-image-enter-active,
  .stroke-image-leave-active {
    transition: none;
  }
}
</style>
