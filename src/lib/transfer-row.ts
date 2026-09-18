import type { FundingInstruction, TimelineEvent, Transfer } from "@/types/corridor";

/**
 * Row mapping between the corridor domain (camel case) and the Postgres table
 * (snake case).
 *
 * Kept free of `server-only` so it can be round-trip tested directly, and so a
 * schema drift shows up as a test failure rather than a runtime error.
 */

/** Database row shape. Snake case here, camel case in the domain. */
export type Row = {
  id: string;
  route_id: string;
  sender_name: string | null;
  sender_country: Transfer["senderCountry"];
  recipient_name: string;
  recipient_country: "BO";
  recipient_contact: string;
  source_amount: number | string;
  source_currency: Transfer["sourceCurrency"];
  settlement_amount: number | string;
  settlement_asset: "USDC";
  payout_amount: number | string;
  payout_currency: "BOB";
  funding_method: Transfer["fundingMethod"];
  mode: Transfer["mode"];
  status: Transfer["status"];
  pollar_wallet_address: string | null;
  stellar_tx_hash: string | null;
  stellar_explorer_url: string | null;
  agent_id: string | null;
  local_payment_reference: string;
  confirmation_note: string | null;
  funding_instruction: FundingInstruction;
  timeline: TimelineEvent[];
  created_at: string;
  updated_at: string;
};

// Postgres numerics arrive as strings through PostgREST when precision could be
// lost, so every money field goes through Number() on the way out.
export function toTransfer(row: Row): Transfer {
  return {
    id: row.id,
    routeId: row.route_id,
    senderName: row.sender_name ?? undefined,
    senderCountry: row.sender_country,
    recipientName: row.recipient_name,
    recipientCountry: row.recipient_country,
    recipientContact: row.recipient_contact,
    sourceAmount: Number(row.source_amount),
    sourceCurrency: row.source_currency,
    settlementAmount: Number(row.settlement_amount),
    settlementAsset: row.settlement_asset,
    payoutAmount: Number(row.payout_amount),
    payoutCurrency: row.payout_currency,
    fundingMethod: row.funding_method,
    mode: row.mode,
    status: row.status,
    pollarWalletAddress: row.pollar_wallet_address ?? undefined,
    stellarTxHash: row.stellar_tx_hash ?? undefined,
    stellarExplorerUrl: row.stellar_explorer_url ?? undefined,
    agentId: row.agent_id ?? undefined,
    localPaymentReference: row.local_payment_reference,
    confirmationNote: row.confirmation_note ?? undefined,
    fundingInstruction: row.funding_instruction,
    timeline: row.timeline ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toRow(transfer: Transfer): Row {
  return {
    id: transfer.id,
    route_id: transfer.routeId,
    sender_name: transfer.senderName ?? null,
    sender_country: transfer.senderCountry,
    recipient_name: transfer.recipientName,
    recipient_country: transfer.recipientCountry,
    recipient_contact: transfer.recipientContact,
    source_amount: transfer.sourceAmount,
    source_currency: transfer.sourceCurrency,
    settlement_amount: transfer.settlementAmount,
    settlement_asset: transfer.settlementAsset,
    payout_amount: transfer.payoutAmount,
    payout_currency: transfer.payoutCurrency,
    funding_method: transfer.fundingMethod,
    mode: transfer.mode,
    status: transfer.status,
    pollar_wallet_address: transfer.pollarWalletAddress ?? null,
    stellar_tx_hash: transfer.stellarTxHash ?? null,
    stellar_explorer_url: transfer.stellarExplorerUrl ?? null,
    agent_id: transfer.agentId ?? null,
    local_payment_reference: transfer.localPaymentReference,
    confirmation_note: transfer.confirmationNote ?? null,
    funding_instruction: transfer.fundingInstruction,
    timeline: transfer.timeline,
    created_at: transfer.createdAt,
    updated_at: transfer.updatedAt,
  };
}

