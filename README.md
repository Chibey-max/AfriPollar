# AfriPollar Agent Corridor

**The African leg of Pollar's Africa-to-Latin-America corridor.**

A sender in Nigeria, Ghana, or Kenya funds a transfer through a local rail —
bank transfer, mobile money, or a verified local agent. The agent confirms the
local payment. Pollar settles the value in USDC on Stellar. The recipient in
Bolivia gets a claim page with payout status and settlement proof.

```text
African sender → local rail or agent → Pollar wallet → Stellar/USDC → Bolivia payout
```

**Live:** <https://afripollar-agent-corridor.vercel.app>

Built for the **Pollar Hackathon: Build on Pollar** — track: Best Pollar
Integration.

## What it does

| Surface | Route | Purpose |
| --- | --- | --- |
| Corridor dashboard | `/` | Live transfer list, corridor stats, supported routes |
| Sender flow | `/transfer/new` | Quote, route preview with fee breakdown, funding rail choice |
| Transfer detail | `/transfer/[id]` | Funding instructions, timeline, receipt, settlement |
| Recipient claim | `/claim/[id]` | Public, no login — payout status and proof |
| Agent desk | `/agent` | Confirm local funding; country/status/reference filters |
| Settings | `/settings` | Wallet, live-vs-sandbox disclosure, corridor rates |

## Why it matters

There is no consumer-friendly corridor between most African markets and
Bolivia. Bank transfers are slow and expensive, informal agent networks leave no
proof, and crypto onboarding asks ordinary users to understand wallet addresses,
gas, trustlines, and reserves.

Pollar solves the blockchain abstraction. AfriPollar solves the layer above it:
**local funding, agent confirmation, route clarity, and recipient experience.**

The design choice that makes this realistic is agent-assisted settlement. Rather
than pretending every African rail has a clean API, the product models how
emerging-market payments often actually work — someone pays locally, a trusted
agent confirms receipt, and settlement proceeds from there.

## How it uses Pollar

- `PollarProvider` wraps the app; `WalletButton` provides authentication UX, so
  onboarding is the sponsor's own component rather than a reimplementation.
- `usePollar()` supplies wallet address, session, and verification state, adapted
  into a single app-wide `WalletSession` in
  [`src/components/pollar/PollarRoot.tsx`](src/components/pollar/PollarRoot.tsx).
- Settlement submits a real Stellar USDC payment through the SDK:

  ```ts
  client.sendPayment({
    chain: "STELLAR",
    destination: corridorTreasuryAddress(),
    amount: settlementAmount.toFixed(2),
    asset: { type: "credit_alphanum4", code: "USDC", issuer: usdcIssuer() },
  }); // -> SubmitOutcome { status, hash }
  ```

  The returned hash is recorded automatically and rendered as an explorer link.

**The payment originates in the browser by necessity.** `getClient()` carries the
user's signing session, which the server does not have — so the route handler's
job is to *record* proof, not to move money. That single constraint shapes the
settlement architecture.

## Live vs sandbox

Stated plainly, because a corridor demo that overclaims is worse than one that
does not.

| Component | Status |
| --- | --- |
| Pollar wallet onboarding | **Live** when a publishable key is set; labelled demo wallet otherwise |
| Stellar USDC settlement | **Live-capable** — real payment and hash when configured; sandbox record otherwise |
| African local rails | **Sandbox** — demo bank/mobile-money details, no real debit |
| Agent confirmation | **Manual**, by a signed-in verified agent |
| Bolivia BOB payout | **Prepared path**, operated by Pollar |
| Corridor FX rates | **Static demo table**, not a live feed — labelled in the UI |

A sandbox settlement records a `sandbox-…` hash and deliberately renders **no
explorer link**, so it can never be mistaken for an on-chain transaction.

## User flow

**Sender** — connect wallet → pick corridor and amount → review route and fees →
choose funding rail → receive instructions with a reference code → pay locally.

**Agent** — sign in → see the pending queue → match the payment against the
sender's reference → confirm → transfer moves into Pollar settlement.

**Recipient** — open the claim link → see amount, sender, status, payout
instructions, and settlement proof. No account needed.

## Tech stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 ·
`@pollar/react` + `@pollar/core` · Supabase (Postgres) · Node test runner

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

Runs at <http://localhost:3000>. With no configuration at all it starts in demo
mode on a local JSON store, so the whole flow is walkable immediately.

### Persistence

Optional but required for any real deployment.

1. Create a Supabase project.
2. Run [`supabase/migrations/0001_create_transfers.sql`](supabase/migrations/0001_create_transfers.sql)
   in the SQL editor.
3. Set the two variables below, then verify:

```bash
npm run supabase:verify
```

That checks the table exists, round-trips a row through real `numeric` and
`jsonb` columns, exercises the double-confirm guard, and cleans up after itself.

> Without Supabase configured the app uses `.data/transfers.json`. That will
> **not** survive a serverless deployment — filesystems there are read-only
> apart from `/tmp`, which is not shared between invocations.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_POLLAR_API_KEY` | for live mode | Pollar **publishable** key (`pub_…`). The domain must be allowlisted in the Pollar dashboard |
| `NEXT_PUBLIC_DEMO_MODE` | no | `true` pins demo mode even with a key present |
| `NEXT_PUBLIC_CORRIDOR_TREASURY_ADDRESS` | for on-chain settlement | Stellar account that receives corridor USDC; needs a USDC trustline |
| `NEXT_PUBLIC_USDC_ISSUER` | no | Defaults to Circle's USDC issuer on Stellar testnet |
| `NEXT_PUBLIC_STELLAR_NETWORK` | no | `testnet` (default) or `public` |
| `NEXT_PUBLIC_SUPABASE_URL` | for Supabase | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | for Supabase | **Service role** key — server-side only, never `NEXT_PUBLIC_` |
| `AGENT_CONSOLE_PASSWORD` | recommended | Requires agent sign-in before any funding confirmation |

`GET /api/health` reports the active mode, storage backend, and agent auth
posture.

## Demo steps

Under three minutes:

1. Open `/` — the corridor, with live stats.
2. `/transfer/new` — Nigeria → Bolivia, enter recipient and amount.
3. Watch the route preview: local amount, rate, fee breakdown, USDC settled, BOB
   received.
4. Create the transfer → funding instructions with a reference code appear.
5. Switch to `/agent` — sign in, find the transfer, confirm the funding.
6. Back on the transfer: timeline advances, settlement panel appears.
7. Settle → hash and explorer link recorded on the receipt.
8. Open `/claim/[id]` — the recipient's view, with proof.

## Demo data

```bash
npm run data:seed     # six transfers spanning the whole corridor lifecycle
npm run data:reset    # clear everything
```

Seeding drives the public API, so each transfer reaches its state through the
real lifecycle rather than being written straight to the table.

## Tests

```bash
npm test              # 69 unit tests
npm run test:e2e      # 19 tests against a running server
npm run api:smoke     # scripted API walkthrough
```

Unit tests cover quote calculation and fee breakdown, transfer state
transitions, corridor domain logic, database row mapping (including a check that
`toRow` matches the migration's column list exactly), request validation, and
formatting.

End-to-end tests cover the full sender → agent → settlement → claim path and
agent access control. The auth suite skips itself unless
`AGENT_CONSOLE_PASSWORD` is set.

## Architecture notes

**Storage is pluggable.** [`transfer-store.ts`](src/lib/transfer-store.ts) is a
selector over two drivers; the corridor logic lives in
[`transfer-domain.ts`](src/lib/transfer-domain.ts) so the backends cannot drift.

**Concurrency is enforced in the database.** Confirmation and settlement use
conditional updates guarded on the expected status. A racing second operator
matches zero rows and receives **409** rather than silently double-confirming,
and the first agent's identity is never overwritten.

**Agent identity is taken from the session, not the request.** An operator signed
in as one agent cannot record a confirmation under another's name. Sessions are
HttpOnly cookies signed with an HMAC and compared in constant time.

**RLS is on with no permissive policy.** All access is server-side under the
service role; anon and authenticated roles get nothing.

**Reads are server components; writes go through the API.** Reads need no
absolute URL and work unchanged on Vercel; writes exercise the same documented
endpoints an external integrator would use.

## Known limitations

- Live Pollar settlement is wired and type-checked against the SDK but has not
  been executed end to end — it needs a publishable key whose allowlist includes
  the deployment origin.
- African local rails are sandbox instructions, not real payment APIs.
- Corridor FX rates are a static table.
- Bolivia payout readiness is described, not verified against Pollar's BOB ramp.
- No production KYC, compliance, or treasury operations.

## Why no custom Soroban contract

The corridor's chain integration is Pollar and Stellar. A receipt-registry or
escrow contract would be additive, but it would compete for attention with the
flow that actually answers the sponsor's challenge — and settlement proof is
already verifiable through the Stellar transaction itself. See
[`contracts/ARCHITECTURE.md`](contracts/ARCHITECTURE.md).

## Docs

- [Product PRD](docs/AFRIPOLLAR_AGENT_CORRIDOR_PRD.md)
- [API reference](docs/API.md)
- [Build log and decisions](docs/BUILD_SUMMARY.md)
- [Supabase schema and setup](supabase/README.md)
