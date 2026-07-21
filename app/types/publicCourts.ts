export type PublicCourtType = 'indoor' | 'outdoor'

export interface PublicCourtImage {
  id: string
  url: string
}

/**
 * Public, read-only court data. Image URLs are short-lived signed URLs that
 * are issued only by the server endpoint.
 */
export interface PublicCourt {
  id: string
  name: string
  courtType: PublicCourtType
  latitude: number | null
  longitude: number | null
  imageUrl: string | null
}

export interface PublicCourtDetail extends PublicCourt {
  images: PublicCourtImage[]
}
