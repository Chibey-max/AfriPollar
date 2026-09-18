import "server-only";

import { supabase } from "@/lib/supabase";
import {
  CONFIRMABLE_STATUSES,
  SETTLEABLE_STATUSES,
  applyFundingConfirmation,
  applySettlement,
  buildTransfer,
} from "@/lib/transfer-domain";
import { toRow, toTransfer, type Row } from "@/lib/transfer-row";
import type {
  ConfirmFundingInput,
  CreateTransferInput,
  SettleTransferInput,
  Transfer,
} from "@/types/corridor";

const TABLE = "transfers";

export async function listTransfers(): Promise<Transfer[]> {
  const { data, error } = await supabase()
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not list transfers: ${error.message}`);
  return (data as Row[]).map(toTransfer);
}

export async function getTransfer(id: string): Promise<Transfer | null> {
  const { data, error } = await supabase().from(TABLE).select("*").eq("id", id).maybeSingle();

  if (error) throw new Error(`Could not load transfer: ${error.message}`);
  return data ? toTransfer(data as Row) : null;
}

export async function createTransfer(input: CreateTransferInput): Promise<Transfer> {
  const transfer = buildTransfer(input);
  const { error } = await supabase().from(TABLE).insert(toRow(transfer));

  if (error) throw new Error(`Could not create transfer: ${error.message}`);
  return transfer;
}

export async function confirmFunding(
  transferId: string,
  input: ConfirmFundingInput,
): Promise<Transfer> {
  const current = await getTransfer(transferId);
  if (!current) throw new Error("Transfer not found");

  const next = applyFundingConfirmation(current, input);

  // Guarded on the statuses that were confirmable when we read, so a second
  // operator racing the same confirmation updates nothing and is told so.
  const { data, error } = await supabase()
    .from(TABLE)
    .update(toRow(next))
    .eq("id", transferId)
    .in("status", CONFIRMABLE_STATUSES)
    .select();

  if (error) throw new Error(`Could not confirm funding: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error("This transfer was already confirmed by another agent");
  }

  return toTransfer(data[0] as Row);
}

export async function settleTransfer(
  transferId: string,
  input: SettleTransferInput,
): Promise<Transfer> {
  const current = await getTransfer(transferId);
  if (!current) throw new Error("Transfer not found");

  const next = applySettlement(current, input);

  const { data, error } = await supabase()
    .from(TABLE)
    .update(toRow(next))
    .eq("id", transferId)
    .in("status", SETTLEABLE_STATUSES)
    .select();

  if (error) throw new Error(`Could not settle transfer: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error("This transfer was already settled");
  }

  return toTransfer(data[0] as Row);
}

export async function resetTransfers(): Promise<void> {
  // `neq` on the primary key matches every row; PostgREST requires a filter.
  const { error } = await supabase().from(TABLE).delete().neq("id", "");
  if (error) throw new Error(`Could not reset transfers: ${error.message}`);
}
