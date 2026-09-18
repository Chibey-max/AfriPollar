import type { SourceCurrency, TransferStatus } from "@/types/corridor";

export function formatLocal(amount: number, currency: SourceCurrency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatUsdc(amount: number) {
  return `${amount.toFixed(2)} USDC`;
}

export function formatBob(amount: number) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount)} BOB`;
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function formatRelative(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.round(hours / 24)}d ago`;
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `~${hours}h ${rest}m` : `~${hours}h`;
}

/**
 * Ordered corridor milestones used by the timeline. `settlement_pending` and
 * `local_funding_confirmed` are real states but collapse into their successor
 * for display, so the sender sees seven legible steps rather than nine.
 */
export const TIMELINE_STEPS: { status: TransferStatus; label: string; leg: "origin" | "corridor" | "destination" }[] = [
  { status: "created", label: "Transfer created", leg: "origin" },
  { status: "awaiting_local_funding", label: "Awaiting local funding", leg: "origin" },
  { status: "local_funding_confirmed", label: "Agent confirmed funding", leg: "origin" },
  { status: "wallet_ready", label: "Pollar wallet ready", leg: "corridor" },
  { status: "settled_on_stellar", label: "Settled on Stellar", leg: "corridor" },
  { status: "payout_ready", label: "Bolivia payout ready", leg: "destination" },
  { status: "completed", label: "Completed", leg: "destination" },
];

export function truncateMiddle(value: string, lead = 6, tail = 6) {
  if (value.length <= lead + tail + 1) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}
