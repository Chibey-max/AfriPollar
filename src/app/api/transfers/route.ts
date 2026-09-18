import { createTransfer, listTransfers } from "@/lib/transfer-store";
import { fail, ok, parseJson } from "@/lib/api";
import { requireCreateTransferInput } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  return ok(await listTransfers());
}

export async function POST(request: Request) {
  const body = await parseJson(request);

  try {
    const input = requireCreateTransferInput(body);
    const transfer = await createTransfer(input);
    return ok(transfer, { status: 201 });
  } catch (error) {
    return fail(
      "TRANSFER_CREATE_FAILED",
      error instanceof Error ? error.message : "Unable to create transfer",
      400,
    );
  }
}

