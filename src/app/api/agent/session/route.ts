import { cookies } from "next/headers";
import { AGENTS } from "@/data/corridor-config";
import { fail, ok, parseJson } from "@/lib/api";
import { AGENT_COOKIE, agentAuthEnabled, issueAgentCookie, passwordMatches } from "@/lib/agent-session";

export const runtime = "nodejs";

/** Signs an operator in as a specific verified agent. */
export async function POST(request: Request) {
  if (!agentAuthEnabled()) {
    return fail("AGENT_AUTH_DISABLED", "Agent authentication is not configured.", 400);
  }

  const body = (await parseJson(request)) as { agentId?: unknown; password?: unknown } | null;
  const agentId = typeof body?.agentId === "string" ? body.agentId : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!AGENTS.some((agent) => agent.id === agentId)) {
    return fail("UNKNOWN_AGENT", "Select a verified agent identity.", 400);
  }

  if (!passwordMatches(password)) {
    return fail("INVALID_CREDENTIALS", "That access code is not valid.", 401);
  }

  const store = await cookies();
  store.set(AGENT_COOKIE, issueAgentCookie(agentId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return ok({ agentId });
}

/** Signs the current operator out. */
export async function DELETE() {
  const store = await cookies();
  store.delete(AGENT_COOKIE);
  return ok({ signedOut: true });
}
