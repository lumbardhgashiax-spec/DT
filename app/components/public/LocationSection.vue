<script setup lang="ts">
import { brandConfig } from '~/config/brand'
import { businessConfig } from '~/config/business'

const runtimeConfig = useRuntimeConfig()
const mapUrl = computed(() => runtimeConfig.public.diamondTennisLocationUrl || businessConfig.contact.mapsUrl)
const locationImage = '/courts/tennis-aerial.jpg'
</script>

<template>
  <section id="lokacioni" class="location-section" aria-labelledby="location-title">
    <div class="location-section__inner">
      <div class="location-section__image">
        <img
          :src="locationImage"
          width="1400"
          height="1867"
          alt="Fushe tenisi e pare nga lart"
          loading="lazy"
        >
        <span>Hajvali / Prishtine</span>
      </div>

      <div class="location-section__content">
        <p>Lokacioni</p>
        <h2 id="location-title">Afer lojes.<br>Afer qytetit.</h2>
        <span>{{ businessConfig.contact.address || brandConfig.locationLabel }}</span>

        <dl>
          <div>
            <dt>Orari</dt>
            <dd>{{ businessConfig.hours.range }}</dd>
          </div>
          <div>
            <dt>Ditet</dt>
            <dd>{{ businessConfig.hours.label }}</dd>
          </div>
          <div>
            <dt>Fushat</dt>
            <dd>Outdoor / Indoor</dd>
          </div>
        </dl>

        <div class="location-section__actions">
          <UButton
            v-if="mapUrl"
            :to="mapUrl"
            target="_blank"
            rel="noopener"
            label="Hap ne harte"
            trailing-icon="i-lucide-navigation"
            color="primary"
            size="lg"
            class="location-section__primary"
          />
          <UButton
            to="/kontakt"
            label="Informata kontakti"
            trailing-icon="i-lucide-arrow-up-right"
            color="neutral"
            variant="outline"
            size="lg"
            class="location-section__secondary"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.location-section {
  padding: clamp(76px, 9vw, 126px) 0;
  background: #FFFFFF;
  color: var(--ink);
}

.location-section__inner {
  width: min(var(--container), calc(100% - 48px));
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
  min-height: 680px;
  margin: 0 auto;
  background: #E8EEE9;
}

.location-section__image {
  position: relative;
  min-height: 560px;
  overflow: hidden;
}

.location-section__image img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.location-section__image > span {
  position: absolute;
  right: 18px;
  bottom: 18px;
  border-radius: 999px;
  padding: 8px 12px;
  color: #FFFFFF;
  background: rgba(10, 23, 20, 0.74);
  font-size: 0.66rem;
  font-weight: 760;
  backdrop-filter: blur(12px);
}

.location-section__content {
  display: grid;
  align-content: center;
  justify-items: start;
  padding: clamp(48px, 8vw, 108px);
}

.location-section__content > p,
.location-section__content h2,
.location-section__content > span {
  margin: 0;
}

.location-section__content > p {
  margin-bottom: 14px;
  color: #1A6B55;
  font-size: 0.7rem;
  font-weight: 840;
  text-transform: uppercase;
}

.location-section__content h2 {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.5rem, 5vw, 5rem);
  font-weight: 500;
  line-height: 0.98;
}

.location-section__content > span {
  margin-top: 22px;
  color: var(--muted);
  font-size: 0.9rem;
}

.location-section dl {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 36px 0 0;
  border-block: 1px solid var(--line);
}

.location-section dl div {
  padding: 18px 16px 18px 0;
}

.location-section dl div + div {
  border-left: 1px solid var(--line);
  padding-left: 16px;
}

.location-section dt {
  color: var(--muted);
  font-size: 0.65rem;
}

.location-section dd {
  margin: 6px 0 0;
  font-size: 0.76rem;
  font-weight: 800;
}

.location-section__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 30px;
}

.location-section__primary,
.location-section__secondary {
  min-height: 48px;
  border-radius: 5px;
  font-size: 0.76rem;
  font-weight: 820;
}

.location-section__primary {
  background: var(--lime);
  color: var(--ink);
}

.location-section__secondary {
  border-color: var(--line);
  color: var(--ink);
}

@media (max-width: 900px) {
  .location-section__inner {
    grid-template-columns: 1fr;
  }

  .location-section__image {
    min-height: 480px;
  }
}

@media (max-width: 520px) {
  .location-section {
    padding: 64px 0;
  }

  .location-section__inner {
    width: calc(100% - 32px);
  }

  .location-section__content {
    padding: 42px 20px 48px;
  }

  .location-section dl {
    grid-template-columns: 1fr;
  }

  .location-section dl div + div {
    border-top: 1px solid var(--line);
    border-left: 0;
    padding-left: 0;
  }

  .location-section__actions {
    width: 100%;
    display: grid;
  }
}
</style>


