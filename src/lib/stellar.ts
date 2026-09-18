/**
 * Stellar asset configuration for the corridor settlement leg.
 *
 * The issuer defaults to Circle's USDC issuer on the Stellar test network. A
 * different network (or a custom test asset) can be pointed at through env
 * without touching the settlement code.
 */
export const USDC_TESTNET_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export function usdcIssuer() {
  return process.env.NEXT_PUBLIC_USDC_ISSUER?.trim() || USDC_TESTNET_ISSUER;
}

/**
 * Where the corridor's USDC settles on the African leg. In production this is
 * the corridor treasury that funds the Bolivian payout; for the hackathon it is
 * configured per-deployment so a judge can point it at their own testnet
 * account and watch a real transaction land.
 */
export function corridorTreasuryAddress() {
  return process.env.NEXT_PUBLIC_CORRIDOR_TREASURY_ADDRESS?.trim() || "";
}

export function stellarNetwork(): "testnet" | "public" {
  return process.env.NEXT_PUBLIC_STELLAR_NETWORK === "public" ? "public" : "testnet";
}

export function explorerUrlFor(hash: string) {
  return `https://stellar.expert/explorer/${stellarNetwork()}/tx/${hash}`;
}

export const USDC_ASSET = {
  type: "credit_alphanum4" as const,
  code: "USDC",
  get issuer() {
    return usdcIssuer();
  },
};
