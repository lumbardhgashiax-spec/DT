export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Role = 'staff' | 'admin' | 'superadmin'
type CourtType = 'outdoor' | 'indoor'
type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
type SeasonType = 'summer' | 'winter'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string, email: string | null, full_name: string, phone: string | null, role: Role, is_active: boolean, created_at: string, updated_at: string }
        Insert: { id: string, email?: string | null, full_name: string, phone?: string | null, role?: Role, is_active?: boolean, created_at?: string, updated_at?: string }
        Update: { email?: string | null, full_name?: string, phone?: string | null, role?: Role, is_active?: boolean, updated_at?: string }
        Relationships: []
      }
      customers: {
        Row: { id: string, first_name: string, last_name: string, phone: string, email: string | null, notes: string | null, created_by: string | null, created_at: string, updated_at: string }
        Insert: { id?: string, first_name: string, last_name: string, phone: string, email?: string | null, notes?: string | null, created_by?: string | null, created_at?: string, updated_at?: string }
        Update: { first_name?: string, last_name?: string, phone?: string, email?: string | null, notes?: string | null, updated_at?: string }
        Relationships: []
      }
      courts: {
        Row: { id: string, name: string, court_type: CourtType, supports_heating: boolean, latitude: number | null, longitude: number | null, is_active: boolean, created_at: string, updated_at: string }
        Insert: { id?: string, name: string, court_type: CourtType, supports_heating?: boolean, latitude?: number | null, longitude?: number | null, is_active?: boolean, created_at?: string, updated_at?: string }
        Update: { name?: string, court_type?: CourtType, supports_heating?: boolean, latitude?: number | null, longitude?: number | null, is_active?: boolean, updated_at?: string }
        Relationships: []
      }
      court_images: {
        Row: { id: string, court_id: string, storage_path: string, original_name: string | null, sort_order: number, created_by: string | null, created_at: string }
        Insert: { id?: string, court_id: string, storage_path: string, original_name?: string | null, sort_order?: number, created_by?: string | null, created_at?: string }
        Update: { original_name?: string | null, sort_order?: number }
        Relationships: []
      }
      extra_services: {
        Row: { id: string, name: string, description: string | null, price: number, is_active: boolean, created_by: string | null, created_at: string, updated_at: string }
        Insert: { id?: string, name: string, description?: string | null, price?: number, is_active?: boolean, created_by?: string | null, created_at?: string, updated_at?: string }
        Update: { name?: string, description?: string | null, price?: number, is_active?: boolean, updated_at?: string }
        Relationships: []
      }
      seasons: {
        Row: { id: string, name: string, season_type: SeasonType, starts_on: string, ends_on: string, is_active: boolean, created_at: string, updated_at: string }
        Insert: { id?: string, name: string, season_type: SeasonType, starts_on: string, ends_on: string, is_active?: boolean, created_at?: string, updated_at?: string }
        Update: { name?: string, season_type?: SeasonType, starts_on?: string, ends_on?: string, is_active?: boolean, updated_at?: string }
        Relationships: []
      }
      price_rules: {
        Row: { id: string, season_id: string, court_type: CourtType, with_heating: boolean, duration_minutes: number, price: number, is_active: boolean, created_at: string, updated_at: string }
        Insert: { id?: string, season_id: string, court_type: CourtType, with_heating?: boolean, duration_minutes: number, price: number, is_active?: boolean, created_at?: string, updated_at?: string }
        Update: { season_id?: string, court_type?: CourtType, with_heating?: boolean, duration_minutes?: number, price?: number, is_active?: boolean, updated_at?: string }
        Relationships: []
      }
      reservations: {
        Row: { id: string, booking_reference: string, customer_id: string, court_id: string, season_id: string, price_rule_id: string | null, start_at: string, end_at: string, with_heating: boolean, status: ReservationStatus, price: number, notes: string | null, created_by: string | null, created_at: string, updated_at: string }
        Insert: { id?: string, booking_reference?: string, customer_id: string, court_id: string, season_id: string, price_rule_id?: string | null, start_at: string, end_at: string, with_heating?: boolean, status?: ReservationStatus, price?: number, notes?: string | null, created_by?: string | null, created_at?: string, updated_at?: string }
        Update: { booking_reference?: string, customer_id?: string, court_id?: string, season_id?: string, price_rule_id?: string | null, start_at?: string, end_at?: string, with_heating?: boolean, status?: ReservationStatus, price?: number, notes?: string | null, updated_at?: string }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      cancel_reservation: {
        Args: { p_reservation_id: string }
        Returns: undefined
      }
      upsert_reservation: {
        Args: {
          p_reservation_id: string | null
          p_customer_id: string | null
          p_first_name: string
          p_last_name: string
          p_phone: string
          p_email: string | null
          p_court_id: string
          p_start_at: string
          p_duration_minutes: number
          p_with_heating: boolean
          p_status: ReservationStatus
          p_notes: string | null
          p_extra_service_ids?: string[]
        }
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type TableName = keyof Database['public']['Tables']
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row']
export type UserRole = Role
