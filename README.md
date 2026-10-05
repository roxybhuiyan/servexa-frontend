# Servexa frontend

A complete React client for the immutable Servexa backend. All application reads and mutations use the documented HTTP APIs. Fixtures exist only under `tests/`; production has no mock API or fabricated server state.

## Run

Requires Node 26 or newer (implemented and tested with Node 26.3.1).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open **http://localhost:3000**. Start the existing backend separately using its existing instructions. The frontend does not start, modify, seed, or migrate it.

In development, `VITE_API_BASE_URL` defaults to `/api/v1`; Vite forwards requests unchanged to `http://localhost:5000`. This keeps browser requests same-origin on both `localhost:3000` and `127.0.0.1:3000` without changing the backend CORS allowlist. For production, set the full deployed API URL including `/api/v1` (or use `/api/v1` with your own same-origin reverse proxy); the Vite development proxy is not part of `dist/`. Include the version prefix exactly once. Only public browser configuration belongs in `VITE_*` variables. Optional `VITE_DISPLAY_CURRENCY` adds a currency label to catalog/booking amounts; configure it to match the deployed backend. Payment status shows its server-provided currency. No currency is inferred when this optional setting is absent.

For deployment, serve `dist/`, rewrite client routes to `index.html`, allow the frontend origin in the existing backend deployment's CORS configuration, and configure Stripe return URLs to this frontend's `/payments/success` and `/payments/cancel`. These are deployment prerequisites; backend files were not changed.

## Stack and organization

React 19, Vite 8, strict TypeScript, React Router 7, TanStack Query 5, React Hook Form 7, Zod 4, native fetch, CSS Modules/shared variables, Vitest 5, and Playwright. Exact resolved versions are in `package-lock.json`.

```text
src/
  api/         Typed endpoint registry, DTOs, fetch and normalized errors
  app/         Session lifecycle, query client, routes, roles, layouts
  contracts/   Request validation and endpoint-specific query schemas
  components/  Forms, dialogs, pagination, remote states and metrics
  features/    Public, auth, bookings, provider, payments, reviews, admin
  lib/         Date, decimal display, safe booking transitions
  styles/      Shared responsive design tokens and layout
scripts/       Reproducible coverage audit
tests/        Unit/component tests and mocked-HTTP browser journeys
docs/         Endpoint, Postman and page coverage ledgers
```

## Coverage

All 31 specified screens are routed. All 66 backend endpoints and 73 Postman examples are accounted for in [the coverage ledger](docs/COVERAGE.md). The registry implements 62 browser endpoints. E35 is server-to-server only, E64 is operational, and E65/E66 are informational backend redirect pages; frontend returns use E34 and E25 instead.

- Public: category/catalog search, exact supported filters, pagination, service/provider details, fixed slots, public reviews, live summaries.
- Customer: registration, login, profile, dashboard/history, booking requests/details/cancellation, hosted Checkout, review creation/edit/deletion.
- Provider: approval visibility, profile, existing service editing even before approval, approved-only creation/availability mutations/jobs, accept/reject/start/complete, public feedback.
- Admin: six dashboard API panels, users/status/deletion, provider approval, category CRUD, review moderation, read-only audit list/details and safe JSON.

## Authentication and cache isolation

Tokens stay in memory by default. “Keep this tab signed in” explicitly opts into `sessionStorage` persistence for reload recovery. Browser storage is readable by scripts on the origin; this is not HttpOnly-cookie authentication. No tokens are logged or placed in URLs. The current role comes from `/auth/me` after login/hydration.

A centralized client refreshes a protected 401 once, shares concurrent refresh work, replaces both tokens together, and retries the original request once. Session generations prevent stale requests or refreshes from restoring a logged-out account. Failed refresh clears auth/private query cache and protected routes return to login. 403 never initiates refresh. Logout clears local state immediately even if server revocation fails; the server error is surfaced. Account switches clear the query cache. Query retries and mutation retries are disabled; queries are fresh for 60 seconds and do not refetch on window focus.

## Payments and backend limitations

Checkout is available for an ACCEPTED booking with authoritative UNPAID status. Double clicks are disabled. Before initiation, per-tab storage records booking ID, account ID and attempt time; the response adds the Checkout session ID. This return context contains no token. Storage must be available before leaving the site. An in-memory-only session requires login again after Stripe return, then resumes the safe return route.

Return pages use the remembered booking ID, never `session_id` as an API lookup. They request E34 and E25, then perform at most three delayed automatic checks (5, 10, 20 seconds) followed by manual refresh. Only authoritative payment and booking states produce confirmation. Cancel return does not cancel, refund or expire anything. Ambiguous initiation failures and existing attempts lock out repeated creation. Definite pre-checkout failures can permit a manual retry only after a fresh UNPAID/ACCEPTED response. There is no client-side webhook or payment completion.

Known backend constraints remain visible: released slots may still conflict due to the unique earlier booking; previously booked slots may fail deletion; deleted reviews may not be recreated; provider stored rating may be stale; Checkout cancellation does not expire sessions; failed-payment identifiers may not reconcile; repeated sessions can overwrite transaction IDs. No refund, reschedule, notification, upload, map, payout, role-editing, password-reset, or admin booking/payment CRUD is invented.

## Frontend-only choices and unresolved deployment facts

- Deep links to owned service editing use the owned list endpoint. Beyond the first 100 entries, users explicitly request the next page to avoid an unbounded request burst. There is no owned service detail API.
- Existing-review lookup also walks own-review pages explicitly before exposing creation; this avoids assuming that absence from the first page means no review exists.
- Slot/service IDs are opaque IDs. Prices remain decimal strings; booking totals are never calculated in the client.
- Duration unit is not explicit in the backend contract; it is displayed without asserting a unit.
- Production API origin, deployed currency, CORS origins, Stripe return URLs, secret configuration and live webhook delivery remain deployment-specific and unverified.
- Conservative payment recovery can require operational help for persistent PENDING/ambiguous attempts; the frontend cannot resolve absent backend payment-history/session-expiry functionality.
- A 429 respects a readable Retry-After header, otherwise applies a 60-second local cooldown. The backend IP window may require longer; no automatic retry loop is used.

## Verification

```sh
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run audit:coverage
npm audit --omit=dev
```

Playwright uses installed Google Chrome (`channel: chrome`) and starts the local frontend on port 3000. Change the channel or install Playwright Chromium if Chrome is unavailable in another environment. Tests intercept HTTP only inside the test harness. Screenshots/traces are under ignored `test-results/`.

The tests exercise browser journeys against deterministic HTTP responses, not the live database or Stripe. No live payment/database test is claimed. See [verification results](docs/VERIFICATION.md) for the completed checks and backend immutability result.

Visual foundation: [Servexa canvas](https://superdesign.dev/teams/59271053-73b6-42f0-bda9-accc5e13266a/projects/0913c583-d0f7-4854-8ce6-166df55bf1ac). `.superdesign/` contains an unbundled visual reference; its example layout content is not an application data source.
# servexa-frontend
