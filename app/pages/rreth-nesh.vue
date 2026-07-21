<script setup lang="ts">
useSeoMeta({
  title: 'Rreth nesh',
  description: 'Rreth Diamond Tennis Academy ne Hajvali, Prishtine: fusha tenisi, rezervime online dhe sherbime te organizuara per lojtaret.'
})
</script>

<template>
  <main class="about-page">
    <section class="about-hero">
      <p>Rreth nesh</p>
      <h1>Diamond Tennis Academy ne Hajvali.</h1>
      <span>
        Klub tenisi me fusha te menaxhuara, rezervim online dhe sherbime shtese sipas nevojes.
      </span>
    </section>

    <section class="about-values">
      <article>
        <UIcon name="i-lucide-trophy" />
        <h2>Rezervim online</h2>
        <p>Zgjedh fushen, daten, oren dhe konfirmon rezervimin me te dhena bazike.</p>
      </article>
      <article>
        <UIcon name="i-lucide-sparkles" />
        <h2>Fusha outdoor dhe indoor</h2>
        <p>Zgjedh fushen sipas sezonit, motit dhe menyres si deshiron te luash.</p>
      </article>
      <article>
        <UIcon name="i-lucide-shield-check" />
        <h2>Lokacion ne Hajvali</h2>
        <p>Diamond Tennis Academy pozicionohet per lojtare nga Hajvalia, Prishtina dhe rrethina.</p>
      </article>
    </section>
  </main>
</template>

<style scoped>
.about-page {
  background: #F7F6F1;
  color: #061735;
}

.about-hero {
  padding: calc(76px + clamp(42px, 7vw, 82px)) max(22px, 7vw) clamp(42px, 7vw, 82px);
  background: #061735;
  color: #F7F6F1;
}

.about-hero p {
  margin: 0 0 12px;
  color: #C6A15B;
  font-size: 0.78rem;
  font-weight: 850;
  text-transform: uppercase;
}

.about-hero h1 {
  max-width: 980px;
  margin: 0;
  font-size: clamp(1.85rem, 3.8vw, 3.15rem);
  line-height: 1.08;
}

.about-hero span {
  display: block;
  max-width: 720px;
  margin-top: 18px;
  color: rgba(247, 246, 241, 0.74);
  line-height: 1.65;
}

.about-values {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  padding: clamp(34px, 6vw, 70px) max(22px, 7vw);
}

.about-values article {
  min-height: 220px;
  padding: 26px;
  background: #FFFFFF;
}

.about-values :deep(svg) {
  width: 30px;
  height: 30px;
  color: #C6A15B;
}

.about-values h2 {
  margin: 20px 0 10px;
  font-size: 1.12rem;
}

.about-values p {
  margin: 0;
  color: rgba(6, 23, 53, 0.66);
  line-height: 1.6;
}

@media (max-width: 820px) {
  .about-values {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .about-hero {
    padding-top: calc(66px + clamp(34px, 7vw, 56px));
  }
}
</style>
