<template>
  <section
    class="diamond-tennis-intro"
    aria-label="Diamond Tennis welcome"
  >
    <div class="diamond-tennis-intro__content">
      <span class="diamond-tennis-intro__mark">
        <UIcon
          name="i-lucide-message-circle"
          aria-hidden="true"
        />
      </span>
      <h2>Si mund te te ndihmoj?</h2>
      <p>
        Me trego diten dhe oren qe te pershtatet. Mund te kontrolloj terminet e lira dhe ta perfundoj rezervimin me konfirmimin tend.
      </p>
    </div>
  </section>
</template>

<style scoped>
.diamond-tennis-intro {
  min-height: 100%;
  display: grid;
  place-items: center;
  padding: 28px;
  background:
    linear-gradient(180deg, rgba(247, 248, 239, 0.96), rgba(238, 244, 239, 0.98)),
    #F7F8EF;
  color: #07110F;
}

.diamond-tennis-intro__content {
  width: min(340px, 100%);
  display: grid;
  justify-items: center;
  text-align: center;
}

.diamond-tennis-intro__mark {
  width: 62px;
  height: 62px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(16, 24, 22, 0.1);
  border-radius: 18px;
  background: #FFFFFF;
  color: #0A6C51;
  box-shadow: 0 18px 42px rgba(16, 24, 22, 0.08);
}

.diamond-tennis-intro__mark :deep(svg) {
  width: 28px;
  height: 28px;
}

.diamond-tennis-intro h2 {
  margin: 18px 0 0;
  color: #07110F;
  font-size: 1.3rem;
  font-weight: 940;
  line-height: 1.1;
}

.diamond-tennis-intro p {
  max-width: 300px;
  margin: 10px 0 0;
  color: rgba(7, 17, 15, 0.62);
  font-size: 0.94rem;
  line-height: 1.55;
}
</style>
