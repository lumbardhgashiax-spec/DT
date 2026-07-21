import type { PublicCourt, PublicCourtDetail } from '~/types/publicCourts'

interface PublicCourtsResponse {
  courts: PublicCourt[]
}

function usePublicRequestFetch() {
  const requestFetch = useRequestFetch()

  return import.meta.server ? requestFetch : $fetch
}

/**
 * Keeps the public UI independent from Supabase. Court data and private image
 * paths remain on the server; the browser receives only safe public fields.
 */
export function usePublicCourtsApi() {
  const requestFetch = usePublicRequestFetch()

  return {
    list: async () => {
      const response = await requestFetch<PublicCourtsResponse>('/api/public/courts')
      return response.courts
    },
    get: (id: string) => requestFetch<PublicCourtDetail>(`/api/public/courts/${encodeURIComponent(id)}`)
  }
}
