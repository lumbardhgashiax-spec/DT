// https://nuxt.com/docs/api/configuration/nuxt-config
declare const process: { env: Record<string, string | undefined> }

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxtjs/supabase'],

  devtools: {
    // DevTools are not required by the application and can emit a
    // Node-runtime syntax error during Nuxt 4 development startup.
    enabled: false
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
      diamondTennisLocationUrl: process.env.NUXT_PUBLIC_DIAMOND_TENNIS_LOCATION_URL || 'https://www.google.com/maps/search/?api=1&query=42.61092,21.17710',
      diamondTennisInstagramUrl: process.env.NUXT_PUBLIC_DIAMOND_TENNIS_INSTAGRAM_URL || 'https://www.instagram.com/diamond.tennisacademy/',
      diamondTennisFacebookUrl: process.env.NUXT_PUBLIC_DIAMOND_TENNIS_FACEBOOK_URL || 'https://www.facebook.com/diamondtennisacademypr/'
    }
  },

  routeRules: {
    '/': { headers: { 'cache-control': 'no-store' } },
    '/rezervo': { headers: { 'cache-control': 'no-store' } },
    '/fushat/**': { headers: { 'cache-control': 'no-store' } },
    '/dashboard/**': { headers: { 'cache-control': 'no-store' } },
    '/kalendari/**': { headers: { 'cache-control': 'no-store' } },
    '/rezervimet/**': { headers: { 'cache-control': 'no-store' } },
    '/menaxhimi/**': { headers: { 'cache-control': 'no-store' } },
    '/stafi/**': { headers: { 'cache-control': 'no-store' } },
    '/raportet/**': { headers: { 'cache-control': 'no-store' } },
    '/api/**': { headers: { 'cache-control': 'no-store' } }
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
    url: process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    key: process.env.NUXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY,
    secretKey: process.env.NUXT_SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NUXT_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY,
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
