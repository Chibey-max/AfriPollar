"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useWalletSession } from "@/components/pollar/PollarRoot";
import { Alert, Button, Card, CardHeader, Input, Label } from "@/components/ui/primitives";
import { formatUsdc, truncateMiddle } from "@/lib/format";
import type { Transfer } from "@/types/corridor";

type Phase = "idle" | "signing" | "recording" | "done";

const PHASE_TEXT: Record<Phase, string> = {
  idle: "Settle through Pollar",
  signing: "Submitting Stellar payment…",
  recording: "Recording settlement…",
  done: "Settled",
};

/**
 * Settlement control for the corridor's Pollar/Stellar leg.
 *
 * In live mode this submits a real USDC payment through the Pollar client in
 * the browser and records the returned hash automatically — no hand-pasting.
 * In demo mode it records a clearly-labelled sandbox settlement. The manual
 * hash field stays available as an escape hatch for settling against a payment
 * that was made outside the app.
 */
export function SettlementPanel({ transfer }: { transfer: Transfer }) {
  const router = useRouter();
  const session = useWalletSession();
  const [isPending, startTransition] = useTransition();
  const [phase, setPhase] = useState<Phase>("idle");
  const [manualHash, setManualHash] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSettle = ["local_funding_confirmed", "wallet_ready", "settlement_pending"].includes(
    transfer.status,
  );

  if (!canSettle) return null;

  async function recordSettlement(stellarTxHash?: string) {
    const response = await fetch(`/api/transfers/${transfer.id}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pollarWalletAddress: session.address ?? undefined,
        stellarTxHash,
        markCompleted: true,
      }),
    });

    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message ?? "Settlement could not be recorded.");
  }

  function settle() {
    setError(null);

    startTransition(async () => {
      try {
        let hash = manualHash.trim() || undefined;

        // A pasted hash wins: it means the operator settled out of band.
        if (!hash && session.canSettleOnChain) {
          setPhase("signing");
          const result = await session.settle(transfer.settlementAmount);

          if (result.kind === "error") {
            setError(result.message);
            setPhase("idle");
            return;
          }

          if (result.kind === "onchain") hash = result.hash;
        }

        setPhase("recording");
        await recordSettlement(hash);
        setPhase("done");
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Settlement failed.");
        setPhase("idle");
      }
    });
  }

  const busy = isPending || phase === "signing" || phase === "recording";

  return (
    <Card>
      <CardHeader
        title="Run Pollar settlement"
        description={`The local leg is confirmed. Settle ${formatUsdc(transfer.settlementAmount)} on Stellar.`}
      />
      <div className="space-y-4 px-5 py-5">
        <div className="rounded-xl bg-surface-muted px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-ink-faint">Settling from wallet</p>
          <p className="num mt-1 text-sm text-ink">
            {session.address ? truncateMiddle(session.address, 10, 8) : "No wallet connected"}
          </p>
        </div>

        {session.canSettleOnChain ? (
          <p className="rounded-xl bg-destination-soft px-3.5 py-2.5 text-xs leading-relaxed text-destination">
            Live mode. This submits a real USDC payment on Stellar through Pollar and records the
            transaction hash automatically.
          </p>
        ) : (
          <p className="rounded-xl bg-warn-soft px-3.5 py-2.5 text-xs leading-relaxed text-warn">
            {session.mode === "demo"
              ? "Demo mode. This records a sandbox settlement, labelled as such on the receipt and claim page."
              : "Connect a verified Pollar wallet and configure a corridor treasury address to settle on-chain."}
          </p>
        )}

        {showManual ? (
          <div className="space-y-1.5">
            <Label htmlFor="manualHash">Stellar transaction hash</Label>
            <Input
              id="manualHash"
              value={manualHash}
              onChange={(event) => setManualHash(event.target.value)}
              placeholder="Paste a hash if this leg was settled outside the app"
              className="num"
            />
          </div>
        ) : null}

        {error ? <Alert tone="danger">{error}</Alert> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={settle} disabled={busy} className="flex-1">
            {busy ? PHASE_TEXT[phase] : PHASE_TEXT.idle}
          </Button>
          <button
            type="button"
            onClick={() => setShowManual((open) => !open)}
            className="inline-flex min-h-11 items-center text-xs text-ink-soft underline underline-offset-4 hover:text-ink"
          >
            {showManual ? "Hide manual hash" : "Settled elsewhere?"}
          </button>
        </div>
      </div>
    </Card>
  );
}
