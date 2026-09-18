import { fail, ok } from "@/lib/api";
import { getTransfer } from "@/lib/transfer-store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const transfer = await getTransfer(id);

  if (!transfer) {
    return fail("CLAIM_NOT_FOUND", "Claim not found", 404);
  }

  return ok({
    id: transfer.id,
    senderCountry: transfer.senderCountry,
    recipientName: transfer.recipientName,
    recipientCountry: transfer.recipientCountry,
    recipientContact: transfer.recipientContact,
    settlementAmount: transfer.settlementAmount,
    settlementAsset: transfer.settlementAsset,
    payoutAmount: transfer.payoutAmount,
    payoutCurrency: transfer.payoutCurrency,
    status: transfer.status,
    timeline: transfer.timeline,
    stellarTxHash: transfer.stellarTxHash,
    stellarExplorerUrl: transfer.stellarExplorerUrl,
  });
}

