<script setup lang="ts">
import { computed, ref } from 'vue'
import { bookingStorySteps } from '~/config/publicContent'

const activeStep = ref(0)
const selectedStep = computed(() => bookingStorySteps[activeStep.value] ?? bookingStorySteps[0]!)

function moveStep(direction: number) {
  activeStep.value = (activeStep.value + direction + bookingStorySteps.length) % bookingStorySteps.length
}
</script>

<template>
  <section
    class="booking-story"
    aria-labelledby="process-title"
  >
    <div class="booking-story__inner">
      <div class="booking-story__heading">
        <div>
          <p>Prej zgjedhjes deri ne fushe</p>
          <h2 id="process-title">Rezervim pa humbje kohe.</h2>
        </div>
        <div class="booking-story__heading-action">
          <span>Kater hapa. Pa krijuar llogari.</span>
          <UButton
            to="/#availability"
            label="Fillo rezervimin"
            trailing-icon="i-lucide-arrow-up-right"
            color="primary"
            size="lg"
            class="booking-story__button"
          />
        </div>
      </div>

      <div class="booking-story__workspace">
        <ol
          class="booking-story__steps"
          aria-label="Hapat e rezervimit"
        >
          <li v-for="(step, index) in bookingStorySteps" :key="step.title">
            <button
              type="button"
              :class="{ 'is-active': activeStep === index }"
              :aria-current="activeStep === index ? 'step' : undefined"
              @click="activeStep = index"
            >
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
              <UIcon :name="step.icon" aria-hidden="true" />
              <strong>{{ step.title }}</strong>
            </button>
          </li>
        </ol>

        <div class="booking-story__panel">
          <div class="booking-story__panel-number">
            0{{ activeStep + 1 }}
          </div>

          <Transition name="step-fade" mode="out-in">
            <div :key="selectedStep.title" class="booking-story__panel-copy">
              <span>Hapi {{ activeStep + 1 }} nga {{ bookingStorySteps.length }}</span>
              <h3>{{ selectedStep.title }}</h3>
              <p>{{ selectedStep.copy }}</p>
            </div>
          </Transition>

          <div class="booking-story__controls" aria-label="Leviz mes hapave">
            <button
              type="button"
              aria-label="Hapi i meparshem"
              @click="moveStep(-1)"
            >
              <UIcon name="i-lucide-arrow-left" aria-hidden="true" />
            </button>
            <div aria-hidden="true">
              <span :style="{ width: `${((activeStep + 1) / bookingStorySteps.length) * 100}%` }" />
            </div>
            <button
              type="button"
              aria-label="Hapi i ardhshem"
              @click="moveStep(1)"
            >
              <UIcon name="i-lucide-arrow-right" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.booking-story {
  padding: clamp(76px, 9vw, 126px) 0;
  background: #E8EEE9;
  color: var(--ink);
}

.booking-story__inner {
  width: min(var(--container), calc(100% - 48px));
  margin: 0 auto;
}

.booking-story__heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 0.42fr);
  gap: clamp(36px, 8vw, 110px);
  align-items: end;
}

.booking-story__heading p,
.booking-story__heading h2,
.booking-story__heading-action > span {
  margin: 0;
}

.booking-story__heading p {
  margin-bottom: 14px;
  color: #1A6B55;
  font-size: 0.7rem;
  font-weight: 840;
  text-transform: uppercase;
}

.booking-story__heading h2 {
  max-width: 760px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.5rem, 4.8vw, 4.7rem);
  font-weight: 500;
  line-height: 1;
}

.booking-story__heading-action {
  display: grid;
  justify-items: start;
}

.booking-story__heading-action > span {
  color: var(--muted);
  font-size: 0.78rem;
}

.booking-story__button {
  min-height: 48px;
  margin-top: 18px;
  border-radius: 5px;
  padding-inline: 17px;
  background: var(--forest);
  color: #FFFFFF;
  font-size: 0.78rem;
  font-weight: 820;
}

.booking-story__workspace {
  margin-top: 48px;
  background: #FFFFFF;
}

.booking-story__steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
  border-bottom: 1px solid var(--line);
}

.booking-story__steps li + li {
  border-left: 1px solid var(--line);
}

.booking-story__steps button {
  width: 100%;
  min-height: 126px;
  display: grid;
  grid-template-columns: 22px 1fr;
  gap: 11px 13px;
  align-content: center;
  border: 0;
  padding: 20px;
  color: var(--ink);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: color 180ms ease, background-color 180ms ease;
}

.booking-story__steps button:hover,
.booking-story__steps button.is-active {
  color: #FFFFFF;
  background: var(--forest);
}

.booking-story__steps button > span {
  color: var(--coral);
  font-size: 0.64rem;
  font-weight: 850;
}

.booking-story__steps button svg {
  justify-self: end;
  width: 18px;
  height: 18px;
  color: #1A6B55;
}

.booking-story__steps button:hover svg,
.booking-story__steps button.is-active svg {
  color: var(--lime);
}

.booking-story__steps button strong {
  grid-column: 1 / -1;
  font-size: 0.82rem;
  font-weight: 820;
}

.booking-story__steps button:focus-visible,
.booking-story__controls button:focus-visible {
  position: relative;
  z-index: 1;
  outline: 2px solid var(--lime);
  outline-offset: -3px;
}

.booking-story__panel {
  min-height: 330px;
  display: grid;
  grid-template-columns: minmax(170px, 0.3fr) minmax(280px, 0.5fr) minmax(220px, 0.2fr);
  gap: 36px;
  align-items: center;
  padding: clamp(30px, 5vw, 64px);
}

.booking-story__panel-number {
  color: #1A6B55;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(5rem, 9vw, 8rem);
  line-height: 0.8;
}

.booking-story__panel-copy > span {
  color: var(--coral);
  font-size: 0.64rem;
  font-weight: 850;
  text-transform: uppercase;
}

.booking-story__panel-copy h3 {
  margin: 14px 0 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.8rem, 3vw, 3rem);
  font-weight: 500;
  line-height: 1;
}

.booking-story__panel-copy p {
  margin: 16px 0 0;
  color: var(--muted);
  font-size: 0.86rem;
  line-height: 1.65;
}

.booking-story__controls {
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  gap: 10px;
  align-items: center;
}

.booking-story__controls button {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--ink);
  background: transparent;
  cursor: pointer;
}

.booking-story__controls svg {
  width: 18px;
  height: 18px;
}

.booking-story__controls > div {
  height: 2px;
  overflow: hidden;
  background: var(--line);
}

.booking-story__controls > div span {
  height: 100%;
  display: block;
  background: var(--coral);
  transition: width 220ms ease;
}

.step-fade-enter-active,
.step-fade-leave-active {
  transition: opacity 180ms ease;
}

.step-fade-enter-from,
.step-fade-leave-to {
  opacity: 0;
}

@media (max-width: 840px) {
  .booking-story__heading,
  .booking-story__panel {
    grid-template-columns: 1fr;
  }

  .booking-story__panel {
    gap: 26px;
  }

  .booking-story__controls {
    max-width: 340px;
  }
}

@media (max-width: 560px) {
  .booking-story {
    padding: 64px 0;
  }

  .booking-story__inner {
    width: calc(100% - 32px);
  }

  .booking-story__heading {
    gap: 24px;
  }

  .booking-story__heading h2 {
    font-size: clamp(2.5rem, 12vw, 3.5rem);
  }

  .booking-story__workspace {
    margin-top: 34px;
  }

  .booking-story__steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .booking-story__steps li:nth-child(3),
  .booking-story__steps li:nth-child(4) {
    border-top: 1px solid var(--line);
  }

  .booking-story__steps li:nth-child(3) {
    border-left: 0;
  }

  .booking-story__steps button {
    min-height: 108px;
    padding: 16px;
  }

  .booking-story__panel {
    min-height: 430px;
    padding: 30px 20px;
  }

  .booking-story__panel-number {
    font-size: 5.4rem;
  }

  .booking-story__controls {
    width: 100%;
    max-width: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .step-fade-enter-active,
  .step-fade-leave-active,
  .booking-story__controls > div span {
    transition: none;
  }
}
</style>


