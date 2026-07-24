<script setup lang="ts">
const route = useRoute()
const reference = computed(() => typeof route.query.reference === 'string' ? route.query.reference : '')

useSeoMeta({
  title: 'Pagesa nuk u krye',
  description: 'Pagesa e rezervimit ne Diamond Tennis Academy nuk u perfundua.'
})
</script>

<template>
  <main class="payment-failed">
    <section class="payment-failed__panel">
      <UIcon
        name="i-lucide-circle-x"
        aria-hidden="true"
      />
      <p>Pagesa</p>
      <h1>Pagesa nuk u krye.</h1>
      <span>
        Termini nuk eshte konfirmuar. Nese shuma eshte zbritur nga llogaria,
        mos paguaj perseri; kontrollo statusin ose kontakto stafin me emrin dhe numrin e telefonit.
      </span>

      <div class="payment-failed__actions">
        <UButton
          v-if="reference"
          :to="{ path: '/rezervimi/sukses', query: { reference } }"
          color="primary"
          size="lg"
          icon="i-lucide-shield-check"
          label="Kontrollo statusin"
        />
        <UButton
          to="/rezervo"
          color="neutral"
          variant="outline"
          size="lg"
          icon="i-lucide-rotate-ccw"
          label="Kthehu te rezervimi"
        />
        <UButton
          to="/"
          color="neutral"
          variant="outline"
          size="lg"
          icon="i-lucide-home"
          label="Kryefaqja"
        />
      </div>
    </section>
  </main>
</template>

<style scoped>
.payment-failed {
  min-height: 78dvh;
  display: grid;
  place-items: center;
  padding: clamp(42px, 7vw, 90px) max(18px, 7vw);
  background: #F7F6F1;
  color: #061735;
}

.payment-failed__panel {
  width: min(100%, 680px);
  border: 1px solid rgba(6, 23, 53, 0.12);
  border-radius: 8px;
  padding: clamp(24px, 5vw, 42px);
  background: #FFFFFF;
  box-shadow: 0 24px 72px rgba(6, 23, 53, 0.1);
}

.payment-failed__panel > :deep(svg) {
  width: 42px;
  height: 42px;
  color: #B42318;
}

.payment-failed__panel p {
  margin: 18px 0 12px;
  color: #B42318;
  font-size: 0.78rem;
  font-weight: 850;
  text-transform: uppercase;
}

.payment-failed__panel h1 {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 3rem);
  line-height: 1.08;
}

.payment-failed__panel > span {
  display: block;
  margin-top: 18px;
  color: rgba(6, 23, 53, 0.7);
  line-height: 1.65;
}

.payment-failed__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 26px;
}
</style>
