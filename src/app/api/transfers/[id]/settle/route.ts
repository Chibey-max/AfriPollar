import { fail, ok, parseJson } from "@/lib/api";
import { settleTransfer } from "@/lib/transfer-store";
import { requireSettleTransferInput } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await parseJson(request);

  try {
    const input = requireSettleTransferInput(body);
    const transfer = await settleTransfer(id, input);
    return ok(transfer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to settle transfer";

    if (message === "Transfer not found") {
      return fail("TRANSFER_NOT_FOUND", message, 404);
    }

    // Another operator won the race on the same transfer.
    if (message.includes("already settled")) {
      return fail("ALREADY_SETTLED", message, 409);
    }

    return fail("SETTLEMENT_FAILED", message, 400);
  }
}

