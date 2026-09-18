"use client";

import { WalletButton } from "@pollar/react";
import { useWalletSession } from "@/components/pollar/PollarRoot";
import { truncateMiddle } from "@/lib/format";
import { Button } from "@/components/ui/primitives";

/**
 * Header wallet control. In live mode this is Pollar's own `WalletButton`, so
 * the integration uses the sponsor's prebuilt UX (PRD §16) rather than a
 * reimplementation. In demo mode it shows the sandbox wallet, clearly marked.
 */
export function WalletBadge() {
  const session = useWalletSession();

  if (session.mode === "live") {
    return <WalletButton />;
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-surface-muted px-3 py-2 text-xs font-medium text-ink-soft">
      <span aria-hidden className="size-1.5 rounded-full bg-ink-faint" />
      <span className="num">{truncateMiddle(session.address ?? "", 6, 4)}</span>
      <span className="text-ink-faint">demo wallet</span>
    </span>
  );
}

/** Larger wallet surface used on the settings page. */
export function WalletPanel() {
  const session = useWalletSession();

  return (
    <div className="space-y-4 px-5 py-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-ink-faint">Wallet address</p>
        <p className="num mt-1 break-all text-sm text-ink">
          {session.address ?? "Not connected"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {session.mode === "live" ? (
          <>
            <WalletButton />
            {session.isAuthenticated ? (
              <Button variant="secondary" onClick={session.disconnect}>
                Disconnect
              </Button>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-ink-soft">
            Running on the built-in sandbox wallet. Set{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">
              NEXT_PUBLIC_POLLAR_API_KEY
            </code>{" "}
            and{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">
              NEXT_PUBLIC_DEMO_MODE=false
            </code>{" "}
            to switch this surface to live Pollar onboarding.
          </p>
        )}
      </div>
    </div>
  );
}
