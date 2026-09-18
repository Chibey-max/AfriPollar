import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AGENTS, COUNTRY_LABELS, FUNDING_METHOD_LABELS } from "@/data/corridor-config";
import { agentAuthEnabled, currentAgent } from "@/lib/agent-session";
import { formatLocal, formatRelative, formatUsdc } from "@/lib/format";
import { listTransfers } from "@/lib/transfer-store";
import { AgentFilters } from "@/components/agent/AgentFilters";
import { AgentSessionBar } from "@/components/agent/AgentSessionBar";
import { AgentSignIn } from "@/components/agent/AgentSignIn";
import { ConfirmFundingCard } from "@/components/agent/ConfirmFundingCard";
import { StatusBadge } from "@/components/transfer/badges";
import { ButtonLink, Card, CardHeader, EmptyState } from "@/components/ui/primitives";
import type { Transfer } from "@/types/corridor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agent desk · AfriPollar",
};

const PENDING_STATUSES = ["created", "awaiting_local_funding"];

function matchesFilters(transfer: Transfer, filters: Record<string, string | undefined>) {
  if (filters.country && transfer.senderCountry !== filters.country) return false;
  if (filters.status && transfer.status !== filters.status) return false;

  if (filters.reference) {
    const needle = filters.reference.trim().toLowerCase();
    const haystack = `${transfer.localPaymentReference} ${transfer.id} ${transfer.recipientName}`;
    if (!haystack.toLowerCase().includes(needle)) return false;
  }

  return true;
}

export default async function AgentDeskPage({ searchParams }: PageProps<"/agent">) {
  const authRequired = agentAuthEnabled();
  const agent = await currentAgent();

  if (authRequired && !agent) {
    return (
      <div className="space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Agent desk</h1>
          <p className="text-sm text-ink-soft">This desk is access-protected.</p>
        </header>
        <AgentSignIn />
      </div>
    );
  }

  const params = await searchParams;
  const filters = {
    country: typeof params.country === "string" ? params.country : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    reference: typeof params.reference === "string" ? params.reference : undefined,
  };

  const all = await listTransfers();
  const filtered = all.filter((transfer) => matchesFilters(transfer, filters));
  const hasFilters = Boolean(filters.country || filters.status || filters.reference);

  const pending = filtered.filter((transfer) => PENDING_STATUSES.includes(transfer.status));
  const processed = filtered.filter((transfer) => !PENDING_STATUSES.includes(transfer.status));

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Agent desk</h1>
        <p className="max-w-2xl text-sm text-ink-soft">
          Verified local agents match incoming bank, mobile money, and cash payments against the
          sender&apos;s reference code, then release the transfer into Pollar settlement.
        </p>
      </header>

      {agent ? <AgentSessionBar agent={agent} /> : null}

      {!authRequired ? (
        <p className="rounded-xl bg-warn-soft px-3.5 py-2.5 text-xs leading-relaxed text-warn">
          This desk is unprotected. Set <code>AGENT_CONSOLE_PASSWORD</code> to require agent sign-in
          before funding can be confirmed.
        </p>
      ) : null}

      <Card>
        <CardHeader
          title={`Awaiting local funding (${pending.length})`}
          description="Confirm only after the local payment has actually landed."
        />
        <Suspense fallback={<div className="px-5 py-4 text-sm text-ink-faint">Loading filters…</div>}>
          <AgentFilters />
        </Suspense>
        {pending.length === 0 ? (
          <EmptyState
            title={hasFilters ? "No matches" : "Nothing waiting"}
            body={
              hasFilters
                ? "No pending transfers match these filters. Clear them to see the whole queue."
                : "No transfers are currently awaiting a local funding confirmation."
            }
            action={
              hasFilters ? (
                <ButtonLink href="/agent" variant="secondary">
                  Clear filters
                </ButtonLink>
              ) : (
                <ButtonLink href="/transfer/new">Create a transfer</ButtonLink>
              )
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {pending.map((transfer) => (
              <ConfirmFundingCard key={transfer.id} transfer={transfer} signedInAgent={agent} />
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title={`Confirmed and in corridor (${processed.length})`} />
        {processed.length === 0 ? (
          <EmptyState
            title="No confirmed transfers yet"
            body="Transfers you confirm move here as they progress through settlement and payout."
          />
        ) : (
          <ul className="divide-y divide-line">
            {processed.slice(0, 10).map((transfer) => {
              const confirmedBy = AGENTS.find((item) => item.id === transfer.agentId);
              return (
                <li key={transfer.id}>
                  <Link
                    href={`/transfer/${transfer.id}`}
                    className="block px-5 py-4 transition-colors hover:bg-surface-muted"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{transfer.recipientName}</p>
                        <p className="num mt-0.5 text-xs text-ink-faint">
                          {formatLocal(transfer.sourceAmount, transfer.sourceCurrency)} ·{" "}
                          {FUNDING_METHOD_LABELS[transfer.fundingMethod]}
                        </p>
                      </div>
                      <span className="num shrink-0 text-sm font-medium text-ink">
                        {formatUsdc(transfer.settlementAmount)}
                      </span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <StatusBadge status={transfer.status} />
                      <span className="text-xs text-ink-faint">
                        {confirmedBy ? confirmedBy.name : "unassigned"} ·{" "}
                        {formatRelative(transfer.updatedAt)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Verified agents" description="Demo agent network for the hackathon build." />
        <ul className="divide-y divide-line">
          {AGENTS.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-ink">
                  {item.name}
                  {agent?.id === item.id ? (
                    <span className="ml-2 text-xs font-normal text-accent">that&apos;s you</span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {item.city}, {COUNTRY_LABELS[item.country]} · {FUNDING_METHOD_LABELS[item.rail]}
                </p>
              </div>
              <p className="num text-xs text-ink-soft">
                {item.rating.toFixed(1)}★ · {item.available ? "Available" : "Offline"}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
