import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { AGENTS } from "@/data/corridor-config";
import type { Agent } from "@/types/corridor";

export const AGENT_COOKIE = "afripollar_agent";

/**
 * Operator protection for the agent desk.
 *
 * When `AGENT_CONSOLE_PASSWORD` is unset the desk stays open, which keeps local
 * development and the hackathon smoke scripts frictionless. Setting it turns on
 * enforcement everywhere: the desk requires sign-in, and funding confirmations
 * must carry either an operator cookie or the shared key header.
 */
export function agentAuthSecret() {
  return process.env.AGENT_CONSOLE_PASSWORD?.trim() || "";
}

export function agentAuthEnabled() {
  return agentAuthSecret().length > 0;
}

function sign(agentId: string) {
  return createHmac("sha256", agentAuthSecret()).update(agentId).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function issueAgentCookie(agentId: string) {
  return `${agentId}.${sign(agentId)}`;
}

/** Verifies a cookie value and resolves it to a known agent. */
export function agentFromCookie(value: string | undefined): Agent | null {
  if (!value) return null;

  const separator = value.lastIndexOf(".");
  if (separator < 0) return null;

  const agentId = value.slice(0, separator);
  const signature = value.slice(separator + 1);

  if (!safeEqual(signature, sign(agentId))) return null;

  return AGENTS.find((agent) => agent.id === agentId) ?? null;
}

/** The signed-in agent for the current request, or null. */
export async function currentAgent(): Promise<Agent | null> {
  if (!agentAuthEnabled()) return null;
  const store = await cookies();
  return agentFromCookie(store.get(AGENT_COOKIE)?.value);
}

export function passwordMatches(candidate: string) {
  const secret = agentAuthSecret();
  return secret.length > 0 && safeEqual(candidate, secret);
}

/**
 * Authorises a funding confirmation.
 *
 * Returns the agent identity the confirmation should be recorded against, so a
 * signed-in operator can never confirm under someone else's name.
 */
export async function authorizeConfirmation(
  request: Request,
  requestedAgentId: string,
): Promise<{ ok: true; agentId: string } | { ok: false; reason: string }> {
  if (!agentAuthEnabled()) {
    return { ok: true, agentId: requestedAgentId };
  }

  const signedIn = await currentAgent();
  if (signedIn) {
    // Identity comes from the session, not the request body.
    return { ok: true, agentId: signedIn.id };
  }

  const headerKey = request.headers.get("x-agent-key");
  if (headerKey && passwordMatches(headerKey)) {
    return { ok: true, agentId: requestedAgentId };
  }

  return { ok: false, reason: "Agent authentication required to confirm local funding." };
}
