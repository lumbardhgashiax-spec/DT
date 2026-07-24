export type CourtId = string

export type CourtType = 'indoor' | 'outdoor'

export type BookingCurrency = 'EUR'

export interface BookingCourt {
  id: CourtId
  name: string
  courtType: CourtType
  imageUrl?: string | null
}

export interface BookingExtraService {
  id: string
  name: string
  description: string | null
  /** Price for one booking hour. */
  price: number
}

export interface BookingOpeningHours {
  start: string
  end: string
}

export interface PublicBookingOptions {
  timezone: string
  openingHours: BookingOpeningHours
  slotMinutes: number
  durationMinutes: number
  payment: {
    provider: 'paysera'
    available: boolean
  }
  courts: BookingCourt[]
  extraServices: BookingExtraService[]
}

export interface BookingSlot {
  courtId: CourtId
  date: string
  time: string
  available: boolean
}

export interface BookingQuoteRequest {
  courtId: CourtId
  date: string
  time?: string
  durationMinutes?: number
  extraServiceIds?: string[]
}

export interface BookingQuote {
  court: Pick<BookingCourt, 'id' | 'name' | 'courtType'>
  season: {
    name: string
    type: string
  }
  date: string
  time?: string
  durationMinutes: number
  /** Selected services with their hourly price at the time of the quote. */
  extras: Array<{
    id: string
    name: string
    description: string | null
    hourlyPrice: number
  }>
  courtHourlyPrice: number
  extrasHourlyPrice: number
  totalPrice: number
  currency: BookingCurrency
}

export interface BookingCustomer {
  firstName: string
  lastName: string
  phone: string
  email?: string
}

export interface CreateBookingRequest extends BookingQuoteRequest {
  time: string
  checkoutRequestId: string
  legalAccepted: boolean
  customer: BookingCustomer
}

export type BookingPaymentStatus = 'initializing' | 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired' | 'refunded' | 'chargeback' | 'review'

export interface BookingConfirmation {
  reference: string
  bookingReference?: string
  courtName: string
  date: string
  time: string
  endTime: string
  durationMinutes: number
  totalPrice: number
  currency: BookingCurrency
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  paymentStatus?: BookingPaymentStatus
  paidAt?: string | null
  expiresAt?: string | null
  createdAt: string
}

export interface BookingCheckout {
  paymentStatus: 'pending'
  checkoutUrl: string
  expiresAt: string
}

export interface BookingDraft {
  courtId?: CourtId
  date?: string
  time?: string
  extraServiceIds?: string[]
  customer: Partial<BookingCustomer>
  quote?: BookingQuote
  confirmation?: BookingConfirmation
}
