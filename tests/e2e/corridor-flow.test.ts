import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

/**
 * End-to-end corridor path: sender -> agent -> settlement -> claim.
 *
 * Runs against a server that is already up (`npm run dev` or `npm start`).
 * Set BASE_URL to point at a deployed instance instead.
 */
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

/* eslint-disable @typescript-eslint/no-explicit-any -- test assertions read arbitrary JSON */
type Json = Record<string, any>;

async function api(path: string, init?: RequestInit): Promise<{ status: number; body: Json }> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  return { status: response.status, body: (await response.json()) as Json };
}

async function page(path: string) {
  const response = await fetch(`${BASE_URL}${path}`);
  return { status: response.status, html: await response.text() };
}

describe("corridor end-to-end", () => {
  let transferId = "";
  let reference = "";

  before(async () => {
    const { status, body } = await api("/api/health");
    assert.equal(status, 200, `server must be running at ${BASE_URL}`);
    assert.equal(body.data.status, "ok");
  });

  it("quotes a Nigeria -> Bolivia transfer", async () => {
    const { status, body } = await api("/api/quotes", {
      method: "POST",
      body: JSON.stringify({
        senderCountry: "NG",
        sourceAmount: 150000,
        fundingMethod: "bank_transfer",
      }),
    });

    assert.equal(status, 200);
    assert.equal(body.data.settlementAsset, "USDC");
    assert.equal(body.data.payoutCurrency, "BOB");
    assert.ok(body.data.settlementAmount > 0);
  });

  it("creates a transfer awaiting local funding", async () => {
    const { status, body } = await api("/api/transfers", {
      method: "POST",
      body: JSON.stringify({
        senderName: "E2E Sender",
        senderCountry: "NG",
        recipientName: "Lucia Fernandez",
        recipientContact: "lucia@example.com",
        sourceAmount: 150000,
        fundingMethod: "bank_transfer",
      }),
    });

    assert.equal(status, 201, "creating a transfer must answer 201 Created");
    assert.equal(body.data.status, "awaiting_local_funding");
    assert.ok(body.data.fundingInstruction.referenceCode.startsWith("AFRI-"));

    transferId = body.data.id;
    reference = body.data.localPaymentReference;
  });

  it("shows funding instructions on the transfer page", async () => {
    const { status, html } = await page(`/transfer/${transferId}`);

    assert.equal(status, 200);
    assert.ok(html.includes(reference), "the reference code must be visible to the sender");
    assert.ok(html.includes("Pay locally to fund this transfer"));
  });

  it("rejects an agent confirmation with the wrong reference", async () => {
    const { status, body } = await api(`/api/transfers/${transferId}/confirm-funding`, {
      method: "POST",
      body: JSON.stringify({
        agentId: "agent-lagos-001",
        localPaymentReference: "AFRI-WRONG-0000",
      }),
    });

    assert.equal(status, 400);
    assert.match(body.error.message, /does not match/);
  });

  it("advances to wallet_ready when the agent confirms with the right reference", async () => {
    const { status, body } = await api(`/api/transfers/${transferId}/confirm-funding`, {
      method: "POST",
      body: JSON.stringify({
        agentId: "agent-lagos-001",
        localPaymentReference: reference,
        confirmationNote: "Bank transfer received and matched.",
      }),
    });

    assert.equal(status, 200);
    assert.equal(body.data.status, "wallet_ready");
    assert.equal(body.data.agentId, "agent-lagos-001");
  });

  it("refuses to confirm the same funding twice", async () => {
    const { status } = await api(`/api/transfers/${transferId}/confirm-funding`, {
      method: "POST",
      body: JSON.stringify({
        agentId: "agent-lagos-001",
        localPaymentReference: reference,
      }),
    });

    assert.equal(status, 400);
  });

  it("settles through the corridor and completes", async () => {
    const { status, body } = await api(`/api/transfers/${transferId}/settle`, {
      method: "POST",
      body: JSON.stringify({ markCompleted: true }),
    });

    assert.equal(status, 200);
    assert.equal(body.data.status, "completed");
    assert.ok(body.data.stellarTxHash, "a settlement must record a hash");

    const statuses = body.data.timeline.map((event: Json) => event.status);
    for (const expected of ["settlement_pending", "settled_on_stellar", "payout_ready", "completed"]) {
      assert.ok(statuses.includes(expected), `timeline must record ${expected}`);
    }
  });

  it("exposes a public claim payload without leaking sender internals", async () => {
    const { status, body } = await api(`/api/claim/${transferId}`);

    assert.equal(status, 200);
    assert.equal(body.data.status, "completed");
    assert.equal(body.data.payoutCurrency, "BOB");
    assert.equal(body.data.localPaymentReference, undefined, "claim must not expose the reference");
    assert.equal(body.data.fundingInstruction, undefined, "claim must not expose bank details");
  });

  it("renders the recipient claim page as ready to collect", async () => {
    const { status, html } = await page(`/claim/${transferId}`);

    assert.equal(status, 200);
    assert.ok(html.includes("Lucia Fernandez"));
    assert.ok(html.includes("Your payout is ready"));
  });

  it("returns 404 for an unknown transfer", async () => {
    const { status } = await api("/api/transfers/trf_does_not_exist");
    assert.equal(status, 404);

    const claim = await page("/claim/trf_does_not_exist");
    assert.equal(claim.status, 404);
  });

  after(() => {
    if (transferId) console.log(`e2e transfer: ${transferId}`);
  });
});
