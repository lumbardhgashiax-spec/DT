# Diamond Tennis Academy

Nuxt 4 / Nuxt UI application for Diamond Tennis Academy. It contains two
separate surfaces in one project:

- the public client website, with guest booking and no login requirement;
- the protected staff dashboard, connected to Supabase.

## Routes

Public routes include `/`, `/rezervo`, `/rezervimi/sukses`, `/fushat`,
`/meso-tenis`, `/rreth-nesh`, and `/kontakt`.

The staff dashboard remains protected by Supabase Auth. Its overview stays at
`/dashboard`; calendar, reservations, reports, and staff keep their existing
routes. Management pages are grouped under:

- `/menaxhimi/fushat`
- `/menaxhimi/sezonet`
- `/menaxhimi/cmimet`
- `/menaxhimi/sherbime-shtese`

## Public booking security

The browser never receives database write access, a Supabase service key, or
staff RPC access. Public booking requests use narrowly scoped server endpoints
under `/api/public/*`. The server validates customer data, opening hours,
active courts, seasons, prices, and extra services before inserting a booking.
The existing database overlap constraint remains the final protection against
double-booking.

`NUXT_SUPABASE_SECRET_KEY` is required only on the server. In Vercel you can
also use `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`NUXT_SUPABASE_SERVICE_KEY`, or `SUPABASE_SERVICE_KEY`; the app reads all of
these names. Never expose this key in the browser, a public environment
variable, or git. If it is missing in production, `/api/public/*` booking routes
return `503` and public courts will not load. The public API also has a small
process-local rate limit; production should additionally use an edge/WAF rate
limit. It ignores proxy-provided visitor IPs by default. Set
`NUXT_BOOKING_TRUST_PROXY=true` only when the hosting proxy is configured to
overwrite `X-Forwarded-For` safely.

Before production, verify that the dashboard RLS migration is applied and that
anonymous users have no direct table privileges. Because public bookings are
confirmed immediately, deploy an edge/WAF limit and choose a bot-verification
provider (for example, Turnstile) before opening the booking form to the
internet.

## Diamond Assistant

The public assistant calls OpenRouter only from Nuxt server routes. The browser
never receives the OpenRouter key. If `NUXT_OPENROUTER_API_KEY` is missing, the
assistant stays in maintenance mode and does not present placeholder answers as
real information.

## Setup

Copy `.env.example` to `.env`, then configure at minimum:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-publishable-or-anon-key
NUXT_SUPABASE_SECRET_KEY=your-server-only-secret-key
NUXT_PUBLIC_SITE_URL=https://your-site.com
NUXT_OPENROUTER_API_KEY=your-openrouter-key
NUXT_OPENROUTER_MODEL=openai/gpt-4o
NUXT_OPENROUTER_SITE_URL=https://your-site.com
NUXT_OPENROUTER_SITE_NAME=Diamond Tennis Academy
```

For Vercel, set those variables for the Production environment and redeploy
without build cache. Public pages are rendered at runtime; the home page is not
prerendered so it does not ship stale `_payload.json` data after a deploy.
After deploy, `/api/public/health` returns non-secret checks for the booking API.

Optional public links and canonical URL are also documented in
`.env.example`.

Install dependencies and start development:

```bash
npm install
npm run dev
```

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

## Database

The Supabase schema and migrations are in `supabase/`. The public booking
layer uses the existing `courts`, `court_images`, `seasons`, `price_rules`,
`extra_services`, `customers`, and `reservations` tables. It does not relax
RLS or change the staff-only `upsert_reservation` RPC.
