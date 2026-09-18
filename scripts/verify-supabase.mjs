import { readFileSync } from "node:fs";

/**
 * Checks that Supabase is reachable, that the transfers table exists, and that
 * a full corridor round-trip survives the database.
 *
 * Reads .env.local directly so it can run without the Next.js runtime.
 */

function loadEnv() {
  try {
    return Object.fromEntries(
      readFileSync(".env.local", "utf8")
        .split("\n")
        .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
        .map((line) => {
          const i = line.indexOf("=");
          return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
        }),
    );
  } catch {
    return {};
  }
}

const env = { ...loadEnv(), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

const role = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role;
console.log(`project: ${url}`);
console.log(`key role: ${role}${role === "service_role" ? "" : "  <-- expected service_role"}`);

const probe = await fetch(`${url}/rest/v1/transfers?select=id&limit=1`, { headers });

if (probe.status === 404) {
  console.error("\nTable public.transfers does not exist.");
  console.error("Run supabase/migrations/0001_create_transfers.sql in the SQL editor:");
  console.error(`  ${url.replace(".supabase.co", "").replace("https://", "https://supabase.com/dashboard/project/")}/sql/new`);
  process.exit(1);
}

if (!probe.ok) {
  console.error(`\nUnexpected response: ${probe.status} ${await probe.text()}`);
  process.exit(1);
}

console.log("table public.transfers: present");

// Full round-trip through the database.
const id = `trf_verify_${Date.now().toString(36)}`;
const row = {
  id,
  route_id: "ng-bo-sandbox",
  sender_country: "NG",
  recipient_name: "Verification Row",
  recipient_contact: "verify@example.com",
  source_amount: 150000,
  source_currency: "NGN",
  settlement_amount: 97.3,
  payout_amount: 673.32,
  funding_method: "bank_transfer",
  mode: "sandbox",
  status: "awaiting_local_funding",
  local_payment_reference: `AFRI-VERIFY-${id.slice(-4)}`,
  funding_instruction: { id: "fund_verify", transferId: id, method: "bank_transfer", displayName: "Bank transfer", referenceCode: "AFRI-VERIFY", expiresAt: new Date().toISOString() },
  timeline: [{ status: "created", label: "Transfer created", description: "verification", at: new Date().toISOString() }],
};

const insert = await fetch(`${url}/rest/v1/transfers`, {
  method: "POST",
  headers: { ...headers, Prefer: "return=representation" },
  body: JSON.stringify(row),
});

if (!insert.ok) {
  console.error(`insert failed: ${insert.status} ${await insert.text()}`);
  process.exit(1);
}

const [stored] = await insert.json();
console.log(`insert: ok (${stored.id})`);
console.log(`numeric round-trip: settlement=${Number(stored.settlement_amount)} payout=${Number(stored.payout_amount)}`);
console.log(`jsonb round-trip: timeline=${stored.timeline.length} event(s), reference=${stored.funding_instruction.referenceCode}`);

// The conditional-update guard used by confirmFunding.
const guard = async () =>
  fetch(
    `${url}/rest/v1/transfers?id=eq.${id}&status=in.(created,awaiting_local_funding)`,
    {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({ status: "wallet_ready", agent_id: "agent-lagos-001" }),
    },
  ).then(async (r) => (await r.json()).length);

console.log(`guarded update, first:  ${await guard()} row(s) (expect 1)`);
console.log(`guarded update, racing: ${await guard()} row(s) (expect 0)`);

await fetch(`${url}/rest/v1/transfers?id=eq.${id}`, { method: "DELETE", headers });
console.log("cleanup: verification row deleted");
console.log("\nSupabase is ready.");
