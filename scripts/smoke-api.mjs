const baseUrl = process.env.AFRIPOLLAR_API_URL ?? "http://localhost:3000";

// When the agent desk is access-protected, the smoke run authenticates with the
// shared key header rather than a browser session.
const agentKey = process.env.AGENT_CONSOLE_PASSWORD?.trim() ?? "";

async function request(path, init) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed: ${JSON.stringify(body)}`);
  }

  return body.data;
}

const health = await request("/api/health");
console.log("health:", health.status);

const agents = await request("/api/agents");
console.log("agents:", agents.length);

const quote = await request("/api/quotes", {
  method: "POST",
  body: JSON.stringify({
    senderCountry: "NG",
    sourceAmount: 150000,
    fundingMethod: "bank_transfer",
  }),
});
console.log("quote:", `${quote.settlementAmount} ${quote.settlementAsset}`);

const transfer = await request("/api/transfers", {
  method: "POST",
  body: JSON.stringify({
    senderName: "Demo Sender",
    senderCountry: "NG",
    recipientName: "Lucia Fernandez",
    recipientContact: "lucia@example.com",
    sourceAmount: 150000,
    fundingMethod: "bank_transfer",
    pollarWalletAddress: "GDEMOAFRIPOLLARWALLETADDRESS",
  }),
});
console.log("created:", transfer.id);

const confirmed = await request(`/api/transfers/${transfer.id}/confirm-funding`, {
  method: "POST",
  headers: agentKey ? { "x-agent-key": agentKey } : {},
  body: JSON.stringify({
    agentId: "agent-lagos-001",
    localPaymentReference: transfer.localPaymentReference,
    confirmationNote: "Smoke-test confirmation",
  }),
});
console.log("confirmed:", confirmed.status);

const settled = await request(`/api/transfers/${transfer.id}/settle`, {
  method: "POST",
  body: JSON.stringify({
    markCompleted: true,
  }),
});
console.log("settled:", settled.status);

const claim = await request(`/api/claim/${transfer.id}`);
console.log("claim:", claim.status);

