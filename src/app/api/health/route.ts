import { ok } from "@/lib/api";
import { agentAuthEnabled } from "@/lib/agent-session";
import { activeStoreBackend } from "@/lib/transfer-store";

export const runtime = "nodejs";

export function GET() {
  return ok({
    service: "afripollar-agent-corridor",
    status: "ok",
    mode: process.env.NEXT_PUBLIC_DEMO_MODE === "false" ? "live" : "sandbox",
    storage: activeStoreBackend(),
    agentAuth: agentAuthEnabled() ? "required" : "open",
    time: new Date().toISOString(),
  });
}
