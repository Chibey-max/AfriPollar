import { fail, ok, parseJson } from "@/lib/api";
import { quoteCorridorTransfer } from "@/lib/quote";
import type { FundingMethod, SourceCountry } from "@/types/corridor";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await parseJson(request)) as Record<string, unknown> | null;

  try {
    if (!body) {
      throw new Error("Request body is required");
    }

    const quote = quoteCorridorTransfer({
      senderCountry: body.senderCountry as SourceCountry,
      sourceAmount: Number(body.sourceAmount),
      fundingMethod: body.fundingMethod as FundingMethod,
    });

    return ok(quote);
  } catch (error) {
    return fail(
      "QUOTE_FAILED",
      error instanceof Error ? error.message : "Unable to create quote",
      400,
    );
  }
}

