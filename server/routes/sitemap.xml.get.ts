const publicRoutes = [
  '/',
  '/rezervo',
  '/fushat',
  '/meso-tenis',
  '/rreth-nesh',
  '/kontakt'
]

const xmlEntities: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '\'': '&apos;',
  '"': '&quot;'
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, character => xmlEntities[character] || character)
}

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const requestUrl = getRequestURL(event)
  const baseUrl = String(config.public.siteUrl || requestUrl.origin).replace(/\/$/, '')
  const today = new Date().toISOString().slice(0, 10)

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...publicRoutes.map(route => [
      '  <url>',
      `    <loc>${escapeXml(`${baseUrl}${route}`)}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      '    <changefreq>weekly</changefreq>',
      '    <priority>0.8</priority>',
      '  </url>'
    ].join('\n')),
    '</urlset>'
  ].join('\n')
})
