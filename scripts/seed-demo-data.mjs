/**
 * Seeds a realistic set of corridor transfers for the demo.
 *
 * Drives the public API so every transfer reaches its state through the real
 * lifecycle — no rows are written straight to the database.
 *
 * Usage:
 *   npm run data:seed                       # against localhost:3000
 *   AFRIPOLLAR_API_URL=https://… npm run data:seed
 *
 * Set AGENT_CONSOLE_PASSWORD when the target requires agent auth. Pass
 * --keep to add to the existing transfers instead of clearing them first.
 */

const baseUrl = (process.env.AFRIPOLLAR_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const agentKey = process.env.AGENT_CONSOLE_PASSWORD?.trim() ?? "";
const bypass = process.env.VERCEL_PROTECTION_BYPASS?.trim() ?? "";
const keep = process.argv.includes("--keep");

async function api(path, init) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(agentKey ? { "x-agent-key": agentKey } : {}),
      ...(bypass ? { "x-vercel-protection-bypass": bypass } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `${init?.method ?? "GET"} ${path} -> ${response.status} ${JSON.stringify(body)}`,
    );
  }

  return body.data;
}

/**
 * `stage` is how far along the corridor each transfer should end up, so the
 * demo dashboard shows the whole lifecycle rather than a wall of one status.
 */
const SEEDS = [
  {
    stage: "completed",
    senderName: "Adaeze Okonkwo",
    senderCountry: "NG",
    recipientName: "Lucía Fernández",
    recipientContact: "lucia.fernandez@example.com",
    sourceAmount: 150000,
    fundingMethod: "bank_transfer",
    agentId: "agent-lagos-001",
    note: "GTBank transfer received, reference matched.",
  },
  {
    stage: "completed",
    senderName: "Kofi Mensah",
    senderCountry: "GH",
    recipientName: "Mateo Rojas",
    recipientContact: "+591 700 12345",
    sourceAmount: 2400,
    fundingMethod: "mobile_money",
    agentId: "agent-accra-001",
    note: "MTN MoMo received and matched.",
  },
  {
    stage: "payout_ready",
    senderName: "Wanjiku Kamau",
    senderCountry: "KE",
    recipientName: "Ana Vega",
    recipientContact: "ana.vega@example.com",
    sourceAmount: 26000,
    fundingMethod: "agent",
    agentId: "agent-nairobi-001",
    note: "Cash received at the Nairobi desk.",
  },
  {
    stage: "wallet_ready",
    senderName: "Chidi Nwosu",
    senderCountry: "NG",
    recipientName: "Diego Quispe",
    recipientContact: "+591 700 98765",
    sourceAmount: 420000,
    fundingMethod: "bank_transfer",
    agentId: "agent-lagos-001",
    note: "Zenith Bank transfer confirmed.",
  },
  {
    stage: "awaiting_local_funding",
    senderName: "Amara Eze",
    senderCountry: "NG",
    recipientName: "Valentina Cruz",
    recipientContact: "valentina.cruz@example.com",
    sourceAmount: 75000,
    fundingMethod: "bank_transfer",
  },
  {
    stage: "awaiting_local_funding",
    senderName: "Yaw Boateng",
    senderCountry: "GH",
    recipientName: "Sofía Mamani",
    recipientContact: "+591 700 24680",
    sourceAmount: 900,
    fundingMethod: "mobile_money",
  },
];

const health = await api("/api/health");
console.log(`target:  ${baseUrl}`);
console.log(`storage: ${health.storage} | agent auth: ${health.agentAuth}`);

if (health.agentAuth === "required" && !agentKey) {
  console.error("\nThis target requires agent auth. Set AGENT_CONSOLE_PASSWORD.");
  process.exit(1);
}

if (!keep) {
  const existing = await api("/api/transfers");
  console.log(`clearing ${existing.length} existing transfer(s)…`);

  if (health.storage === "supabase") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!url || !key) {
      console.error("Supabase credentials needed to clear rows. Re-run with --keep to skip.");
      process.exit(1);
    }

    const wipe = await fetch(`${url}/rest/v1/transfers?id=neq.`, {
      method: "DELETE",
      headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "return=minimal" },
    });

    if (!wipe.ok) {
      console.error(`Supabase clear failed: ${wipe.status} ${await wipe.text()}`);
      process.exit(1);
    }
  }
}

console.log("");

for (const seed of SEEDS) {
  const transfer = await api("/api/transfers", {
    method: "POST",
    body: JSON.stringify({
      senderName: seed.senderName,
      senderCountry: seed.senderCountry,
      recipientName: seed.recipientName,
      recipientContact: seed.recipientContact,
      sourceAmount: seed.sourceAmount,
      fundingMethod: seed.fundingMethod,
      agentId: seed.agentId,
    }),
  });

  let state = transfer.status;

  if (seed.stage !== "awaiting_local_funding") {
    const confirmed = await api(`/api/transfers/${transfer.id}/confirm-funding`, {
      method: "POST",
      body: JSON.stringify({
        agentId: seed.agentId,
        localPaymentReference: transfer.localPaymentReference,
        confirmationNote: seed.note,
      }),
    });
    state = confirmed.status;
  }

  if (seed.stage === "payout_ready" || seed.stage === "completed") {
    const settled = await api(`/api/transfers/${transfer.id}/settle`, {
      method: "POST",
      body: JSON.stringify({ markCompleted: seed.stage === "completed" }),
    });
    state = settled.status;
  }

  console.log(
    `  ${state.padEnd(23)} ${seed.senderCountry} → BO  ${String(seed.sourceAmount).padStart(7)} ${
      { NG: "NGN", GH: "GHS", KE: "KES" }[seed.senderCountry]
    }  ${seed.recipientName}`,
  );
}

const all = await api("/api/transfers");
console.log(`\nseeded ${all.length} transfer(s).`);
