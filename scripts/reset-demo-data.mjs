import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Clears the demo transfer store.
 *
 * Resets whichever backend is configured: Supabase when the URL and service
 * role key are present, the local JSON file otherwise.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

if (supabaseUrl && serviceKey) {
  const response = await fetch(`${supabaseUrl}/rest/v1/transfers?id=neq.`, {
    method: "DELETE",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: "return=minimal",
    },
  });

  if (!response.ok) {
    console.error(`Supabase reset failed: ${response.status} ${await response.text()}`);
    process.exit(1);
  }

  console.log(`Reset Supabase transfers table at ${supabaseUrl}`);
} else {
  const dataDir = path.join(process.cwd(), ".data");
  const storePath = path.join(dataDir, "transfers.json");

  await mkdir(dataDir, { recursive: true });
  await writeFile(storePath, `${JSON.stringify({ transfers: [] }, null, 2)}\n`);

  console.log(`Reset local demo transfer store: ${storePath}`);
}
