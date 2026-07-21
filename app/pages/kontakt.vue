<script setup lang="ts">
import { brandConfig } from '~/config/brand'
import { businessConfig } from '~/config/business'

const runtimeConfig = useRuntimeConfig()

const mapUrl = computed(() => runtimeConfig.public.diamondTennisLocationUrl || businessConfig.contact.mapsUrl)
const instagramUrl = computed(() => runtimeConfig.public.diamondTennisInstagramUrl || brandConfig.social.instagram)
const facebookUrl = computed(() => runtimeConfig.public.diamondTennisFacebookUrl)

const contactDetails = [
  {
    icon: 'i-lucide-map-pin',
    label: 'Adresa',
    value: businessConfig.contact.address || brandConfig.locationLabel
  },
  {
    icon: 'i-lucide-clock-3',
    label: 'Orari',
    value: `${businessConfig.hours.label}, ${businessConfig.hours.range}`
  },
  {
    icon: 'i-lucide-layout-grid',
    label: 'Fushat',
    value: 'Outdoor dhe indoor'
  }
]

useSeoMeta({
  title: 'Kontakt',
  description: 'Kontakto Diamond Tennis Academy ne Hajvali, Prishtine, shiko orarin dhe rezervo fushe tenisi online.'
})
</script>

<template>
  <main class="contact-page">
    <section
      class="contact-hero"
      aria-labelledby="contact-title"
    >
      <img
        src="/hero/diamond-hero-lifestyle.webp"
        width="1776"
        height="887"
        alt="Dy lojtare ne fushen e Diamond Tennis Academy"
        fetchpriority="high"
      >
      <div
        class="contact-hero__overlay"
        aria-hidden="true"
      />

      <div class="contact-hero__content">
        <p><span aria-hidden="true" /> Kontakt dhe lokacion</p>
        <h1 id="contact-title">
          Fusha eshte ne Hajvali.<br><em>Termini eshte online.</em>
        </h1>
        <span>
          Gjej lokacionin, kontrollo orarin ose rezervo direkt fushen outdoor apo indoor.
        </span>
        <div class="contact-hero__actions">
          <UButton
            to="/#availability"
            color="primary"
            size="lg"
            label="Gjej nje termin"
            trailing-icon="i-lucide-arrow-up-right"
            class="contact-hero__primary"
          />
          <UButton
            v-if="mapUrl"
            :to="mapUrl"
            target="_blank"
            rel="noopener"
            color="neutral"
            variant="ghost"
            size="lg"
            label="Hap ne harte"
            trailing-icon="i-lucide-navigation"
            class="contact-hero__secondary"
          />
        </div>
      </div>

      <div
        class="contact-hero__details"
        aria-label="Informata kryesore"
      >
        <component
          :is="item.label === 'Adresa' && mapUrl ? 'a' : 'article'"
          v-for="item in contactDetails"
          :key="item.label"
          :href="item.label === 'Adresa' ? mapUrl : undefined"
          :target="item.label === 'Adresa' ? '_blank' : undefined"
          :rel="item.label === 'Adresa' ? 'noopener noreferrer' : undefined"
          class="contact-hero__detail"
        >
          <UIcon
            :name="item.icon"
            aria-hidden="true"
          />
          <div>
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
          <UIcon
            v-if="item.label === 'Adresa' && mapUrl"
            name="i-lucide-arrow-up-right"
            aria-hidden="true"
            class="contact-hero__detail-arrow"
          />
        </component>
      </div>
    </section>

    <section
      class="contact-options"
      aria-labelledby="options-title"
    >
      <div class="contact-options__heading">
        <p>Si mund te te ndihmojme?</p>
        <h2 id="options-title">
          Zgjidh rrugen me te shpejte.
        </h2>
      </div>

      <div class="contact-options__list">
        <NuxtLink to="/#availability">
          <span class="contact-options__index">01</span>
          <UIcon
            name="i-lucide-calendar-days"
            aria-hidden="true"
          />
          <div>
            <strong>Rezervo nje fushe</strong>
            <span>Zgjidh fushen, daten dhe nje nga oraret e lira.</span>
          </div>
          <UIcon
            name="i-lucide-arrow-up-right"
            aria-hidden="true"
          />
        </NuxtLink>

        <a
          v-if="mapUrl"
          :href="mapUrl"
          target="_blank"
          rel="noopener"
        >
          <span class="contact-options__index">02</span>
          <UIcon
            name="i-lucide-navigation"
            aria-hidden="true"
          />
          <div>
            <strong>Gjej lokacionin</strong>
            <span>Hap drejtimin per ne Hajvali ne aplikacionin e hartes.</span>
          </div>
          <UIcon
            name="i-lucide-arrow-up-right"
            aria-hidden="true"
          />
        </a>

        <a
          :href="instagramUrl"
          target="_blank"
          rel="noopener"
        >
          <span class="contact-options__index">{{ mapUrl ? '03' : '02' }}</span>
          <UIcon
            name="i-simple-icons-instagram"
            aria-hidden="true"
          />
          <div>
            <strong>Na shkruaj ne Instagram</strong>
            <span>@diamond.tennisacademy</span>
          </div>
          <UIcon
            name="i-lucide-arrow-up-right"
            aria-hidden="true"
          />
        </a>
      </div>
    </section>

    <section
      class="location-editorial"
      aria-labelledby="location-title"
    >
      <div class="location-editorial__media">
        <img
          src="/courts/tennis-aerial.jpg"
          width="1400"
          height="1867"
          alt="Pamje nga lart e nje fushe tenisi"
          loading="lazy"
        >
        <span>Hajvali / Prishtine</span>
      </div>

      <div class="location-editorial__content">
        <p>Lokacioni</p>
        <h2 id="location-title">
          Afer qytetit.<br>Afer lojes.
        </h2>
        <span>{{ businessConfig.contact.address || brandConfig.locationLabel }}</span>

        <dl>
          <div>
            <dt>Ditet</dt>
            <dd>{{ businessConfig.hours.label }}</dd>
          </div>
          <div>
            <dt>Orari</dt>
            <dd>{{ businessConfig.hours.range }}</dd>
          </div>
          <div>
            <dt>Ambientet</dt>
            <dd>Outdoor / Indoor</dd>
          </div>
        </dl>

        <UButton
          v-if="mapUrl"
          :to="mapUrl"
          target="_blank"
          rel="noopener"
          color="primary"
          size="lg"
          label="Nisu drejt fushes"
          trailing-icon="i-lucide-navigation"
          class="location-editorial__button"
        />
      </div>
    </section>

    <section
      class="social-section"
      aria-labelledby="social-title"
    >
      <div class="social-section__heading">
        <p>Qendro ne loje</p>
        <h2 id="social-title">
          Na ndiq jashte fushes.
        </h2>
      </div>

      <div class="social-section__links">
        <a
          :href="instagramUrl"
          target="_blank"
          rel="noopener"
          aria-label="Diamond Tennis Academy ne Instagram"
        >
          <UIcon
            name="i-simple-icons-instagram"
            aria-hidden="true"
          />
          <span>Instagram</span>
          <UIcon
            name="i-lucide-arrow-up-right"
            aria-hidden="true"
          />
        </a>
        <a
          v-if="facebookUrl"
          :href="facebookUrl"
          target="_blank"
          rel="noopener"
          aria-label="Diamond Tennis Academy ne Facebook"
        >
          <UIcon
            name="i-simple-icons-facebook"
            aria-hidden="true"
          />
          <span>Facebook</span>
          <UIcon
            name="i-lucide-arrow-up-right"
            aria-hidden="true"
          />
        </a>
        <div
          v-else
          aria-label="Facebook"
        >
          <UIcon
            name="i-simple-icons-facebook"
            aria-hidden="true"
          />
          <span>Facebook</span>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.contact-page {
  background: #F5F7F1;
  color: var(--ink);
}

.contact-hero {
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

.contact-hero > img,
.contact-hero__overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.contact-hero > img {
  z-index: -2;
  object-fit: cover;
  object-position: center;
}

.contact-hero__overlay {
  z-index: -1;
  background:
    linear-gradient(90deg, rgba(4, 17, 14, 0.95), rgba(4, 17, 14, 0.72) 40%, rgba(4, 17, 14, 0.1) 74%),
    linear-gradient(180deg, rgba(4, 17, 14, 0.4), transparent 40%, rgba(4, 17, 14, 0.88));
}

.contact-hero__content {
  width: min(var(--container), calc(100% - 48px));
  margin: 0 auto;
  padding: 120px 0 160px;
}

.contact-hero__content > p,
.contact-options__heading > p,
.location-editorial__content > p,
.social-section__heading > p {
  margin: 0 0 15px;
  color: #1A6B55;
  font-size: 0.7rem;
  font-weight: 850;
  text-transform: uppercase;
}

.contact-hero__content > p {
  display: flex;
  gap: 10px;
  align-items: center;
  color: rgba(255, 255, 255, 0.72);
}

.contact-hero__content > p span {
  width: 28px;
  height: 2px;
  background: var(--lime);
}

.contact-hero h1,
.contact-options h2,
.location-editorial h2,
.social-section h2 {
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-weight: 500;
  letter-spacing: 0;
}

.contact-hero h1 {
  max-width: 770px;
  color: #FFFFFF;
  font-size: clamp(3rem, 6.2vw, 5.8rem);
  line-height: 0.96;
}

.contact-hero h1 em {
  color: var(--lime);
  font-weight: 500;
}

.contact-hero__content > span {
  max-width: 520px;
  display: block;
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.94rem;
  line-height: 1.7;
}

.contact-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 30px;
}

.contact-hero__primary,
.contact-hero__secondary,
.location-editorial__button {
  min-height: 50px;
  border-radius: 5px;
  padding-inline: 18px;
  font-size: 0.82rem;
  font-weight: 830;
}

.contact-hero__primary,
.location-editorial__button {
  color: var(--ink);
  background: var(--lime);
}

.contact-hero__secondary {
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
}

.contact-hero__details {
  position: absolute;
  right: max(24px, calc((100vw - var(--container)) / 2));
  bottom: 30px;
  left: max(24px, calc((100vw - var(--container)) / 2));
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid rgba(255, 255, 255, 0.24);
}

.contact-hero__details .contact-hero__detail {
  min-height: 76px;
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 18px 20px 0 0;
}

.contact-hero__details .contact-hero__detail + .contact-hero__detail {
  border-left: 1px solid rgba(255, 255, 255, 0.24);
  padding-left: 24px;
}

.contact-hero__details a.contact-hero__detail {
  color: inherit;
  text-decoration: none;
}

.contact-hero__details a.contact-hero__detail:hover strong,
.contact-hero__details a.contact-hero__detail:focus-visible strong {
  color: var(--lime);
}

.contact-hero__detail-arrow {
  margin-left: auto;
  flex: 0 0 auto;
  color: var(--lime) !important;
}

.contact-hero__details svg {
  width: 19px;
  height: 19px;
  color: var(--lime);
}

.contact-hero__details span,
.contact-hero__details strong {
  display: block;
}

.contact-hero__details span {
  color: rgba(255, 255, 255, 0.52);
  font-size: 0.64rem;
}

.contact-hero__details strong {
  margin-top: 4px;
  font-size: 0.76rem;
  font-weight: 800;
}

.contact-options {
  width: min(var(--container), calc(100% - 48px));
  display: grid;
  grid-template-columns: minmax(280px, 0.42fr) minmax(0, 0.58fr);
  gap: clamp(38px, 8vw, 110px);
  margin: 0 auto;
  padding: clamp(76px, 10vw, 138px) 0;
}

.contact-options h2,
.location-editorial h2,
.social-section h2 {
  font-size: clamp(2.4rem, 4.7vw, 4.7rem);
  line-height: 1;
}

.contact-options__list {
  border-top: 1px solid var(--line);
}

.contact-options__list > a {
  display: grid;
  grid-template-columns: 34px 28px 1fr 22px;
  gap: 16px;
  align-items: center;
  border-bottom: 1px solid var(--line);
  padding: 24px 0;
  color: var(--ink);
  text-decoration: none;
  transition: padding 180ms ease, color 180ms ease;
}

.contact-options__list > a:hover {
  padding-left: 10px;
  color: #1A6B55;
}

.contact-options__list svg {
  width: 20px;
  height: 20px;
  color: #1A6B55;
}

.contact-options__index {
  color: var(--coral);
  font-size: 0.64rem;
  font-weight: 850;
}

.contact-options__list strong,
.contact-options__list div > span {
  display: block;
}

.contact-options__list > a > div {
  min-width: 0;
}

.contact-options__list strong {
  font-size: 0.88rem;
}

.contact-options__list div > span {
  margin-top: 6px;
  color: var(--muted);
  font-size: 0.76rem;
  line-height: 1.5;
}

.location-editorial {
  width: min(var(--container), calc(100% - 32px));
  min-height: 700px;
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(340px, 0.92fr);
  margin: 0 auto;
  background: #E8EEE9;
}

.location-editorial__media {
  position: relative;
  min-height: 560px;
  overflow: hidden;
}

.location-editorial__media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.location-editorial__media > span {
  position: absolute;
  right: 18px;
  bottom: 18px;
  border-radius: 999px;
  padding: 8px 11px;
  color: #FFFFFF;
  background: rgba(4, 17, 14, 0.74);
  font-size: 0.64rem;
  font-weight: 780;
  backdrop-filter: blur(10px);
}

.location-editorial__content {
  display: grid;
  align-content: center;
  justify-items: start;
  padding: clamp(38px, 6vw, 82px);
}

.location-editorial__content > span {
  margin-top: 22px;
  color: var(--muted);
  font-size: 0.86rem;
}

.location-editorial dl {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 34px 0 0;
  border-block: 1px solid rgba(10, 23, 20, 0.13);
}

.location-editorial dl > div {
  padding: 17px 14px 17px 0;
}

.location-editorial dl > div + div {
  border-left: 1px solid rgba(10, 23, 20, 0.13);
  padding-left: 14px;
}

.location-editorial dt {
  color: var(--muted);
  font-size: 0.62rem;
}

.location-editorial dd {
  margin: 5px 0 0;
  font-size: 0.72rem;
  font-weight: 800;
}

.location-editorial__button {
  margin-top: 28px;
}

.social-section {
  width: min(var(--container), calc(100% - 48px));
  display: grid;
  grid-template-columns: minmax(260px, 0.4fr) minmax(0, 0.6fr);
  gap: clamp(36px, 8vw, 110px);
  align-items: end;
  margin: 0 auto;
  padding: clamp(76px, 9vw, 126px) 0;
}

.social-section__links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid var(--line);
}

.social-section__links > a,
.social-section__links > div {
  min-height: 150px;
  display: grid;
  grid-template-columns: 30px 1fr 20px;
  gap: 14px;
  align-items: end;
  padding: 24px 20px;
  color: var(--ink);
  text-decoration: none;
}

.social-section__links > * + * {
  border-left: 1px solid var(--line);
}

.social-section__links > div {
  grid-template-columns: 30px 1fr;
  color: var(--muted);
}

.social-section__links svg {
  width: 22px;
  height: 22px;
}

.social-section__links a:hover {
  color: #1A6B55;
}

.social-section__links span {
  font-size: 0.88rem;
  font-weight: 820;
}

@media (max-width: 900px) {
  .contact-options,
  .location-editorial,
  .social-section {
    grid-template-columns: 1fr;
  }

  .location-editorial__media {
    min-height: 480px;
  }
}

@media (max-width: 600px) {
  .contact-hero {
    min-height: 720px;
    height: 100svh;
  }

  .contact-hero > img {
    object-position: 71% center;
  }

  .contact-hero__overlay {
    background:
      linear-gradient(90deg, rgba(4, 17, 14, 0.78), rgba(4, 17, 14, 0.16)),
      linear-gradient(180deg, rgba(4, 17, 14, 0.45), rgba(4, 17, 14, 0.18) 38%, rgba(4, 17, 14, 0.94) 80%);
  }

  .contact-hero__content {
    width: calc(100% - 32px);
    align-self: end;
    padding: 104px 0 188px;
  }

  .contact-hero h1 {
    font-size: clamp(2.7rem, 12.5vw, 3.8rem);
  }

  .contact-hero__details {
    right: 16px;
    bottom: 18px;
    left: 16px;
  }

  .contact-hero__details .contact-hero__detail {
    gap: 6px;
    padding-right: 7px;
  }

  .contact-hero__details .contact-hero__detail + .contact-hero__detail {
    padding-left: 8px;
  }

  .contact-hero__details svg {
    display: none;
  }

  .contact-hero__details strong {
    font-size: 0.66rem;
  }

  .contact-options,
  .social-section {
    width: calc(100% - 32px);
  }

  .contact-options__list > a {
    grid-template-columns: 22px 22px minmax(0, 1fr) 18px;
    gap: 10px;
  }

  .location-editorial {
    width: 100%;
  }

  .location-editorial__media {
    min-height: 390px;
  }

  .location-editorial__content {
    padding: 42px 20px 48px;
  }

  .location-editorial dl {
    grid-template-columns: 1fr;
  }

  .location-editorial dl > div + div {
    border-top: 1px solid rgba(10, 23, 20, 0.13);
    border-left: 0;
    padding-left: 0;
  }

  .social-section__links > a,
  .social-section__links > div {
    min-height: 130px;
    padding-inline: 12px;
  }
}
</style>
