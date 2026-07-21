<template>
  <section class="final-cta">
    <div class="final-cta__media">
      <img
        src="/hero/diamond-hero-lifestyle.webp"
        width="1800"
        height="900"
        alt="Dy lojtare duke ecur ne fushe pas lojes"
        loading="lazy"
      >
      <div class="final-cta__shade" />
    </div>
    <div class="final-cta__content">
      <p>Radha jote per te sherbyer.</p>
      <h2>Gjej nje termin dhe hyr ne loje.</h2>
      <UButton
        to="/#availability"
        label="Rezervo fushen"
        trailing-icon="i-lucide-arrow-up-right"
        color="primary"
        size="xl"
        class="final-cta__button"
      />
    </div>
  </section>
</template>

<style scoped>
.final-cta {
  position: relative;
  min-height: 620px;
  display: grid;
  place-items: center;
  overflow: hidden;
  margin: 0;
  padding: 48px 20px;
  color: #FFFFFF;
  isolation: isolate;
}

.final-cta__media,
.final-cta__shade {
  position: absolute;
  inset: 0;
}

.final-cta__media {
  z-index: -3;
}

.final-cta__media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

.final-cta__shade {
  background: linear-gradient(90deg, rgba(7, 20, 17, 0.86), rgba(7, 20, 17, 0.48));
}

.final-cta__content {
  width: min(940px, 100%);
  display: grid;
  justify-items: center;
  text-align: center;
}

.final-cta__content p,
.final-cta__content h2 {
  margin: 0;
}

.final-cta__content p {
  color: var(--lime);
  font-size: 0.72rem;
  font-weight: 840;
  text-transform: uppercase;
}

.final-cta__content h2 {
  max-width: 820px;
  margin-top: 16px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(3rem, 7vw, 6.6rem);
  font-weight: 500;
  line-height: 0.96;
}

.final-cta__button {
  min-height: 54px;
  margin-top: 32px;
  border-radius: 5px;
  padding-inline: 22px;
  background: var(--lime);
  color: var(--ink);
  font-size: 0.82rem;
  font-weight: 840;
}

@media (max-width: 620px) {
  .final-cta {
    min-height: 540px;
  }

  .final-cta__media img {
    object-position: 62% center;
  }

  .final-cta__shade {
    background: rgba(7, 20, 17, 0.68);
  }
}
</style>


