// https://nuxt.com/docs/api/configuration/nuxt-config
declare const process: { env: Record<string, string | undefined> }

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxtjs/supabase'],

  devtools: {
    enabled: import.meta.dev
  },

  css: ['~/assets/css/main.css', '~/assets/css/public-site.css'],

  runtimeConfig: {
    // Keep false unless the reverse proxy is known to overwrite
    // X-Forwarded-For with the actual visitor IP.
    bookingTrustProxy: process.env.NUXT_BOOKING_TRUST_PROXY === 'true',
    openRouterApiKey: process.env.NUXT_OPENROUTER_API_KEY || '',
    openRouterModel: process.env.NUXT_OPENROUTER_MODEL || 'openai/gpt-4o',
    openRouterSiteUrl: process.env.NUXT_OPENROUTER_SITE_URL || process.env.NUXT_PUBLIC_SITE_URL || '',
    openRouterSiteName: process.env.NUXT_OPENROUTER_SITE_NAME || 'Diamond Tennis Academy',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || '',
      diamondTennisLocationUrl: process.env.NUXT_PUBLIC_DIAMOND_TENNIS_LOCATION_URL || '',
      diamondTennisInstagramUrl: process.env.NUXT_PUBLIC_DIAMOND_TENNIS_INSTAGRAM_URL || 'https://www.instagram.com/diamond.tennisacademy/',
      diamondTennisFacebookUrl: process.env.NUXT_PUBLIC_DIAMOND_TENNIS_FACEBOOK_URL || ''
    }
  },

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      include: [
        '/dashboard',
        '/dashboard/**',
        '/kalendari',
        '/kalendari/**',
        '/rezervimet',
        '/rezervimet/**',
        '/menaxhimi/cmimet',
        '/menaxhimi/cmimet/**',
        '/menaxhimi/sezonet',
        '/menaxhimi/sezonet/**',
        '/menaxhimi/fushat',
        '/menaxhimi/fushat/**',
        '/menaxhimi/sherbime-shtese',
        '/menaxhimi/sherbime-shtese/**',
        '/stafi',
        '/stafi/**',
        '/raportet',
        '/raportet/**'
      ]
    }
  }
})
