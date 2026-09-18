# AfriPollar Agent Corridor Build Summary

Date: September 17-18, 2026

## Current Goal

The backend foundation is complete and the user-facing interface is now built on top of it.

The current backend MVP supports a working demo flow for a Stellar/Pollar-powered remittance corridor:

1. Quote a local-currency-to-USDC corridor transfer.
2. Create a transfer with sender and recipient details.
3. Assign funding instructions for a local payment rail.
4. Confirm local funding through an agent workflow.
5. Move the transfer through wallet readiness and Stellar settlement states.
6. Expose claim/status data for the recipient-facing flow.

## Project Location

```txt
/home/phantom-call/Projects/Hackathon/afripollar-agent-corridor
```

## Completed Setup

- Scaffolded a Next.js app with TypeScript, Tailwind, ESLint, App Router, and `src/` structure.
- Installed Pollar packages:
  - `@pollar/core`
  - `@pollar/react`
- Added `.env.example` for the environment variables the project will need.
- Updated `next.config.ts` so Turbopack uses the project root cleanly.
- Added `.data/` to `.gitignore` for local runtime transfer storage.

## Completed Documentation

- Added the full product requirements document:
  - `docs/AFRIPOLLAR_AGENT_CORRIDOR_PRD.md`
- Added API documentation:
  - `docs/API.md`
- Added contract architecture notes:
  - `contracts/ARCHITECTURE.md`
- Added README files for the major work areas:
  - `docs/README.md`
  - `backend/README.md`
  - `contracts/README.md`
  - `deployments/README.md`
  - `packages/README.md`
  - `scripts/README.md`
  - `tests/README.md`

## Completed Project Structure

Created the main folders needed for the full product:

```txt
backend/
contracts/
deployments/
docs/
packages/
scripts/
src/app/
src/components/
src/data/
src/lib/
src/types/
tests/
```

All frontend routes are implemented:

```txt
src/app/page.tsx              Corridor dashboard
src/app/transfer/new/page.tsx Sender flow with live route preview
src/app/transfer/[id]/page.tsx Status, timeline, receipt, settlement
src/app/claim/[id]/page.tsx    Public recipient claim page
src/app/agent/page.tsx         Agent confirmation desk
src/app/settings/page.tsx      Wallet, live/sandbox disclosure, rates
```

## Completed Backend Domain Layer

Added shared domain models in:

```txt
src/types/corridor.ts
```

The domain model covers:

- Supported source countries.
- Supported source currencies.
- Funding methods.
- Corridor routes.
- Agents.
- Quotes.
- Transfers.
- Transfer timeline events.
- Transfer statuses.
- API error shape.

Added static corridor configuration in:

```txt
src/data/corridor-config.ts
```

The current sandbox corridors are:

- Nigeria to Bolivia.
- Ghana to Bolivia.
- Kenya to Bolivia.

The current demo agents are:

- Lagos agent.
- Accra agent.
- Nairobi agent.

Added core backend utilities:

```txt
src/lib/api.ts
src/lib/ids.ts
src/lib/quote.ts
src/lib/validation.ts
src/lib/transfer-state.ts
src/lib/transfer-store.ts
```

These utilities handle:

- JSON API success/error responses.
- Transfer/reference ID generation.
- Corridor quote calculation.
- Request body validation.
- Transfer lifecycle rules.
- Local JSON persistence for demo transfers.

## Completed API Routes

Implemented these App Router API endpoints:

```txt
GET  /api/health
GET  /api/agents
GET  /api/routes
POST /api/quotes
GET  /api/transfers
POST /api/transfers
GET  /api/transfers/:id
POST /api/transfers/:id/confirm-funding
POST /api/transfers/:id/settle
GET  /api/claim/:id
POST /api/webhooks/pollar
```

The API can now run the main hackathon demo flow without the frontend.

## Completed Frontend

Added a corridor design system in `src/app/globals.css`. The palette encodes the
corridor itself: a warm origin (Africa) resolving into a cool settled
destination (Bolivia), with full light and dark themes and a reduced-motion
guard.

Added shared UI in:

```txt
src/components/ui/primitives.tsx
src/components/ui/CopyButton.tsx
src/components/site/SiteHeader.tsx
src/components/site/SiteFooter.tsx
```

Added corridor components in:

```txt
src/components/transfer/CorridorDiagram.tsx
src/components/transfer/Timeline.tsx
src/components/transfer/FundingInstructions.tsx
src/components/transfer/SettlementPanel.tsx
src/components/transfer/NewTransferForm.tsx
src/components/transfer/badges.tsx
src/components/agent/ConfirmFundingCard.tsx
```

Added the Pollar integration layer in:

```txt
src/components/pollar/PollarRoot.tsx
src/components/pollar/WalletBadge.tsx
src/lib/mode.ts
```

`PollarRoot` wraps the app in `PollarProvider` when
`NEXT_PUBLIC_POLLAR_API_KEY` is set and `NEXT_PUBLIC_DEMO_MODE` is not `true`.
Otherwise it publishes a labelled demo session. Both branches expose one
`WalletSession` shape through a single context, so no downstream component
branches on mode and no hook is called conditionally. In live mode the header
renders Pollar's own `WalletButton` rather than a reimplementation.

### Page behaviour

Pages are server components that read the transfer store directly, so reads
need no absolute URL and work unchanged on Vercel. Mutations go through the
documented API routes from client components, then `router.refresh()`. The
route preview re-quotes against `POST /api/quotes` on every input change, so
the sender sees the backend's own maths rather than a duplicated calculation in
the browser.

### Honest labelling

Sandbox versus live is stated on every surface that could be mistaken for
production: a mode badge in the header and on each transfer, a sandbox notice
on the funding instructions, and a settlement-proof panel that says plainly
when a hash is a corridor-local record rather than an on-chain Stellar
transaction. `/settings` carries the full live-vs-sandbox table.


## Completed Pollar Settlement Wiring

Settlement now runs through the real SDK when a key is configured. The exact
call is:

```ts
client.sendPayment({
  chain: "STELLAR",
  destination: corridorTreasuryAddress(),
  amount: settlementAmount.toFixed(2),
  asset: { type: "credit_alphanum4", code: "USDC", issuer: usdcIssuer() },
}); // -> SubmitOutcome { status, hash }
```

The returned hash is posted to `POST /api/transfers/:id/settle` automatically,
so no one pastes a hash by hand any more. The manual field remains as an escape
hatch for a leg settled outside the app.

**The payment must originate in the browser.** `getClient()` hangs off the
Pollar React context and carries the user's signing session, which the server
does not have. The route handler's job is therefore to *record* proof, not to
move money. This is the main architectural consequence of the SDK's design.

Asset and network configuration lives in `src/lib/stellar.ts`, defaulting to
Circle's USDC issuer on the Stellar test network and overridable through env.

Verified by `tsc --noEmit` against the shipped SDK types, so the call shape is
known-correct. It has **not** been executed against live Pollar, because no
publishable key is available in this environment.

## Completed Agent/Operator Layer

`src/lib/agent-session.ts` protects the desk. When `AGENT_CONSOLE_PASSWORD` is
unset the desk stays open, which keeps local development and the smoke script
frictionless. Setting it turns on enforcement everywhere.

The important property: **a confirmation is recorded against the signed-in
agent, never against whatever the request body claims.** An operator signed in
as the Nairobi agent cannot confirm as the Lagos agent. Sessions are HttpOnly
cookies signed with an HMAC and compared in constant time, so a forged cookie
is rejected.

Programmatic access uses an `x-agent-key` header instead of a cookie.

The desk also gained country, status, and reference filters, held in the URL so
a filtered view is shareable.

## Completed Tests

Added `tsx` as the only new dev dependency and used Node's built-in test runner.

```bash
npm test       # 41 unit tests
npm run test:e2e   # 19 tests against a running server
```

Unit coverage: quote calculation (rates, fee floor, rounding, every supported
route, rejection of bad input), transfer state transitions (timeline
immutability, double-confirm and premature-settle guards), request validation,
and display formatting.

End-to-end coverage: the full sender -> agent -> settlement -> claim path, plus
agent access control. `tests/e2e/agent-auth.test.ts` skips itself unless
`AGENT_CONSOLE_PASSWORD` is exported, because an open desk is a legitimate local
configuration rather than a failure.

### A bug the tests found

`payoutAmount` was derived from the *unrounded* settlement figure while
`settlementAmount` was rounded separately, so the BOB on a receipt did not
reconcile against the USDC printed beside it. `src/lib/quote.ts` now rounds the
settlement first and derives the payout from that rounded value.


## Completed Supabase Persistence

Storage is now pluggable. `src/lib/transfer-store.ts` is a thin selector:
Supabase when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are
both set, the local JSON file otherwise. `GET /api/health` reports which is
active, and `npm run data:reset` resets whichever is configured.

To make that swap safe, the corridor logic was lifted out of the store into
`src/lib/transfer-domain.ts` (`buildTransfer`, `applyFundingConfirmation`,
`applySettlement`). Both drivers call the same functions, so the two backends
cannot drift — and the logic became directly unit-testable as a side effect.

Row mapping lives in `src/lib/transfer-row.ts`, deliberately free of
`server-only` so it can be tested outside Next.

```txt
supabase/migrations/0001_create_transfers.sql
supabase/README.md
src/lib/supabase.ts
src/lib/transfer-domain.ts
src/lib/transfer-row.ts
src/lib/transfer-store-json.ts
src/lib/transfer-store-supabase.ts
```

### Schema decisions

Queryable fields are real columns so the agent desk filters in the database
rather than in memory; `funding_instruction` and `timeline` are `jsonb` because
they are always read and written whole. Money is `numeric(20, 2)`, matching the
quote's rounding, and is read back through `Number()` because PostgREST may
serialise `numeric` as a string.

RLS is enabled with **no permissive policy**. Every read and write happens
server-side under the service role, which bypasses RLS by design; anon and
authenticated roles get nothing.

### Concurrency

Confirmation and settlement use conditional updates guarded on the expected
status. If the guard matches no row, another operator already advanced the
transfer and the API answers **409** instead of silently double-confirming.
This is stronger than the JSON store's in-process write queue, which only
serialises writes within a single instance.

### Verified against real Postgres

The migration and mapping were exercised against a throwaway `postgres:16`
container (since torn down), not just type-checked:

```txt
migration applies clean          CREATE TABLE, 4 indexes, RLS enabled
26 mapped columns insert         rows generated by the real domain code
round-trip is exact              amounts, timeline, funding instruction, nulls
check constraints reject         bad country, negative amount, unknown status
first confirm wins               UPDATE 1
racing second confirm            UPDATE 0  -> 409, identity not overwritten
racing second settle             UPDATE 0  -> 409
```

A unit test now parses the migration and asserts that `toRow` writes exactly
the declared column set, so schema drift fails the test run rather than
production.


## Completed Supabase Go-Live

The project is live and the migration is applied. Verified against the real
database, not just locally:

```txt
project        https://imeifmvttgsgzoiijlpt.supabase.co
key role       service_role (ref matches)
table          public.transfers present
numeric        97.3 USDC -> 673.32 BOB round-trip exact
jsonb          timeline and funding_instruction round-trip
guarded update first 1 row, racing 0 rows
19 e2e tests   pass against Supabase, auth required
```

`npm run supabase:verify` performs that check on demand and cleans up after
itself. A run of the full corridor left a real completed transfer in Postgres
while the 16-row local JSON store sat untouched, confirming the switch is real
rather than a silent fallback.

## Completed Fee Breakdown

The quote now returns a `breakdown` explaining how it was derived: rate used,
gross USDC, percentage fee, whether the minimum fee applied instead, the BOB
rate, and `rateSource`. The route preview shows each line, and labels the
figures as illustrative while `rateSource` is `demo-static`.

The breakdown is deliberately **not** persisted on `Transfer`. It is derived
from the rate table at quote time, so storing it would add a column that can
only go stale — and would have required a second migration against a database
that is already live.

Every figure on screen reconciles:

```txt
gross 98.68  -  fee 1.38  =  settlement 97.30
settlement 97.30  x  6.92  =  payout 673.32
```

## Completed Error States

A missing Supabase table exposed that `/` and `/agent` returned bare 500s, which
would kill the demo during judging if the database hiccupped. Added
`src/app/error.tsx`, which detects storage failures specifically and says what
to check, and `src/app/not-found.tsx` for bad transfer and claim links.

## Completed README

Rewritten against the PRD §21 outline: what it does, why it matters, how it uses
Pollar (including the browser-origination constraint), a live-vs-sandbox table,
user flow, setup, the full environment variable table, demo steps, test
inventory, architecture notes, known limitations, and the reasoning for shipping
no custom Soroban contract.


## Completed Vercel Deployment

```txt
https://afripollar-agent-corridor.vercel.app
project: chibey-maxs-projects/afripollar-agent-corridor
```

Six environment variables set across Production and Preview. The two real
secrets (`SUPABASE_SERVICE_ROLE_KEY`, `AGENT_CONSOLE_PASSWORD`) are stored as
Secret type; the `NEXT_PUBLIC_` values are Config.

Vercel challenged `NEXT_PUBLIC_POLLAR_API_KEY` as a credential being exposed to
the browser. Accepted deliberately as Config: a *publishable* key is designed to
ship to the client, and Pollar guards it with a domain allowlist rather than
secrecy.

The full corridor was then driven against the live deployment and live database
- create, auth-rejected confirm, authorised confirm, settle, claim, plus all six
pages rendering. See `deployments/PRODUCTION.md`.

## Completed Demo Seed Data

`npm run data:seed` replaces the test rows with six transfers spanning the whole
lifecycle across all three corridors - two completed, one payout-ready, one
wallet-ready, two awaiting funding. It drives the public API so each transfer
reaches its state through the real lifecycle.

This mattered because the table had filled with nine near-identical test rows,
which is what a judge would have seen on the dashboard.


## Completed Mobile Pass

Audited with headless Chrome at three real device viewports (iPhone SE 375,
iPhone 14 390, Pixel 7 412) across all six pages - eighteen combinations,
checking horizontal overflow, tap-target height, and minimum font size.

Horizontal overflow was clean from the start. Two real problems were found:

**Tap targets below 44px.** Header nav links were 32px, the logo 20px, and the
copy buttons 26px. All raised to a 44px minimum.

**Recipient names truncated to nothing.** The automated check passed the home
and agent lists, but a screenshot showed names rendering as "Sof...", "Val...",
"Die..." - the flex row was squeezing the name column into an ellipsis. The rows
were restructured so the name and amount lead, and the country chips, status,
and timestamp wrap onto a second line. Names now render in full.

That second issue is the reason the pass included looking at screenshots rather
than trusting the overflow numbers: nothing overflowed, and the layout was still
broken.

Re-verified against production after deploying: zero overflow, zero undersized
tap targets. The only remaining flag is `sr-only` radio inputs reported as 1px,
which is a false positive - their wrapping label is the real target.


## Completed Scripts

Added:

```txt
scripts/reset-demo-data.mjs
scripts/smoke-api.mjs
```

Added package scripts:

```json
{
  "data:reset": "node scripts/reset-demo-data.mjs",
  "api:smoke": "node scripts/smoke-api.mjs"
}
```

`data:reset` clears the local transfer store.

`api:smoke` performs a full backend smoke test:

1. Checks API health.
2. Loads agents.
3. Creates a quote.
4. Creates a transfer.
5. Confirms local funding.
6. Settles the transfer.
7. Fetches claim/status details.

## Verification Completed

These commands passed:

```bash
npm run lint
npm run build
npm run data:reset
npm run api:smoke
```

Smoke test result:

```txt
health: ok
agents: 3
quote: 97.3 USDC
created: trf_d74f488100cb4044a7
confirmed: wallet_ready
settled: completed
claim: completed
```

The frontend was then driven end to end against the running dev server. All six
routes returned 200 and rendered real store data, and the corridor advanced
correctly through the UI:

```txt
/transfer/:id   awaiting funding -> funding instructions + reference shown
agent confirm   wrong reference rejected (400), correct reference -> wallet_ready
/transfer/:id   settlement panel appears, agent name recorded
settle          -> completed, sandbox hash labelled as a sandbox settlement
/claim/:id      -> "Your payout is ready", 673.33 BOB, completed timeline
```

No errors or warnings appeared in the dev server log during the run.

## Current Runtime

The dev server was started successfully at:

```txt
http://localhost:3000
```

## What Is Intentionally Not Done Yet

**A protection bypass token now exists in project settings**, generated by
`vercel curl` while verifying a deployment-specific URL. It grants access to
protected deployment URLs and is no longer needed, so it is worth removing.

Vercel SSO protection covers the deployment-specific URLs but not the production
alias, so the submission link itself is public — verified anonymously across all
six pages.

**Live Pollar has never been exercised.** Two keys were tried:

```txt
pat_…       403 API_KEY_TYPE_NOT_ALLOWED   wrong key type (server PAT)
pub_testn…  403 ORIGIN_NOT_ALLOWED         correct type, origin not allowlisted
```

The publishable key is correct. What remains is a **Pollar dashboard action**:
allowlist the deployment origin (`http://localhost:3000` for local, plus the
Vercel URL). `NEXT_PUBLIC_DEMO_MODE` must also flip to `false`, and
`NEXT_PUBLIC_CORRIDOR_TREASURY_ADDRESS` must point at a funded testnet account
with a USDC trustline.

**Corridor rates are static placeholders** in `src/data/corridor-config.ts`.
There is still no live FX feed; the quote now declares `rateSource:
"demo-static"` and the UI labels the figures as illustrative.

**No proof of Bolivia payout readiness.** The destination leg is described but
nothing verifies it against Pollar's BOB ramp.

**Frontend polish is partial.** Loading, empty, and error states exist on the
main paths but have not been swept systematically. Mobile has been audited at
three device viewports in headless Chrome, but never on real hardware.

**No custom Soroban contracts.** The MVP does not need them; see
`contracts/ARCHITECTURE.md`.

## Recommended Next Steps

Submission deadline is September 18, 13:00 UTC.

1. **Allowlist the production origin in the Pollar dashboard**, then flip
   `NEXT_PUBLIC_DEMO_MODE=false`, set
   `NEXT_PUBLIC_CORRIDOR_TREASURY_ADDRESS`, and redeploy. One real testnet
   settlement hash on a receipt directly answers the "proof of real usage"
   criterion.
2. **Open the deployed app on a real phone.** It has been audited at three
   device viewports in headless Chrome and is clean, but emulation is not the
   same as hardware.
3. **Record the demo** using the script in the README, and submit with the copy
   from PRD §20.
4. **Remove the protection bypass token** from Vercel project settings.

Deliberately not recommended: custom Soroban contracts. The corridor's chain
integration is Pollar and Stellar, and a contract added in the final hours would
compete for attention with the flow that actually answers the sponsor's
challenge.

## Test Inventory

```bash
npm test              # 69 unit tests
npm run test:e2e      # 19 tests against a running server
npm run api:smoke     # scripted API walkthrough
npm run supabase:verify
```

Unit: quote calculation and fee breakdown, transfer state transitions, corridor
domain logic, row mapping and migration column coverage, request validation,
display formatting.

End-to-end: the full sender -> agent -> settlement -> claim path, plus agent
access control (skips itself unless `AGENT_CONSOLE_PASSWORD` is set).
