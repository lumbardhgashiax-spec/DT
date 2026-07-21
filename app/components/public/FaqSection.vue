<script setup lang="ts">
import { ref } from 'vue'
import { faqItems } from '~/config/publicContent'

const activeFaq = ref<number | null>(0)

function toggleFaq(index: number) {
  activeFaq.value = activeFaq.value === index ? null : index
}
</script>

<template>
  <section
    class="faq-section"
    aria-labelledby="faq-title"
  >
    <div class="faq-section__inner">
      <div class="faq-section__heading">
        <p>Pyetje te zakonshme</p>
        <h2 id="faq-title">Para se te hysh ne fushe.</h2>
        <span>
          Nuk e gjete pergjigjen? Asistenti i Diamond Tennis eshte gjithmone ne cepin e ekranit.
        </span>
        <UButton
          to="/kontakt"
          color="neutral"
          variant="link"
          label="Shiko kontaktin"
          trailing-icon="i-lucide-arrow-up-right"
          class="faq-section__link"
        />
      </div>

      <div class="faq-section__accordion">
        <article
          v-for="(item, index) in faqItems"
          :key="item.label"
          :class="{ 'is-open': activeFaq === index }"
        >
          <h3>
            <button
              type="button"
              :aria-expanded="activeFaq === index"
              :aria-controls="`faq-answer-${index}`"
              @click="toggleFaq(index)"
            >
              <span>0{{ index + 1 }}</span>
              <strong>{{ item.label }}</strong>
              <UIcon
                :name="activeFaq === index ? 'i-lucide-minus' : 'i-lucide-plus'"
                aria-hidden="true"
              />
            </button>
          </h3>

          <div
            v-show="activeFaq === index"
            :id="`faq-answer-${index}`"
            class="faq-section__answer"
          >
            <p>{{ item.content }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.faq-section {
  padding: clamp(76px, 9vw, 126px) 0;
  background: var(--page-bg);
  color: var(--ink);
}

.faq-section__inner {
  width: min(var(--container), calc(100% - 48px));
  display: grid;
  grid-template-columns: minmax(280px, 0.4fr) minmax(0, 0.6fr);
  gap: clamp(42px, 8vw, 110px);
  margin: 0 auto;
}

.faq-section__heading {
  align-self: start;
}

.faq-section__heading p,
.faq-section__heading h2,
.faq-section__heading > span {
  margin: 0;
}

.faq-section__heading p {
  margin-bottom: 14px;
  color: #1A6B55;
  font-size: 0.7rem;
  font-weight: 840;
  text-transform: uppercase;
}

.faq-section__heading h2 {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.5rem, 4.7vw, 4.6rem);
  font-weight: 500;
  line-height: 1;
}

.faq-section__heading > span {
  max-width: 380px;
  display: block;
  margin-top: 22px;
  color: var(--muted);
  font-size: 0.82rem;
  line-height: 1.65;
}

.faq-section__link {
  margin-top: 22px;
  padding: 0;
  color: var(--ink);
  font-size: 0.76rem;
  font-weight: 820;
}

.faq-section__accordion {
  border-top: 1px solid var(--line);
}

.faq-section__accordion article {
  border-bottom: 1px solid var(--line);
}

.faq-section__accordion h3 {
  margin: 0;
}

.faq-section__accordion button {
  width: 100%;
  min-height: 78px;
  display: grid;
  grid-template-columns: 36px 1fr 28px;
  gap: 14px;
  align-items: center;
  border: 0;
  padding: 0;
  color: var(--ink);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.faq-section__accordion button > span {
  color: var(--coral);
  font-size: 0.64rem;
  font-weight: 850;
}

.faq-section__accordion button strong {
  font-size: 0.88rem;
  font-weight: 800;
}

.faq-section__accordion button svg {
  width: 19px;
  height: 19px;
  justify-self: end;
  color: #1A6B55;
}

.faq-section__accordion button:focus-visible {
  outline: 2px solid #1A6B55;
  outline-offset: 3px;
}

.faq-section__answer {
  padding: 0 44px 24px 50px;
}

.faq-section__answer p {
  max-width: 620px;
  margin: 0;
  color: var(--muted);
  font-size: 0.82rem;
  line-height: 1.7;
}

.faq-section__accordion article.is-open button strong {
  color: #1A6B55;
}

@media (max-width: 800px) {
  .faq-section__inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .faq-section {
    padding: 64px 0;
  }

  .faq-section__inner {
    width: calc(100% - 32px);
    gap: 38px;
  }

  .faq-section__heading h2 {
    font-size: clamp(2.5rem, 12vw, 3.5rem);
  }

  .faq-section__accordion button {
    min-height: 74px;
    grid-template-columns: 26px minmax(0, 1fr) 24px;
    gap: 10px;
  }

  .faq-section__accordion button strong {
    font-size: 0.82rem;
    line-height: 1.4;
  }

  .faq-section__answer {
    padding: 0 30px 22px 36px;
  }
}
</style>


