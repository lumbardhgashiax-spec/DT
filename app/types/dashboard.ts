import type { TableRow } from './database.types'

export interface ReservationView extends TableRow<'reservations'> {
  customers: Pick<TableRow<'customers'>, 'first_name' | 'last_name' | 'phone' | 'email'> | null
  courts: Pick<TableRow<'courts'>, 'name' | 'court_type'> | null
}

export interface PriceRuleView extends TableRow<'price_rules'> {
  seasons: Pick<TableRow<'seasons'>, 'name'> | null
}

export interface DashboardProfile {
  id: string
  email: string | null
  full_name: string
  phone: string | null
  role: 'staff' | 'admin' | 'superadmin'
  is_active: boolean
}
