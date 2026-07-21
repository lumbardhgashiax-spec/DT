import type { DashboardProfile, PriceRuleView, ReservationView } from '~/types/dashboard'
import type { TableRow } from '~/types/database.types'

/** The request shape accepted by POST /api/dashboard/actions. */
export interface DashboardActionRequest<TAction extends string = string, TPayload = unknown> {
  action: TAction
  payload?: TPayload
}

/** The successful response shape returned by POST /api/dashboard/actions. */
export interface DashboardActionResponse<TAction extends string = string, TData = unknown> {
  action: TAction
  data: TData
}

export interface DashboardActionDefinition<TPayload = undefined, TResult = unknown> {
  payload: TPayload
  result: TResult
}

export interface ReservationListPayload {
  startAt?: string
  endAt?: string
  courtId?: string
  statuses?: Array<TableRow<'reservations'>['status']>
  limit?: number
  order?: 'asc' | 'desc'
}

export interface DashboardOverview {
  today: number
  month: number
  revenue: number
  previousRevenue: number
  courts: number
  monthRows: Array<Pick<TableRow<'reservations'>, 'start_at' | 'price' | 'status'>>
  upcoming: ReservationView[]
}

export interface ReportReservationsPayload {
  startAt: string
  endAt: string
}

/**
 * The known API actions. Add new actions here as the server endpoint grows;
 * `request()` remains available for a fully typed custom action when needed.
 */
export interface DashboardApiActions {
  'profile.get': DashboardActionDefinition<undefined, DashboardProfile>
  'dashboard.overview': DashboardActionDefinition<undefined, DashboardOverview>
  'reservations.list': DashboardActionDefinition<ReservationListPayload | undefined, ReservationView[]>
  'reports.reservations': DashboardActionDefinition<ReportReservationsPayload, ReservationView[]>
  'reservations.options': DashboardActionDefinition<undefined, {
    customers: TableRow<'customers'>[]
    courts: TableRow<'courts'>[]
    seasons: TableRow<'seasons'>[]
    priceRules: PriceRuleView[]
    extraServices: TableRow<'extra_services'>[]
  }>
  'reservations.availability': DashboardActionDefinition<{ courtId: string, startAt: string, endAt: string, excludeId?: string }, { available: boolean }>
  'reservations.save': DashboardActionDefinition<Record<string, unknown>, boolean>
  'reservations.cancel': DashboardActionDefinition<{ id: string }, boolean>
  'reservations.delete': DashboardActionDefinition<{ id: string }, boolean>
  'courts.list': DashboardActionDefinition<undefined, TableRow<'courts'>[]>
  'seasons.list': DashboardActionDefinition<undefined, TableRow<'seasons'>[]>
  'seasons.save': DashboardActionDefinition<Record<string, unknown>, boolean>
  'seasons.delete': DashboardActionDefinition<{ id: string }, boolean>
  'prices.list': DashboardActionDefinition<undefined, PriceRuleView[]>
  'prices.save': DashboardActionDefinition<Record<string, unknown>, boolean>
  'prices.delete': DashboardActionDefinition<{ id: string }, boolean>
  'extra-services.list': DashboardActionDefinition<undefined, TableRow<'extra_services'>[]>
  'extra-services.save': DashboardActionDefinition<Record<string, unknown>, boolean>
  'extra-services.delete': DashboardActionDefinition<{ id: string }, boolean>
  'staff.list': DashboardActionDefinition<undefined, DashboardProfile[]>
}

type KnownAction = keyof DashboardApiActions & string
type ActionPayload<TAction extends KnownAction> = DashboardApiActions[TAction]['payload']
type ActionResult<TAction extends KnownAction> = DashboardApiActions[TAction]['result']
type RequestOptions = { signal?: AbortSignal }
type RequestArguments<TAction extends KnownAction> = undefined extends ActionPayload<TAction>
  ? [payload?: ActionPayload<TAction>, options?: RequestOptions]
  : [payload: ActionPayload<TAction>, options?: RequestOptions]

export class DashboardApiError extends Error {
  readonly action: string
  readonly statusCode?: number
  readonly data?: unknown

  constructor(action: string, cause: unknown) {
    const source = cause as { message?: string, status?: number, statusCode?: number, data?: unknown }
    super(source?.message || 'Kërkesa për dashboard dështoi.')
    this.name = 'DashboardApiError'
    this.action = action
    this.statusCode = source?.statusCode || source?.status
    this.data = source?.data
  }
}

/**
 * Shared dashboard API store. It uses the Nuxt server route for every call.
 * During SSR `useRequestFetch` forwards the incoming cookies/headers; in the
 * browser same-origin requests include the authenticated Supabase cookies.
 */
export function useDashboardApi() {
  const pendingByAction = useState<Record<string, number>>('dashboard-api-pending', () => ({}))
  const errorsByAction = useState<Record<string, DashboardApiError | null>>('dashboard-api-errors', () => ({}))
  const lastAction = useState<string | null>('dashboard-api-last-action', () => null)

  const requestFetch = import.meta.server ? useRequestFetch() : $fetch
  const pending = computed(() => Object.values(pendingByAction.value).some(count => count > 0))

  function isPending(action: string) {
    return computed(() => (pendingByAction.value[action] || 0) > 0)
  }

  function getError(action: string) {
    return computed(() => errorsByAction.value[action] || null)
  }

  function clearError(action?: string) {
    if (action) {
      const { [action]: _cleared, ...remaining } = errorsByAction.value
      errorsByAction.value = remaining
      return
    }
    errorsByAction.value = {}
  }

  async function request<TData = unknown, TPayload = unknown>(
    action: string,
    payload?: TPayload,
    options: RequestOptions = {}
  ): Promise<TData> {
    pendingByAction.value[action] = (pendingByAction.value[action] || 0) + 1
    errorsByAction.value[action] = null
    lastAction.value = action

    try {
      const response = await requestFetch<DashboardActionResponse<string, TData>>('/api/dashboard/actions', {
        method: 'POST',
        credentials: 'include',
        body: { action, ...(payload === undefined ? {} : { payload }) },
        signal: options.signal
      })
      return response.data
    } catch (cause) {
      const error = new DashboardApiError(action, cause)
      errorsByAction.value[action] = error
      throw error
    } finally {
      const next = (pendingByAction.value[action] || 1) - 1
      if (next > 0) pendingByAction.value[action] = next
      else {
        const { [action]: _finished, ...remaining } = pendingByAction.value
        pendingByAction.value = remaining
      }
    }
  }

  async function endpoint<TData = unknown>(url: string, options: Parameters<typeof requestFetch>[1] = {}) {
    return requestFetch<TData>(url, { credentials: 'include', ...options })
  }

  function call<TAction extends KnownAction>(action: TAction, ...args: RequestArguments<TAction>) {
    const [payload, options] = args
    return request<ActionResult<TAction>, ActionPayload<TAction>>(action, payload, options)
  }

  return {
    pending,
    pendingByAction: readonly(pendingByAction),
    errorsByAction: readonly(errorsByAction),
    lastAction: readonly(lastAction),
    isPending,
    getError,
    clearError,
    request,
    call,
    getProfile: () => call('profile.get'),
    getDashboardOverview: () => call('dashboard.overview'),
    listReservations: (payload?: ReservationListPayload) => call('reservations.list', payload),
    listReportReservations: (payload: ReportReservationsPayload) => call('reports.reservations', payload),
    getReservationOptions: () => call('reservations.options'),
    checkReservationAvailability: (payload: { courtId: string, startAt: string, endAt: string, excludeId?: string }) => call('reservations.availability', payload),
    saveReservation: (payload: Record<string, unknown>) => call('reservations.save', payload),
    cancelReservation: (id: string) => call('reservations.cancel', { id }),
    deleteReservation: (id: string) => call('reservations.delete', { id }),
    listCourts: () => call('courts.list'),
    listSeasons: () => call('seasons.list'),
    saveSeason: (payload: Record<string, unknown>) => call('seasons.save', payload),
    deleteSeason: (id: string) => call('seasons.delete', { id }),
    listPrices: () => call('prices.list'),
    savePrice: (payload: Record<string, unknown>) => call('prices.save', payload),
    deletePrice: (id: string) => call('prices.delete', { id }),
    listExtraServices: () => call('extra-services.list'),
    saveExtraService: (payload: Record<string, unknown>) => call('extra-services.save', payload),
    deleteExtraService: (id: string) => call('extra-services.delete', { id }),
    listStaff: () => call('staff.list'),
    getStaff: () => endpoint<TableRow<'profiles'>[]>('/api/staff'),
    createStaff: (payload: Record<string, unknown>) => endpoint<TableRow<'profiles'>>('/api/staff', { method: 'POST', body: payload }),
    updateStaff: (id: string, payload: Record<string, unknown>) => endpoint<TableRow<'profiles'>>(`/api/staff/${id}`, { method: 'PATCH', body: payload }),
    deleteStaff: (id: string) => endpoint<unknown>(`/api/staff/${id}`, { method: 'DELETE' }),
    listManagedCourts: () => endpoint<unknown[]>('/api/dashboard/courts'),
    createCourt: (payload: Record<string, unknown>) => endpoint<TableRow<'courts'>>('/api/dashboard/courts', { method: 'POST', body: payload }),
    updateCourt: (id: string, payload: Record<string, unknown>) => endpoint<TableRow<'courts'>>(`/api/dashboard/courts/${id}`, { method: 'PATCH', body: payload }),
    deleteCourt: (id: string) => endpoint<{ success: true, storageCleanupFailed: boolean }>(`/api/dashboard/courts/${id}`, { method: 'DELETE' }),
    uploadCourtImages: (id: string, images: File[]) => {
      const body = new FormData()
      images.forEach(image => body.append('images', image))
      return endpoint(`/api/dashboard/courts/${id}/images`, { method: 'POST', body })
    },
    deleteCourtImage: (courtId: string, imageId: string) => endpoint<unknown>(`/api/dashboard/courts/${courtId}/images/${imageId}`, { method: 'DELETE' })
  }
}
