import "server-only";

import { supabaseConfigured } from "@/lib/supabase";
import * as json from "@/lib/transfer-store-json";
import * as supabaseStore from "@/lib/transfer-store-supabase";

/**
 * Storage selector.
 *
 * Supabase when it is configured, the local JSON file otherwise. Both drivers
 * share the domain logic in `transfer-domain.ts`, so behaviour does not change
 * with the backend — only durability and concurrency guarantees do.
 */
function driver() {
  return supabaseConfigured() ? supabaseStore : json;
}

export function activeStoreBackend(): "supabase" | "local-json" {
  return supabaseConfigured() ? "supabase" : "local-json";
}

export const listTransfers: typeof json.listTransfers = (...args) => driver().listTransfers(...args);
export const getTransfer: typeof json.getTransfer = (...args) => driver().getTransfer(...args);
export const createTransfer: typeof json.createTransfer = (...args) =>
  driver().createTransfer(...args);
export const confirmFunding: typeof json.confirmFunding = (...args) =>
  driver().confirmFunding(...args);
export const settleTransfer: typeof json.settleTransfer = (...args) =>
  driver().settleTransfer(...args);
export const resetTransfers: typeof json.resetTransfers = (...args) =>
  driver().resetTransfers(...args);
