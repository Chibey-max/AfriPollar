import { notFound } from "next/navigation";
import Link from "next/link";
import { AGENTS, COUNTRY_LABELS, FUNDING_METHOD_LABELS } from "@/data/corridor-config";
import { formatBob, formatDateTime, formatLocal, formatUsdc, truncateMiddle } from "@/lib/format";
import { getTransfer } from "@/lib/transfer-store";
import { CorridorDiagram } from "@/components/transfer/CorridorDiagram";
import { FundingInstructions } from "@/components/transfer/FundingInstructions";
import { SettlementPanel } from "@/components/transfer/SettlementPanel";
import { Timeline } from "@/components/transfer/Timeline";
import { ModeBadge, StatusBadge } from "@/components/transfer/badges";
import { ButtonLink, Card, CardHeader, Field } from "@/components/ui/primitives";
import { CopyButton } from "@/components/ui/CopyButton";

export const dynamic = "force-dynamic";

export default async function TransferDetailPage({ params }: PageProps<"/transfer/[id]">) {
  const { id } = await params;
  const transfer = await getTransfer(id);

  if (!transfer) notFound();

  const agent = AGENTS.find((item) => item.id === transfer.agentId);
  const isSandboxSettlement = transfer.stellarTxHash?.startsWith("sandbox-") ?? false;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={transfer.status} />
            <ModeBadge mode={transfer.mode} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {formatLocal(transfer.sourceAmount, transfer.sourceCurrency)} to{" "}
            {transfer.recipientName}
          </h1>
          <p className="num text-xs text-ink-faint">
            {transfer.id} · created {formatDateTime(transfer.createdAt)} UTC
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton value={transfer.id} label="Copy ID" />
          <ButtonLink href={`/claim/${transfer.id}`} variant="secondary">
            Open claim page
          </ButtonLink>
        </div>
      </header>

      <Card>
        <div className="px-5 py-6">
          <CorridorDiagram
            senderCountry={transfer.senderCountry}
            sourceAmount={transfer.sourceAmount}
            sourceCurrency={transfer.sourceCurrency}
            settlementAmount={transfer.settlementAmount}
            payoutAmount={transfer.payoutAmount}
            fundingMethod={transfer.fundingMethod}
          />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div className="space-y-6">
          {transfer.status === "awaiting_local_funding" ? (
            <FundingInstructions instruction={transfer.fundingInstruction} />
          ) : null}

          <SettlementPanel transfer={transfer} />

          <Card>
            <CardHeader title="Receipt" description="Everything this transfer did, on one card." />
            <dl className="divide-y divide-line px-5 py-2">
              <Field label="Transfer ID">
                <span className="num">{truncateMiddle(transfer.id, 10, 6)}</span>
              </Field>
              <Field label="Route">{transfer.routeId}</Field>
              <Field label="From">{COUNTRY_LABELS[transfer.senderCountry]}</Field>
              <Field label="To">{COUNTRY_LABELS[transfer.recipientCountry]}</Field>
              <Field label="Sender">{transfer.senderName || "Not provided"}</Field>
              <Field label="Recipient">{transfer.recipientName}</Field>
              <Field label="Recipient contact">{transfer.recipientContact}</Field>
              <Field label="You sent">
                {formatLocal(transfer.sourceAmount, transfer.sourceCurrency)}
              </Field>
              <Field label="Settled">{formatUsdc(transfer.settlementAmount)}</Field>
              <Field label="Payout">{formatBob(transfer.payoutAmount)}</Field>
              <Field label="Funding rail">{FUNDING_METHOD_LABELS[transfer.fundingMethod]}</Field>
              <Field label="Reference">
                <span className="num">{transfer.localPaymentReference}</span>
              </Field>
              <Field label="Confirmed by">
                {agent ? `${agent.name} · ${agent.city}` : "Not yet confirmed"}
              </Field>
              {transfer.confirmationNote ? (
                <Field label="Agent note">{transfer.confirmationNote}</Field>
              ) : null}
              <Field label="Pollar wallet">
                {transfer.pollarWalletAddress ? (
                  <span className="num">{truncateMiddle(transfer.pollarWalletAddress, 8, 6)}</span>
                ) : (
                  "Not attached"
                )}
              </Field>
              <Field label="Network">Stellar</Field>
              <Field label="Last updated">{formatDateTime(transfer.updatedAt)} UTC</Field>
            </dl>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Corridor timeline"
              description="Each milestone is stamped when the backend recorded it."
            />
            <Timeline timeline={transfer.timeline} status={transfer.status} />
          </Card>

          <Card>
            <CardHeader title="Settlement proof" />
            <div className="space-y-3 px-5 py-5">
              {transfer.stellarTxHash ? (
                <>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-ink-faint">
                      Transaction hash
                    </p>
                    <p className="num mt-1 break-all text-sm text-ink">{transfer.stellarTxHash}</p>
                  </div>
                  {transfer.stellarExplorerUrl ? (
                    <Link
                      href={transfer.stellarExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm font-medium text-accent underline underline-offset-4"
                    >
                      View on Stellar Expert
                    </Link>
                  ) : null}
                  {isSandboxSettlement ? (
                    <p className="rounded-xl bg-warn-soft px-3.5 py-2.5 text-xs leading-relaxed text-warn">
                      Sandbox settlement. This hash is a corridor-local record, not an on-chain
                      Stellar transaction. Paste a real testnet hash when settling to record
                      verifiable proof.
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-ink-soft">
                  No settlement recorded yet. Proof appears here once the Pollar/Stellar leg runs.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
