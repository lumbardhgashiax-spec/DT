<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  description: string
  updatedAt: string
  sections: Array<{
    title: string
    body: string[]
  }>
}>()
</script>

<template>
  <article class="legal-page">
    <header class="legal-page__header">
      <p>{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <span>{{ description }}</span>
      <small>Përditësuar: {{ updatedAt }}</small>
    </header>

    <div class="legal-page__body">
      <section
        v-for="section in sections"
        :key="section.title"
      >
        <h2>{{ section.title }}</h2>
        <p
          v-for="paragraph in section.body"
          :key="paragraph"
        >
          {{ paragraph }}
        </p>
      </section>
    </div>
  </article>
</template>

<style scoped>
.legal-page {
  padding: clamp(92px, 10vw, 132px) max(18px, calc((100vw - 920px) / 2)) clamp(68px, 8vw, 110px);
  background: var(--page-bg);
  color: var(--ink);
}

.legal-page__header {
  max-width: 760px;
}

.legal-page__header p {
  margin: 0 0 12px;
  color: #1A6B55;
  font-size: 0.72rem;
  font-weight: 860;
  text-transform: uppercase;
}

.legal-page__header h1 {
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.35rem, 5vw, 4.5rem);
  font-weight: 500;
  line-height: 1;
}

.legal-page__header span,
.legal-page__header small {
  display: block;
  color: var(--muted);
}

.legal-page__header span {
  max-width: 680px;
  margin-top: 18px;
  font-size: 0.98rem;
  line-height: 1.65;
}

.legal-page__header small {
  margin-top: 14px;
  font-size: 0.74rem;
}

.legal-page__body {
  display: grid;
  gap: 28px;
  margin-top: 48px;
}

.legal-page__body section {
  border-top: 1px solid var(--line);
  padding-top: 24px;
}

.legal-page__body h2 {
  margin: 0 0 12px;
  font-size: 1rem;
  font-weight: 860;
}

.legal-page__body p {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.72;
}
</style>
