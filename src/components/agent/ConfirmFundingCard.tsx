"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AGENTS, COUNTRY_LABELS, FUNDING_METHOD_LABELS } from "@/data/corridor-config";
import { formatLocal, formatRelative, formatUsdc } from "@/lib/format";
import {
  Alert,
  Button,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/primitives";
import { StatusBadge } from "@/components/transfer/badges";
import type { Agent, Transfer } from "@/types/corridor";

/**
 * One pending transfer on the agent desk. The agent must type the reference
 * code the sender was given — the backend rejects a mismatch, which is what
 * makes the manual leg auditable rather than a rubber stamp.
 */
export function ConfirmFundingCard({
  transfer,
  signedInAgent,
}: {
  transfer: Transfer;
  signedInAgent: Agent | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [agentId, setAgentId] = useState(
    signedInAgent?.id ??
      transfer.agentId ??
      AGENTS.find((agent) => agent.country === transfer.senderCountry)?.id ??
      AGENTS[0].id,
  );
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function confirm(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/transfers/${transfer.id}/confirm-funding`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId,
            localPaymentReference: reference.trim(),
            confirmationNote: note.trim() || undefined,
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          setError(payload?.error?.message ?? "Could not confirm this funding.");
          return;
        }

        setExpanded(false);
        router.refresh();
      } catch {
        setError("Network error while confirming funding.");
      }
    });
  }

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">
            {formatLocal(transfer.sourceAmount, transfer.sourceCurrency)} →{" "}
            {transfer.recipientName}
          </p>
          <p className="num mt-1 text-xs text-ink-faint">
            {COUNTRY_LABELS[transfer.senderCountry]} ·{" "}
            {FUNDING_METHOD_LABELS[transfer.fundingMethod]} · {formatUsdc(transfer.settlementAmount)}{" "}
            · {formatRelative(transfer.createdAt)}
          </p>
          <p className="num mt-1 text-xs text-ink-soft">
            Expecting reference{" "}
            <span className="font-semibold text-origin">{transfer.localPaymentReference}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={transfer.status} />
          <Button variant="secondary" onClick={() => setExpanded((open) => !open)}>
            {expanded ? "Cancel" : "Confirm funding"}
          </Button>
        </div>
      </div>

      {expanded ? (
        <form onSubmit={confirm} className="mt-4 space-y-4 rounded-xl bg-surface-muted p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`agent-${transfer.id}`}>Confirming agent</Label>
              {signedInAgent ? (
                <p
                  id={`agent-${transfer.id}`}
                  className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink"
                >
                  {signedInAgent.name} · {signedInAgent.city}
                </p>
              ) : (
                <Select
                  id={`agent-${transfer.id}`}
                  value={agentId}
                  onChange={(event) => setAgentId(event.target.value)}
                >
                  {AGENTS.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} · {agent.city}
                    </option>
                  ))}
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`ref-${transfer.id}`}>Payment reference</Label>
              <Input
                id={`ref-${transfer.id}`}
                required
                className="num"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder={transfer.localPaymentReference}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`note-${transfer.id}`}>Confirmation note</Label>
            <Textarea
              id={`note-${transfer.id}`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Bank transfer received and matched against the sender's reference."
            />
          </div>

          {error ? <Alert tone="danger">{error}</Alert> : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Confirming…" : "Mark funding received"}
            </Button>
            <Link
              href={`/transfer/${transfer.id}`}
              className="inline-flex min-h-11 items-center text-sm text-ink-soft underline underline-offset-4 hover:text-ink"
            >
              Open transfer
            </Link>
          </div>
        </form>
      ) : null}
    </li>
  );
}
