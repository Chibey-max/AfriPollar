/**
 * Pollar integration mode. The hackathon PRD (§24) requires the app to stay
 * demoable when no publishable key is available, so every Pollar-dependent
 * surface degrades to an honestly-labelled demo wallet instead of breaking.
 */
export type PollarMode = "live" | "demo";

export function pollarApiKey() {
  return process.env.NEXT_PUBLIC_POLLAR_API_KEY?.trim() || "";
}

export function pollarMode(): PollarMode {
  const forcedDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  return !forcedDemo && pollarApiKey().length > 0 ? "live" : "demo";
}

/** Deterministic placeholder wallet used only while in demo mode. */
export const DEMO_WALLET_ADDRESS = "GDEMOAFRIPOLLARCORRIDORSANDBOXWALLET7X4QZ2K";
