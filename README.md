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

Before production, verify that every Supabase migration is applied and that
anonymous users have no direct table privileges. Public bookings are held as
`pending` while the customer pays and become `confirmed` only after a
signature-verified Paysera webhook. Deploy an edge/WAF limit and choose a
bot-verification provider (for example, Turnstile) before opening the booking
form to the internet.

## Paysera Checkout Modern

The browser receives only the Paysera checkout URL. OAuth credentials, price
verification, order creation, and webhook verification stay on the Nuxt
server. There is no public fallback that confirms a reservation without
payment. The booking reference and calendar become available only after the
verified payment changes the reservation from `pending` to `confirmed`. The
webhook endpoint is:

```text
https://your-site.com/api/payments/paysera/webhook
```

Paysera also receives this URL automatically as the order `callback_url`.
Apply `supabase/migrations/202607230014_paysera_checkout_modern.sql` before
deploying the application code.

## Diamond Assistant

The public assistant calls an OpenAI-compatible LLM only from Nuxt server
routes. The browser never receives the model endpoint credentials. For Ollama,
use the `/v1/chat/completions` compatible API by setting
`NUXT_ASSISTANT_BASE_URL` to the Ollama host, for example
`http://192.168.0.29:11434`. If the model endpoint is unavailable, the assistant
stays in maintenance mode and does not present placeholder answers as real
information.

## Setup

Copy `.env.example` to `.env`, then configure at minimum:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-publishable-or-anon-key
NUXT_SUPABASE_SECRET_KEY=your-server-only-secret-key
NUXT_PUBLIC_SITE_URL=https://your-site.com
NUXT_PAYSERA_CLIENT_ID=your-paysera-client-id
NUXT_PAYSERA_CLIENT_SECRET=your-paysera-client-secret
NUXT_ASSISTANT_PROVIDER=openai-compatible
NUXT_ASSISTANT_BASE_URL=http://192.168.0.29:11434
NUXT_ASSISTANT_MODEL=gemma4:12b-mlx
NUXT_ASSISTANT_API_KEY=
NUXT_ASSISTANT_SITE_NAME=Diamond Tennis Academy
NUXT_ASSISTANT_DEVELOPER_NAME=Atomx Solutions SHPK
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
