"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { PollarProvider, usePollar } from "@pollar/react";
import "@pollar/react/styles.css";
import { DEMO_WALLET_ADDRESS, type PollarMode } from "@/lib/mode";
import { corridorTreasuryAddress, usdcIssuer } from "@/lib/stellar";

/** Outcome of the corridor's USDC settlement leg. */
export type SettlementResult =
  | { kind: "sandbox" }
  | { kind: "onchain"; hash: string }
  | { kind: "error"; message: string };

export type WalletSession = {
  mode: PollarMode;
  address: string | null;
  isAuthenticated: boolean;
  connect: () => void;
  disconnect: () => void;
  /** True when a real on-chain settlement can actually be attempted. */
  canSettleOnChain: boolean;
  /**
   * Sends the corridor's USDC leg. In demo mode this resolves to `sandbox`
   * without touching the network; in live mode it submits a real Stellar
   * payment through Pollar and returns the transaction hash.
   */
  settle: (amount: number) => Promise<SettlementResult>;
};

const DEMO_SESSION: WalletSession = {
  mode: "demo",
  address: DEMO_WALLET_ADDRESS,
  isAuthenticated: true,
  connect: () => {},
  disconnect: () => {},
  canSettleOnChain: false,
  settle: async () => ({ kind: "sandbox" }),
};

const SessionContext = createContext<WalletSession>(DEMO_SESSION);

/**
 * Wraps the app in Pollar when a publishable key is configured, and falls back
 * to a labelled demo session otherwise (PRD §24: the demo must survive a
 * missing key).
 *
 * Both branches publish the same `WalletSession` shape into one context, so no
 * downstream component branches on mode and no hook is called conditionally.
 */
export function PollarRoot({
  apiKey,
  mode,
  children,
}: {
  apiKey: string;
  mode: PollarMode;
  children: ReactNode;
}) {
  if (mode !== "live" || !apiKey) {
    return <SessionContext.Provider value={DEMO_SESSION}>{children}</SessionContext.Provider>;
  }

  return (
    <PollarProvider client={{ apiKey, stellarNetwork: "testnet" }}>
      <LiveSessionBridge>{children}</LiveSessionBridge>
    </PollarProvider>
  );
}

/** Adapts the live Pollar context into the app-wide `WalletSession` shape. */
function LiveSessionBridge({ children }: { children: ReactNode }) {
  const pollar = usePollar();
  const address = pollar.wallet?.address ?? null;
  const { isAuthenticated, verified, openLoginModal, logout, getClient } = pollar;
  const treasury = corridorTreasuryAddress();

  /**
   * The settlement payment has to originate in the browser: the signing session
   * lives in the Pollar client here, not on our server. The route handler's job
   * is to record the resulting hash, not to move the money.
   */
  const settle = useCallback(
    async (amount: number): Promise<SettlementResult> => {
      if (!treasury) {
        return {
          kind: "error",
          message:
            "No corridor treasury address configured. Set NEXT_PUBLIC_CORRIDOR_TREASURY_ADDRESS to settle on-chain.",
        };
      }

      if (!verified) {
        return { kind: "error", message: "Wallet session is not verified yet. Try again shortly." };
      }

      try {
        const outcome = await getClient().sendPayment({
          chain: "STELLAR",
          destination: treasury,
          amount: amount.toFixed(2),
          asset: { type: "credit_alphanum4", code: "USDC", issuer: usdcIssuer() },
        });

        if (outcome.status === "error") {
          return {
            kind: "error",
            message: outcome.message ?? outcome.details ?? "Stellar settlement was rejected.",
          };
        }

        // 'pending' still carries a hash — the corridor records it and the
        // explorer link resolves once the ledger closes.
        return { kind: "onchain", hash: outcome.hash };
      } catch (error) {
        return {
          kind: "error",
          message: error instanceof Error ? error.message : "Stellar settlement failed.",
        };
      }
    },
    [getClient, treasury, verified],
  );

  const session = useMemo<WalletSession>(
    () => ({
      mode: "live",
      address,
      isAuthenticated,
      connect: openLoginModal,
      disconnect: logout,
      canSettleOnChain: isAuthenticated && verified && Boolean(treasury),
      settle,
    }),
    [address, isAuthenticated, verified, treasury, openLoginModal, logout, settle],
  );

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useWalletSession() {
  return useContext(SessionContext);
}
