import { COUNTRY_LABELS, FUNDING_METHOD_LABELS } from "@/data/corridor-config";
import { formatBob, formatLocal, formatUsdc } from "@/lib/format";
import type { FundingMethod, SourceCountry, SourceCurrency } from "@/types/corridor";

/**
 * The corridor line: origin local rail -> Pollar/Stellar settlement -> Bolivia
 * payout. This is the one visual that has to explain the product without
 * narration, so each leg carries its own amount and asset.
 */
export function CorridorDiagram({
  senderCountry,
  sourceAmount,
  sourceCurrency,
  settlementAmount,
  payoutAmount,
  fundingMethod,
}: {
  senderCountry: SourceCountry;
  sourceAmount: number;
  sourceCurrency: SourceCurrency;
  settlementAmount: number;
  payoutAmount: number;
  fundingMethod: FundingMethod;
}) {
  const legs = [
    {
      key: "origin",
      eyebrow: COUNTRY_LABELS[senderCountry],
      value: formatLocal(sourceAmount, sourceCurrency),
      caption: FUNDING_METHOD_LABELS[fundingMethod],
      dot: "bg-origin",
      text: "text-origin",
    },
    {
      key: "corridor",
      eyebrow: "Pollar · Stellar",
      value: formatUsdc(settlementAmount),
      caption: "USDC settlement",
      dot: "bg-accent",
      text: "text-accent",
    },
    {
      key: "destination",
      eyebrow: COUNTRY_LABELS.BO,
      value: formatBob(payoutAmount),
      caption: "Local payout leg",
      dot: "bg-destination",
      text: "text-destination",
    },
  ];

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute inset-x-6 top-[0.4rem] hidden h-px bg-gradient-to-r from-origin via-accent to-destination opacity-40 sm:block"
      />
      <ol className="relative grid gap-6 sm:grid-cols-3 sm:gap-4">
        {legs.map((leg) => (
          <li key={leg.key} className="flex flex-col gap-2">
            <span aria-hidden className={`size-3 rounded-full ring-4 ring-surface ${leg.dot}`} />
            <span className={`text-xs font-semibold uppercase tracking-wider ${leg.text}`}>
              {leg.eyebrow}
            </span>
            <span className="num text-lg font-semibold tracking-tight text-ink">{leg.value}</span>
            <span className="text-xs text-ink-soft">{leg.caption}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
