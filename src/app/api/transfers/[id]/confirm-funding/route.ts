import { fail, ok, parseJson } from "@/lib/api";
import { authorizeConfirmation } from "@/lib/agent-session";
import { confirmFunding } from "@/lib/transfer-store";
import { requireConfirmFundingInput } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await parseJson(request);

  try {
    const input = requireConfirmFundingInput(body);
    const auth = await authorizeConfirmation(request, input.agentId);

    if (!auth.ok) {
      return fail("AGENT_AUTH_REQUIRED", auth.reason, 401);
    }

    // The authorised identity wins over whatever the body claimed.
    const transfer = await confirmFunding(id, { ...input, agentId: auth.agentId });
    return ok(transfer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to confirm funding";

    if (message === "Transfer not found") {
      return fail("TRANSFER_NOT_FOUND", message, 404);
    }

    // Another operator won the race on the same transfer.
    if (message.includes("already confirmed")) {
      return fail("FUNDING_ALREADY_CONFIRMED", message, 409);
    }

    return fail("FUNDING_CONFIRMATION_FAILED", message, 400);
  }
}
