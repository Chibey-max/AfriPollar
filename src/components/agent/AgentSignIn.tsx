"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AGENTS, COUNTRY_LABELS, FUNDING_METHOD_LABELS } from "@/data/corridor-config";
import { Alert, Button, Card, CardHeader, Input, Label, Select } from "@/components/ui/primitives";

export function AgentSignIn() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [agentId, setAgentId] = useState(AGENTS[0].id);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function signIn(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/agent/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId, password }),
        });

        const payload = await response.json();

        if (!response.ok) {
          setError(payload?.error?.message ?? "Sign-in failed.");
          return;
        }

        router.refresh();
      } catch {
        setError("Network error during sign-in.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader
          title="Agent sign-in"
          description="Confirming local funding releases money into the corridor, so it needs an identity."
        />
        <form onSubmit={signIn} className="space-y-4 px-5 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="agentId">Who are you?</Label>
            <Select
              id="agentId"
              value={agentId}
              onChange={(event) => setAgentId(event.target.value)}
            >
              {AGENTS.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} · {agent.city}, {COUNTRY_LABELS[agent.country]} ·{" "}
                  {FUNDING_METHOD_LABELS[agent.rail]}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Desk access code</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error ? <Alert tone="danger">{error}</Alert> : null}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Signing in…" : "Open the desk"}
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-xs leading-relaxed text-ink-faint">
        Confirmations are recorded against the signed-in agent, not against whatever the request
        claims.
      </p>
    </div>
  );
}
