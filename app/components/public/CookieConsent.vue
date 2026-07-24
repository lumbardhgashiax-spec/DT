<script setup lang="ts">
type CookiePreferences = {
  necessary: true
  preferences: boolean
  analytics: boolean
  marketing: boolean
}

const STORAGE_KEY = 'diamond-cookie-preferences-v1'

const visible = ref(false)
const expanded = ref(false)
const preferences = reactive<CookiePreferences>({
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false
})

function readPreferences() {
  if (!import.meta.client) return

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      visible.value = true
      return
    }

    const parsed = JSON.parse(stored) as Partial<CookiePreferences>
    preferences.preferences = Boolean(parsed.preferences)
    preferences.analytics = Boolean(parsed.analytics)
    preferences.marketing = Boolean(parsed.marketing)
  } catch {
    visible.value = true
  }
}

function savePreferences(next?: Partial<CookiePreferences>) {
  if (next) {
    preferences.preferences = Boolean(next.preferences)
    preferences.analytics = Boolean(next.analytics)
    preferences.marketing = Boolean(next.marketing)
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
    necessary: true,
    preferences: preferences.preferences,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
    acceptedAt: new Date().toISOString()
  }))
  visible.value = false
}

function acceptNecessary() {
  savePreferences({
    preferences: false,
    analytics: false,
    marketing: false
  })
}

function acceptAll() {
  savePreferences({
    preferences: true,
    analytics: true,
    marketing: true
  })
}

onMounted(readPreferences)
</script>

<template>
  <section
    v-if="visible"
    class="cookie-consent"
    aria-label="Preferencat e cookies"
  >
    <div class="cookie-consent__copy">
      <strong>Cookies dhe privatësia</strong>
      <p>
        Përdorim cookies të domosdoshme për rezervim, siguri dhe pagesë.
        Cookies opsionale aktivizohen vetëm nëse i pranoni.
      </p>
      <NuxtLink to="/cookie-policy">
        Lexo Cookie Policy
      </NuxtLink>
    </div>

    <div
      v-if="expanded"
      class="cookie-consent__options"
    >
      <label>
        <input type="checkbox" checked disabled>
        <span>Domosdoshme</span>
      </label>
      <label>
        <input v-model="preferences.preferences" type="checkbox">
        <span>Preferenca</span>
      </label>
      <label>
        <input v-model="preferences.analytics" type="checkbox">
        <span>Analitikë</span>
      </label>
      <label>
        <input v-model="preferences.marketing" type="checkbox">
        <span>Marketing</span>
      </label>
    </div>

    <div class="cookie-consent__actions">
      <button type="button" @click="acceptNecessary">
        Vetëm të nevojshme
      </button>
      <button type="button" @click="expanded = !expanded">
        Preferencat
      </button>
      <button type="button" class="is-primary" @click="expanded ? savePreferences() : acceptAll()">
        {{ expanded ? 'Ruaj zgjedhjen' : 'Pranoj të gjitha' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.cookie-consent {
  position: fixed;
  right: max(14px, env(safe-area-inset-right));
  bottom: max(14px, env(safe-area-inset-bottom));
  left: max(14px, env(safe-area-inset-left));
  z-index: 120;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: end;
  width: min(960px, calc(100vw - 28px));
  margin-inline: auto;
  border: 1px solid rgba(10, 23, 20, 0.14);
  border-radius: 8px;
  padding: 18px;
  background: #FFFFFF;
  color: var(--ink);
  box-shadow: 0 22px 70px rgba(13, 35, 29, 0.16);
}

.cookie-consent__copy strong {
  display: block;
  font-size: 0.94rem;
  font-weight: 860;
}

.cookie-consent__copy p {
  max-width: 680px;
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 0.78rem;
  line-height: 1.55;
}

.cookie-consent__copy a {
  display: inline-flex;
  margin-top: 8px;
  color: var(--forest);
  font-size: 0.76rem;
  font-weight: 820;
  text-decoration: none;
}

.cookie-consent__options {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  order: 2;
}

.cookie-consent__options label {
  min-height: 42px;
  display: flex;
  gap: 8px;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 10px;
  background: #F7F9F5;
  font-size: 0.76rem;
  font-weight: 760;
}

.cookie-consent__options input {
  width: 16px;
  height: 16px;
  accent-color: var(--coral);
}

.cookie-consent__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.cookie-consent__actions button {
  min-height: 40px;
  border: 1px solid rgba(10, 23, 20, 0.16);
  border-radius: 5px;
  padding: 0 13px;
  background: #FFFFFF;
  color: var(--ink);
  font-size: 0.74rem;
  font-weight: 820;
  cursor: pointer;
}

.cookie-consent__actions button.is-primary {
  border-color: var(--coral);
  background: var(--coral);
  color: #FFFFFF;
}

@media (max-width: 760px) {
  .cookie-consent {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .cookie-consent__options {
    grid-template-columns: 1fr 1fr;
  }

  .cookie-consent__actions {
    justify-content: stretch;
  }

  .cookie-consent__actions button {
    flex: 1 1 150px;
  }
}
</style>
