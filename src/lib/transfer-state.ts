import type { TimelineEvent, Transfer, TransferStatus } from "@/types/corridor";

const STATUS_LABELS: Record<TransferStatus, string> = {
  created: "Transfer created",
  awaiting_local_funding: "Awaiting local funding",
  local_funding_confirmed: "Local funding confirmed",
  wallet_ready: "Pollar wallet ready",
  settlement_pending: "Settlement pending",
  settled_on_stellar: "Settled on Stellar",
  payout_ready: "Bolivia payout ready",
  completed: "Completed",
  failed: "Failed",
};

const STATUS_DESCRIPTIONS: Record<TransferStatus, string> = {
  created: "A corridor transfer intent was created.",
  awaiting_local_funding: "The sender has local payment instructions.",
  local_funding_confirmed: "A verified agent confirmed the African local rail payment.",
  wallet_ready: "The sender wallet is ready for Pollar/Stellar settlement.",
  settlement_pending: "Settlement is being routed through Pollar and Stellar.",
  settled_on_stellar: "USDC settlement has been recorded for the corridor transfer.",
  payout_ready: "The transfer is ready for the Bolivia payout leg.",
  completed: "The transfer has completed its demo corridor path.",
  failed: "The transfer failed and needs operator review.",
};

export function timelineEvent(status: TransferStatus, at = new Date().toISOString()): TimelineEvent {
  return {
    status,
    label: STATUS_LABELS[status],
    description: STATUS_DESCRIPTIONS[status],
    at,
  };
}

export function advanceTransfer(transfer: Transfer, status: TransferStatus): Transfer {
  return {
    ...transfer,
    status,
    updatedAt: new Date().toISOString(),
    timeline: [...transfer.timeline, timelineEvent(status)],
  };
}

export function assertCanConfirmFunding(transfer: Transfer) {
  if (!["created", "awaiting_local_funding"].includes(transfer.status)) {
    throw new Error(`Cannot confirm funding from status ${transfer.status}`);
  }
}

export function assertCanSettle(transfer: Transfer) {
  if (
    !["local_funding_confirmed", "wallet_ready", "settlement_pending"].includes(transfer.status)
  ) {
    throw new Error(`Cannot settle transfer from status ${transfer.status}`);
  }
}

