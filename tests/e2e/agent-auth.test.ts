import assert from "node:assert/strict";
import { before, describe, it } from "node:test";

/**
 * Agent desk access control.
 *
 * Requires a server started with AGENT_CONSOLE_PASSWORD set, and the same value
 * exported here so the test can authenticate. Skips entirely otherwise, because
 * the open desk is a legitimate local-development configuration.
 */
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const PASSWORD = process.env.AGENT_CONSOLE_PASSWORD ?? "";

type Json = { data?: Record<string, string>; error?: { code: string } };

async function api(path: string, init?: RequestInit) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  return { status: response.status, body: (await response.json()) as Json, response };
}

async function newTransfer() {
  const { body } = await api("/api/transfers", {
    method: "POST",
    body: JSON.stringify({
      senderCountry: "NG",
      recipientName: "Lucia Fernandez",
      recipientContact: "lucia@example.com",
      sourceAmount: 150000,
      fundingMethod: "bank_transfer",
    }),
  });

  return { id: body.data!.id, reference: body.data!.localPaymentReference };
}

describe("agent desk access control", { skip: !PASSWORD && "AGENT_CONSOLE_PASSWORD not set" }, () => {
  let cookie = "";

  before(async () => {
    const login = await fetch(`${BASE_URL}/api/agent/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: "agent-nairobi-001", password: PASSWORD }),
    });

    assert.equal(login.status, 200);
    cookie = login.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    assert.ok(cookie.startsWith("afripollar_agent="));
    assert.ok(login.headers.getSetCookie()[0].includes("HttpOnly"), "session cookie must be HttpOnly");
  });

  it("refuses an unauthenticated funding confirmation", async () => {
    const { id, reference } = await newTransfer();
    const { status, body } = await api(`/api/transfers/${id}/confirm-funding`, {
      method: "POST",
      body: JSON.stringify({ agentId: "agent-lagos-001", localPaymentReference: reference }),
    });

    assert.equal(status, 401);
    assert.equal(body.error?.code, "AGENT_AUTH_REQUIRED");
  });

  it("rejects a wrong access code", async () => {
    const { status, body } = await api("/api/agent/session", {
      method: "POST",
      body: JSON.stringify({ agentId: "agent-lagos-001", password: "definitely-wrong" }),
    });

    assert.equal(status, 401);
    assert.equal(body.error?.code, "INVALID_CREDENTIALS");
  });

  it("rejects an unknown agent identity", async () => {
    const { status, body } = await api("/api/agent/session", {
      method: "POST",
      body: JSON.stringify({ agentId: "agent-does-not-exist", password: PASSWORD }),
    });

    assert.equal(status, 400);
    assert.equal(body.error?.code, "UNKNOWN_AGENT");
  });

  it("rejects a forged session cookie", async () => {
    const { id, reference } = await newTransfer();
    const { status, body } = await api(`/api/transfers/${id}/confirm-funding`, {
      method: "POST",
      headers: { cookie: "afripollar_agent=agent-lagos-001.deadbeef" },
      body: JSON.stringify({ agentId: "agent-lagos-001", localPaymentReference: reference }),
    });

    assert.equal(status, 401);
    assert.equal(body.error?.code, "AGENT_AUTH_REQUIRED");
  });

  it("records the confirmation against the session, not the request body", async () => {
    const { id, reference } = await newTransfer();
    const { status, body } = await api(`/api/transfers/${id}/confirm-funding`, {
      method: "POST",
      headers: { cookie },
      body: JSON.stringify({
        // Claiming to be a different agent must not work.
        agentId: "agent-lagos-001",
        localPaymentReference: reference,
      }),
    });

    assert.equal(status, 200);
    assert.equal(body.data?.agentId, "agent-nairobi-001");
  });

  it("allows programmatic confirmation with the shared key header", async () => {
    const { id, reference } = await newTransfer();
    const { status, body } = await api(`/api/transfers/${id}/confirm-funding`, {
      method: "POST",
      headers: { "x-agent-key": PASSWORD },
      body: JSON.stringify({ agentId: "agent-lagos-001", localPaymentReference: reference }),
    });

    assert.equal(status, 200);
    assert.equal(body.data?.status, "wallet_ready");
  });

  it("shows sign-in instead of the queue to an anonymous visitor", async () => {
    const html = await (await fetch(`${BASE_URL}/agent`)).text();

    assert.ok(html.includes("Desk access code"), "sign-in form must be shown");
    assert.ok(!html.includes("Awaiting local funding ("), "queue must not leak");
  });

  it("shows the queue and the signed-in identity to an authenticated agent", async () => {
    const html = await (await fetch(`${BASE_URL}/agent`, { headers: { cookie } })).text();

    assert.ok(html.includes("Awaiting local funding ("));
    assert.ok(html.includes("Amina Cash Desk"));
    assert.ok(html.includes("agent-nairobi-001"));
  });

  it("filters the queue by country and by reference", async () => {
    const { reference } = await newTransfer();

    const ghana = await (await fetch(`${BASE_URL}/agent?country=GH`, { headers: { cookie } })).text();
    assert.ok(!ghana.includes(reference), "a Nigerian transfer must not show under Ghana");

    const byReference = await (
      await fetch(`${BASE_URL}/agent?reference=${reference}`, { headers: { cookie } })
    ).text();
    assert.ok(byReference.includes(reference), "reference search must find its transfer");
  });
});
