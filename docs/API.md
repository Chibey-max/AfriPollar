# AfriPollar API

The MVP backend is implemented as Next.js route handlers.

Persistence is pluggable. With `NEXT_PUBLIC_SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` set, transfers persist to Supabase; otherwise they
go to a local JSON store at `.data/transfers.json`. See `supabase/README.md` for
setup and schema notes.

`GET /api/health` reports the active backend and whether the agent desk
requires authentication.

## Health

```http
GET /api/health
```

Returns service status, mode, active storage backend (`supabase` or
`local-json`), and agent auth posture (`required` or `open`).

## Agents

```http
GET /api/agents
```

Returns available local rail agents.

## Routes

```http
GET /api/routes
```

Returns supported corridor routes.

## Quote

```http
POST /api/quotes
```

Body:

```json
{
  "senderCountry": "NG",
  "sourceAmount": 150000,
  "fundingMethod": "bank_transfer"
}
```

## Transfers

```http
GET /api/transfers
POST /api/transfers
```

Create body:

```json
{
  "senderName": "Demo Sender",
  "senderCountry": "NG",
  "recipientName": "Lucia Fernandez",
  "recipientContact": "lucia@example.com",
  "sourceAmount": 150000,
  "fundingMethod": "bank_transfer",
  "pollarWalletAddress": "G..."
}
```

## Transfer Detail

```http
GET /api/transfers/:id
```

## Agent Session

```http
POST   /api/agent/session
DELETE /api/agent/session
```

Only active when `AGENT_CONSOLE_PASSWORD` is set. `POST` signs an operator in as
one of the verified agents and sets an HttpOnly, HMAC-signed session cookie.
`DELETE` signs them out.

Body:

```json
{
  "agentId": "agent-lagos-001",
  "password": "..."
}
```

## Confirm Local Funding

```http
POST /api/transfers/:id/confirm-funding
```

Body:

```json
{
  "agentId": "agent-lagos-001",
  "localPaymentReference": "AFRI-...",
  "confirmationNote": "Bank transfer received"
}
```

The reference must match the one issued to the sender, or the call is rejected.

### Authorisation

When `AGENT_CONSOLE_PASSWORD` is unset the desk is open and this endpoint
accepts any confirmation, which keeps local development frictionless.

When it is set, the call must carry either:

- a valid agent session cookie, in which case the confirmation is recorded
  against the **signed-in** agent and the `agentId` in the body is ignored, or
- an `x-agent-key` header matching the configured password, for programmatic
  access such as the smoke script.

Anything else answers `401 AGENT_AUTH_REQUIRED`.

## Settle Transfer

```http
POST /api/transfers/:id/settle
```

Body:

```json
{
  "pollarWalletAddress": "G...",
  "stellarTxHash": "optional-real-testnet-tx-hash",
  "markCompleted": true
}
```

If `stellarTxHash` is omitted, the API records a sandbox settlement hash and no
explorer link, so the receipt and claim page can label it honestly.

In live mode the browser submits the real USDC payment through Pollar's
`sendPayment` first, then posts the returned hash here. The signing session
lives in the browser, so the server records proof rather than moving money.

## Claim

```http
GET /api/claim/:id
```

Returns a public-safe claim payload for recipients.

## Pollar Webhook Intake

```http
POST /api/webhooks/pollar
```

Ready for future event-specific handling when Pollar dashboard webhooks are configured.

