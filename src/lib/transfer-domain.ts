import { AGENTS, FUNDING_METHOD_LABELS } from "@/data/corridor-config";
import { id, transferReference } from "@/lib/ids";
import { quoteCorridorTransfer } from "@/lib/quote";
import { explorerUrlFor } from "@/lib/stellar";
import {
  advanceTransfer,
  assertCanConfirmFunding,
  assertCanSettle,
  timelineEvent,
} from "@/lib/transfer-state";
import type {
  ConfirmFundingInput,
  CreateTransferInput,
  FundingInstruction,
  SettleTransferInput,
  Transfer,
  TransferStatus,
} from "@/types/corridor";

/**
 * Pure corridor domain logic, with no storage dependency.
 *
 * Both the local JSON store and the Supabase store drive these functions, so
 * the two backends cannot drift in how a transfer is built or advanced.
 */

export const CONFIRMABLE_STATUSES: TransferStatus[] = ["created", "awaiting_local_funding"];
export const SETTLEABLE_STATUSES: TransferStatus[] = [
  "local_funding_confirmed",
  "wallet_ready",
  "settlement_pending",
];

export function fundingInstructionFor(
  transferId: string,
  input: CreateTransferInput,
): FundingInstruction {
  const referenceCode = transferReference();
  const expiresAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();

  if (input.fundingMethod === "mobile_money") {
    return {
      id: id("fund"),
      transferId,
      method: "mobile_money",
      displayName: FUNDING_METHOD_LABELS.mobile_money,
      phoneNumber: "+233 24 000 3911",
      referenceCode,
      expiresAt,
    };
  }

  if (input.fundingMethod === "agent") {
    const agent =
      AGENTS.find((item) => item.id === input.agentId) ??
      AGENTS.find((item) => item.country === input.senderCountry && item.available);

    return {
      id: id("fund"),
      transferId,
      method: "agent",
      displayName: FUNDING_METHOD_LABELS.agent,
      agentName: agent?.name ?? "AfriPollar Corridor Desk",
      referenceCode,
      expiresAt,
    };
  }

  return {
    id: id("fund"),
    transferId,
    method: "bank_transfer",
    displayName: FUNDING_METHOD_LABELS.bank_transfer,
    accountName: "AfriPollar Corridor Sandbox",
    accountNumber: "0123456789",
    bankName: "Demo Local Bank",
    referenceCode,
    expiresAt,
  };
}

/** Builds a brand-new transfer, quoted and ready for local funding. */
export function buildTransfer(input: CreateTransferInput): Transfer {
  const now = new Date().toISOString();
  const quote = quoteCorridorTransfer({
    senderCountry: input.senderCountry,
    sourceAmount: input.sourceAmount,
    fundingMethod: input.fundingMethod,
  });
  const transferId = id("trf");
  const fundingInstruction = fundingInstructionFor(transferId, input);

  return {
    id: transferId,
    routeId: quote.routeId,
    senderName: input.senderName,
    senderCountry: input.senderCountry,
    recipientName: input.recipientName,
    recipientCountry: "BO",
    recipientContact: input.recipientContact,
    sourceAmount: quote.sourceAmount,
    sourceCurrency: quote.sourceCurrency,
    settlementAmount: quote.settlementAmount,
    settlementAsset: "USDC",
    payoutAmount: quote.payoutAmount,
    payoutCurrency: "BOB",
    fundingMethod: input.fundingMethod,
    mode: input.mode ?? quote.mode,
    status: "awaiting_local_funding",
    pollarWalletAddress: input.pollarWalletAddress,
    agentId: input.agentId,
    localPaymentReference: fundingInstruction.referenceCode,
    fundingInstruction,
    timeline: [timelineEvent("created", now), timelineEvent("awaiting_local_funding", now)],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Applies an agent's funding confirmation, advancing through
 * `local_funding_confirmed` to `wallet_ready`.
 */
export function applyFundingConfirmation(
  transfer: Transfer,
  input: ConfirmFundingInput,
): Transfer {
  assertCanConfirmFunding(transfer);

  if (transfer.localPaymentReference !== input.localPaymentReference) {
    throw new Error("localPaymentReference does not match this transfer");
  }

  const confirmed = advanceTransfer(
    {
      ...transfer,
      agentId: input.agentId,
      confirmationNote: input.confirmationNote,
    },
    "local_funding_confirmed",
  );

  return advanceTransfer(confirmed, "wallet_ready");
}

/**
 * Applies the Pollar/Stellar settlement leg. A hash starting with `sandbox-`
 * gets no explorer link, so downstream surfaces can label it honestly.
 */
export function applySettlement(transfer: Transfer, input: SettleTransferInput): Transfer {
  assertCanSettle(transfer);

  const txHash = input.stellarTxHash ?? `sandbox-${transfer.id}`;
  const explorerUrl = txHash.startsWith("sandbox-") ? undefined : explorerUrlFor(txHash);

  const withSettlement: Transfer = {
    ...transfer,
    pollarWalletAddress: input.pollarWalletAddress ?? transfer.pollarWalletAddress,
    stellarTxHash: txHash,
    stellarExplorerUrl: explorerUrl,
  };

  const pending = advanceTransfer(withSettlement, "settlement_pending");
  const settled = advanceTransfer(pending, "settled_on_stellar");
  const payoutReady = advanceTransfer(settled, "payout_ready");

  return input.markCompleted ? advanceTransfer(payoutReady, "completed") : payoutReady;
}
