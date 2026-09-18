import {
  BOB_PER_USDC,
  CORRIDOR_ROUTES,
  SOURCE_CURRENCIES,
  USDC_RATES,
} from "@/data/corridor-config";
import type { FundingMethod, Quote, QuoteBreakdown, SourceCountry } from "@/types/corridor";

/**
 * Corridor rates are a static demo table, not a live feed. Surfaced through the
 * quote so the UI can say so rather than implying real FX.
 */
export const RATE_SOURCE: QuoteBreakdown["rateSource"] = "demo-static";

/** Floor fee in USDC, so dust transfers are not effectively free. */
export const MINIMUM_FEE_USDC = 0.75;

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function quoteCorridorTransfer(params: {
  senderCountry: SourceCountry;
  sourceAmount: number;
  fundingMethod: FundingMethod;
}): Quote {
  const route = CORRIDOR_ROUTES.find((item) => item.fromCountry === params.senderCountry);

  if (!route) {
    throw new Error(`Unsupported sender country: ${params.senderCountry}`);
  }

  if (!Number.isFinite(params.sourceAmount) || params.sourceAmount <= 0) {
    throw new Error("sourceAmount must be a positive number");
  }

  const sourceCurrency = SOURCE_CURRENCIES[params.senderCountry];
  const rate = USDC_RATES[sourceCurrency];
  const grossUsdc = params.sourceAmount / rate;
  const percentFee = grossUsdc * (route.estimatedFeePercent / 100);
  const estimatedFee = Math.max(percentFee, MINIMUM_FEE_USDC);

  // Round the settled figure first, then derive the payout from that rounded
  // value: the recipient's BOB must reconcile exactly against the USDC amount
  // printed on the receipt, not against an unrounded intermediate.
  const settlementAmount = roundMoney(Math.max(grossUsdc - estimatedFee, 0));

  return {
    routeId: route.id,
    senderCountry: params.senderCountry,
    recipientCountry: "BO",
    sourceAmount: roundMoney(params.sourceAmount),
    sourceCurrency,
    settlementAmount,
    settlementAsset: "USDC",
    payoutAmount: roundMoney(settlementAmount * BOB_PER_USDC),
    payoutCurrency: "BOB",
    estimatedFee: roundMoney(estimatedFee),
    estimatedTimeMinutes: route.estimatedTimeMinutes,
    fundingMethod: params.fundingMethod,
    mode: route.mode,
    breakdown: {
      rate,
      grossUsdc: roundMoney(grossUsdc),
      corridorFeePercent: route.estimatedFeePercent,
      percentFee: roundMoney(percentFee),
      minimumFee: MINIMUM_FEE_USDC,
      minimumFeeApplied: percentFee < MINIMUM_FEE_USDC,
      bobPerUsdc: BOB_PER_USDC,
      rateSource: RATE_SOURCE,
    },
  };
}

