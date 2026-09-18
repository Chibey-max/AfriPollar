import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { COUNTRY_LABELS } from "@/data/corridor-config";
import { formatBob, formatDateTime, formatUsdc } from "@/lib/format";
import { getTransfer } from "@/lib/transfer-store";
import { Timeline } from "@/components/transfer/Timeline";
import { StatusBadge } from "@/components/transfer/badges";
import { Card, CardHeader, Field } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Claim your transfer · AfriPollar",
};

const PAYOUT_READY = ["payout_ready", "completed"];

export default async function ClaimPage({ params }: PageProps<"/claim/[id]">) {
  const { id } = await params;
  const transfer = await getTransfer(id);

  if (!transfer) notFound();

  const isReady = PAYOUT_READY.includes(transfer.status);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-destination">
          Incoming transfer · {COUNTRY_LABELS.BO}
        </p>
        <p className="num text-4xl font-semibold tracking-tight text-ink">
          {formatBob(transfer.payoutAmount)}
        </p>
        <p className="text-sm text-ink-soft">
          for {transfer.recipientName} · settled as {formatUsdc(transfer.settlementAmount)}
        </p>
        <div className="flex justify-center">
          <StatusBadge status={transfer.status} />
        </div>
      </header>

      <Card>
        <div
          className={`px-5 py-4 text-sm leading-relaxed ${
            isReady ? "text-destination" : "text-ink-soft"
          }`}
        >
          {isReady ? (
            <p>
              <strong className="font-semibold">Your payout is ready.</strong> Bring the transfer ID
              below and a photo ID to the Bolivia payout desk, or wait for the BOB ramp deposit to
              land on the account you registered.
            </p>
          ) : (
            <p>
              This transfer is still moving through the corridor. This page updates as the sender&apos;s
              local payment is confirmed and settlement runs through Pollar on Stellar.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Transfer summary" />
        <dl className="divide-y divide-line px-5 py-2">
          <Field label="Transfer ID">
            <span className="num">{transfer.id}</span>
          </Field>
          <Field label="Sent from">{COUNTRY_LABELS[transfer.senderCountry]}</Field>
          <Field label="Sender">{transfer.senderName || "AfriPollar sender"}</Field>
          <Field label="Recipient">{transfer.recipientName}</Field>
          <Field label="Contact on file">{transfer.recipientContact}</Field>
          <Field label="Settlement">{formatUsdc(transfer.settlementAmount)}</Field>
          <Field label="Payout">{formatBob(transfer.payoutAmount)}</Field>
          <Field label="Last updated">{formatDateTime(transfer.updatedAt)} UTC</Field>
        </dl>
      </Card>

      <Card>
        <CardHeader title="Corridor status" />
        <Timeline timeline={transfer.timeline} status={transfer.status} />
      </Card>

      <Card>
        <CardHeader title="Proof" />
        <div className="space-y-3 px-5 py-5">
          {transfer.stellarTxHash ? (
            <>
              <p className="num break-all text-sm text-ink">{transfer.stellarTxHash}</p>
              {transfer.stellarExplorerUrl ? (
                <Link
                  href={transfer.stellarExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm font-medium text-accent underline underline-offset-4"
                >
                  View the Stellar transaction
                </Link>
              ) : (
                <p className="text-xs leading-relaxed text-ink-faint">
                  Recorded as a sandbox settlement for this hackathon build, not an on-chain
                  transaction.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-ink-soft">
              Settlement proof appears here once the corridor leg completes.
            </p>
          )}
        </div>
      </Card>

      <p className="text-center text-xs leading-relaxed text-ink-faint">
        Something wrong with this transfer? Contact the sender with transfer ID{" "}
        <span className="num">{transfer.id}</span>, or reach the AfriPollar corridor desk with the
        same reference.
      </p>
    </div>
  );
}
