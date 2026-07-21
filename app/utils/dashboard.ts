export const ACADEMY_TIME_ZONE = 'Europe/Belgrade'

export function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat('sq-AL', {
    style: 'currency',
    currency: 'EUR'
  }).format(Number(value || 0))
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('sq-AL', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: ACADEMY_TIME_ZONE
  }).format(new Date(value))
}

export function toLocalDateInput(value: Date) {
  const offset = value.getTimezoneOffset() * 60_000
  return new Date(value.getTime() - offset).toISOString().slice(0, 10)
}

export function toLocalTimeInput(value: Date) {
  return value.toTimeString().slice(0, 5)
}

export function combineLocalDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString()
}
