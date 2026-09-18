import Link from "next/link";
import { CORRIDOR_ROUTES, COUNTRY_LABELS, FUNDING_METHOD_LABELS } from "@/data/corridor-config";
import { formatDuration, formatLocal, formatRelative, formatUsdc } from "@/lib/format";
import { listTransfers } from "@/lib/transfer-store";
import { ButtonLink, Card, CardHeader, EmptyState } from "@/components/ui/primitives";
import { CountryChip, StatusBadge } from "@/components/transfer/badges";

export const dynamic = "force-dynamic";

export default async function CorridorHomePage() {
  const transfers = await listTransfers();
  const settled = transfers.filter((transfer) =>
    ["settled_on_stellar", "payout_ready", "completed"].includes(transfer.status),
  );
  const awaitingFunding = transfers.filter(
    (transfer) => transfer.status === "awaiting_local_funding",
  );
  const settledUsdc = settled.reduce((total, transfer) => total + transfer.settlementAmount, 0);

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-origin">
          Africa → Bolivia corridor
        </p>
        <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          The African leg of the Pollar corridor, built for how local money
          actually moves.
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-ink-soft">
          A sender funds through a bank transfer, mobile money, or a verified local agent. The agent
          confirms receipt, Pollar settles the value in USDC on Stellar, and the recipient in
          Bolivia gets a claim page with proof.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/transfer/new">Start a transfer</ButtonLink>
          <ButtonLink href="/agent" variant="secondary">
            Open agent desk
          </ButtonLink>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Transfers created" value={String(transfers.length)} />
        <Stat label="Awaiting local funding" value={String(awaitingFunding.length)} />
        <Stat label="Settled through Pollar" value={formatUsdc(settledUsdc)} />
      </section>

      <Card>
        <CardHeader
          title="Recent transfers"
          description="Every corridor transfer created on this deployment."
          action={
            <ButtonLink href="/transfer/new" variant="secondary">
              New transfer
            </ButtonLink>
          }
        />
        {transfers.length === 0 ? (
          <EmptyState
            title="No transfers yet"
            body="Create the first corridor transfer to see the funding, settlement, and payout legs light up."
            action={<ButtonLink href="/transfer/new">Start a transfer</ButtonLink>}
          />
        ) : (
          <ul className="divide-y divide-line">
            {transfers.slice(0, 8).map((transfer) => (
              <li key={transfer.id}>
                <Link
                  href={`/transfer/${transfer.id}`}
                  className="block px-5 py-4 transition-colors hover:bg-surface-muted"
                >
                  {/* Name and amount lead; everything else wraps beneath, so a
                      long recipient name is never squeezed to an ellipsis. */}
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
                    <CountryChip code={transfer.senderCountry} tone="origin" />
                    <span aria-hidden className="text-ink-faint">
                      →
                    </span>
                    <CountryChip code="BO" tone="destination" />
                    <StatusBadge status={transfer.status} />
                    <span className="num text-xs text-ink-faint">
                      {formatRelative(transfer.createdAt)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Supported corridors"
          description="Destination stays fixed to Bolivia so the corridor claim stays honest."
        />
        <ul className="divide-y divide-line">
          {CORRIDOR_ROUTES.map((route) => (
            <li
              key={route.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-ink">
                  {COUNTRY_LABELS[route.fromCountry]} → {COUNTRY_LABELS[route.toCountry]}
                </p>
                <p className="num mt-0.5 text-xs text-ink-faint">
                  {route.sourceCurrency} → {route.settlementAsset} → {route.payoutCurrency}
                </p>
              </div>
              <p className="num text-xs text-ink-soft">
                {route.estimatedFeePercent}% fee · {formatDuration(route.estimatedTimeMinutes)}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="num mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
    </div>
  );
}
