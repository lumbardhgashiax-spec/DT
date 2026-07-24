import { createError, getRequestIP, setResponseHeader } from 'h3'
import type { H3Event } from 'h3'

type PublicRateLimitBucket = 'courts' | 'availability' | 'quote' | 'booking' | 'confirmation' | 'calendar'

interface RateLimitRule {
  limit: number
  windowMs: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rules: Record<PublicRateLimitBucket, RateLimitRule> = {
  courts: { limit: 60, windowMs: 60_000 },
  availability: { limit: 90, windowMs: 60_000 },
  quote: { limit: 30, windowMs: 60_000 },
  booking: { limit: 6, windowMs: 15 * 60_000 },
  confirmation: { limit: 30, windowMs: 60_000 },
  calendar: { limit: 30, windowMs: 60_000 }
}

const requests = new Map<string, RateLimitEntry>()
let lastPruneAt = 0
const maximumTrackedClients = 5_000

function trimTrackedClients() {
  while (requests.size >= maximumTrackedClients) {
    const oldestKey = requests.keys().next().value
    if (!oldestKey) return
    requests.delete(oldestKey)
  }
}

function prune(now: number) {
  if (now - lastPruneAt < 60_000) {
    trimTrackedClients()
    return
  }

  lastPruneAt = now
  for (const [key, entry] of requests) {
    if (entry.resetAt <= now) requests.delete(key)
  }
  trimTrackedClients()
}

/**
 * Process-local abuse protection for the unauthenticated routes. Production
 * deployments with multiple instances should additionally enforce an edge/WAF
 * rate limit; this guard intentionally never stores visitor data in Supabase.
 * Proxy headers are ignored by default and must be explicitly trusted only on
 * infrastructure that sanitizes them.
 */
export function enforcePublicRateLimit(event: H3Event, bucket: PublicRateLimitBucket) {
  const now = Date.now()
  prune(now)

  const rule = rules[bucket]
  const runtimeConfig = useRuntimeConfig(event)
  const trustProxy = String(runtimeConfig.bookingTrustProxy).toLowerCase() === 'true'
  const clientIp = getRequestIP(event, { xForwardedFor: trustProxy }) || 'unknown'
  const key = `${bucket}:${clientIp}`
  const current = requests.get(key)

  if (!current || current.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + rule.windowMs })
    return
  }

  if (current.count >= rule.limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
    setResponseHeader(event, 'retry-after', retryAfter)
    throw createError({
      statusCode: 429,
      message: 'Shumë kërkesa në pak kohë. Provo përsëri pas pak.'
    })
  }

  current.count += 1
}
