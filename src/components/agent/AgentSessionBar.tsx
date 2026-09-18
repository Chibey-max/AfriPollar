"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { COUNTRY_LABELS } from "@/data/corridor-config";
import { Button } from "@/components/ui/primitives";
import type { Agent } from "@/types/corridor";

export function AgentSessionBar({ agent }: { agent: Agent }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      await fetch("/api/agent/session", { method: "DELETE" });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-5 py-3.5">
      <div>
        <p className="text-sm font-medium text-ink">Signed in as {agent.name}</p>
        <p className="mt-0.5 text-xs text-ink-faint">
          {agent.city}, {COUNTRY_LABELS[agent.country]} · confirmations are recorded under{" "}
          <span className="num">{agent.id}</span>
        </p>
      </div>
      <Button variant="secondary" onClick={signOut} disabled={isPending}>
        {isPending ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}
