export const assistantConfig = {
  storageKeys: {
    bubbleDismissed: 'diamond-assistant:bubble-dismissed',
    draft: 'diamond-assistant:draft'
  },
  assets: {
    desktop: '/assistant/diamond-assistant.webp',
    mobile: '/assistant/diamond-assistant-mobile.webp',
    poster: '/assistant/diamond-assistant-poster.webp'
  },
  excludedRoutePatterns: [
    /^\/admin(?:\/|$)/,
    /^\/staff(?:\/|$)/,
    /^\/login\/?(?:admin|staff)?$/,
    /^\/print(?:\/|$)/,
    /^\/export(?:\/|$)/,
    /^\/pdf(?:\/|$)/
  ],
  welcomeBubble: 'Pershendetje. Te ndihmoj me gjet nje termin te lire?'
} as const
