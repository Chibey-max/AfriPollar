# Production Deployment

## URLs

```txt
https://afripollar-agent-corridor.vercel.app          <- submit this one
https://afripollar-agent-corridor-chibey-maxs-projects.vercel.app
```

Vercel project: `chibey-maxs-projects/afripollar-agent-corridor`

## Configured environment

| Variable | Type | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Config | project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | service role key |
| `NEXT_PUBLIC_POLLAR_API_KEY` | Config | publishable key (`pub_…`) |
| `NEXT_PUBLIC_DEMO_MODE` | Config | `false` |
| `NEXT_PUBLIC_CORRIDOR_TREASURY_ADDRESS` | Config | funded Stellar testnet treasury |
| `NEXT_PUBLIC_STELLAR_NETWORK` | Config | `testnet` |
| `AGENT_CONSOLE_PASSWORD` | **Secret** | generated at deploy time |

Set for both Production and Preview.

`NEXT_PUBLIC_POLLAR_API_KEY` is intentionally a public Config value: a
*publishable* key is designed to ship to the browser, and Pollar protects it with
a domain allowlist rather than secrecy. The two real secrets are stored as
Secret type and are never exposed to the client.

## Verified in production

The full corridor was driven against the live deployment and the live Supabase
database:

```txt
POST /api/transfers                      201  writes to Supabase
POST /confirm-funding  (no auth)         401  AGENT_AUTH_REQUIRED
POST /confirm-funding  (x-agent-key)     200  wallet_ready, agent recorded
POST /settle                             200  completed
GET  /api/claim/:id                      200  no reference or bank details leaked
all six pages                            200  rendered
/agent anonymous                         sign-in shown, queue not leaked
/claim/:id                               "Your payout is ready", proof visible
```

## Outstanding

### 1. Deployment Protection — production alias is fine

Vercel SSO protection is enabled with `deploymentType:
all_except_custom_domains`, which guards the **deployment-specific** URLs
(`…-3w7tcpjo9-…vercel.app`) but **not** the production alias.

Verified as an anonymous visitor, no CLI auth and no bypass header:

```txt
200  /
200  /transfer/new
200  /agent          (sign-in shown, queue not leaked)
200  /settings
200  /transfer/:id
200  /claim/:id      (public, no login)
200  /api/health
```

So <https://afripollar-agent-corridor.vercel.app> is safe to submit as-is.
Nothing needs changing.

If you later want the per-deployment preview URLs public too:

```bash
vercel project protection disable --sso
```

### 2. Pollar origin allowlist — fixed

Live wallet onboarding and on-chain settlement require the deployment origin in
the allowed domains for the publishable key in the Pollar dashboard:

```txt
https://afripollar-agent-corridor.vercel.app
http://localhost:3000
```

Verified on 18 Sep 2026:

```txt
GET /v2/applications/config
Origin: https://afripollar-agent-corridor.vercel.app
-> 200 SDK_APPLICATION_CONFIG
access-control-allow-origin: https://afripollar-agent-corridor.vercel.app
```

`NEXT_PUBLIC_DEMO_MODE=false` is deployed in Production and Preview.

### 3. Treasury address — configured

`NEXT_PUBLIC_CORRIDOR_TREASURY_ADDRESS` is set to a funded Stellar testnet
account with XLM and Circle testnet USDC trustline/funds:

```txt
GCSZRHVKVVKHHSMNKC6XO65N3ERTMK3P5FYABS62XSRSLBW4QUJZ7WX6
USDC: 20.0000000
XLM: 9999.9999800
```

## Note on the protection bypass token

Verifying the deployment-specific URL with `vercel curl` caused the CLI to
generate a **protection bypass token** in project settings. It is a standing
secret that grants access to otherwise-protected deployment URLs. Nothing needs
it any more, so it is worth removing:

```bash
vercel project protection            # shows current settings
vercel project protection disable --protection-bypass \
  --protection-bypass-secret <secret>
```

## Supabase notes

**Supabase Auth is not used.** The app talks to Supabase only through the
service role key, server-side, with RLS denying everything else. The *Auth →
URL Configuration* screen (Site URL, Redirect URLs) has no effect on this
project - those settings govern magic-link and OAuth redirects, which the
corridor never performs.

The domain allowlist that does matter lives in the **Pollar** dashboard, not
Supabase.

**Quota warning.** The Supabase organisation is flagged as over quota for the
previous billing cycle, with project restrictions threatened from 13 Oct 2026.
That is well after the hackathon, but worth clearing before the project is
relied on.

## Demo data

```bash
npm run data:seed     # six transfers spanning the whole lifecycle
npm run data:reset    # clear everything
```

Seeding drives the public API, so every transfer reaches its state through the
real lifecycle rather than being written straight to the table. Local and
production share one Supabase project, so seeding once covers both.
