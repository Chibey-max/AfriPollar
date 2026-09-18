import { COUNTRY_LABELS } from "@/data/corridor-config";
import type { CorridorMode, CountryCode, TransferStatus } from "@/types/corridor";
import { cx } from "@/components/ui/primitives";

const STATUS_TONE: Record<TransferStatus, string> = {
  created: "bg-surface-muted text-ink-soft",
  awaiting_local_funding: "bg-warn-soft text-warn",
  local_funding_confirmed: "bg-origin-soft text-origin",
  wallet_ready: "bg-origin-soft text-origin",
  settlement_pending: "bg-origin-soft text-origin",
  settled_on_stellar: "bg-destination-soft text-destination",
  payout_ready: "bg-destination-soft text-destination",
  completed: "bg-destination-soft text-destination",
  failed: "bg-danger-soft text-danger",
};

export const STATUS_TEXT: Record<TransferStatus, string> = {
  created: "Created",
  awaiting_local_funding: "Awaiting funding",
  local_funding_confirmed: "Funding confirmed",
  wallet_ready: "Wallet ready",
  settlement_pending: "Settling",
  settled_on_stellar: "Settled on Stellar",
  payout_ready: "Payout ready",
  completed: "Completed",
  failed: "Failed",
};

export function StatusBadge({ status }: { status: TransferStatus }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        STATUS_TONE[status],
      )}
    >
      {STATUS_TEXT[status]}
    </span>
  );
}

export function ModeBadge({ mode }: { mode: CorridorMode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        mode === "live"
          ? "border-destination/30 bg-destination-soft text-destination"
          : "border-line-strong bg-surface-muted text-ink-soft",
      )}
    >
      <span
        aria-hidden
        className={cx(
          "size-1.5 rounded-full",
          mode === "live" ? "bg-destination" : "bg-ink-faint",
        )}
      />
      {mode === "live" ? "Live corridor" : "Sandbox corridor"}
    </span>
  );
}

export function CountryChip({ code, tone }: { code: CountryCode; tone: "origin" | "destination" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium",
        tone === "origin" ? "bg-origin-soft text-origin" : "bg-destination-soft text-destination",
      )}
    >
      {COUNTRY_LABELS[code]}
    </span>
  );
}
