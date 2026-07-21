export const assistantConfig = {
  storageKeys: {
    bubbleDismissed: 'diamond-assistant:bubble-dismissed',
    draft: 'diamond-assistant:draft'
  },
  assets: {
    desktop: '/assistant/diamond-assistant.webp',
    mobile: '/assistant/diamond-assistant-mobile.webp',
    poster: '/assistant/diamond-assistant-poster.webp',
    fallback: '/AI Assistant - Diamond Tennis.png'
  },
  modelPath: '/models/diamond-assistant.glb',
  excludedRoutePatterns: [
    /^\/admin(?:\/|$)/,
    /^\/staff(?:\/|$)/,
    /^\/login\/?(?:admin|staff)?$/,
    /^\/print(?:\/|$)/,
    /^\/export(?:\/|$)/,
    /^\/pdf(?:\/|$)/
  ],
  welcomeBubble: 'Pershendetje. A te ndihmoj te rezervosh nje fushe?'
} as const
