import { ok, parseJson } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await parseJson(request);

  return ok({
    received: true,
    source: "pollar",
    note: "Webhook intake is ready. Event-specific handling will be added when Pollar dashboard webhooks are configured.",
    event: body,
  });
}

