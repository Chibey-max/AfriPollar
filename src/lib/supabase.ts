import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase is optional. With both variables set the corridor persists there;
 * otherwise it falls back to the local JSON store, which keeps `npm run dev`
 * working with no external dependency.
 */
export function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
}

export function supabaseServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
}

export function supabaseConfigured() {
  return supabaseUrl().length > 0 && supabaseServiceKey().length > 0;
}

let client: SupabaseClient | null = null;

/**
 * Service-role client. Every caller is a route handler or server component, so
 * this bypasses RLS deliberately — the table has no permissive policy.
 */
export function supabase(): SupabaseClient {
  if (!supabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  client ??= createClient(supabaseUrl(), supabaseServiceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
