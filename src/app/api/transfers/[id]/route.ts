import { fail, ok } from "@/lib/api";
import { getTransfer } from "@/lib/transfer-store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const transfer = await getTransfer(id);

  if (!transfer) {
    return fail("TRANSFER_NOT_FOUND", "Transfer not found", 404);
  }

  return ok(transfer);
}

