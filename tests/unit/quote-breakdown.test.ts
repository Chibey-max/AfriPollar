import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BOB_PER_USDC, CORRIDOR_ROUTES, USDC_RATES } from "@/data/corridor-config";
import { MINIMUM_FEE_USDC, quoteCorridorTransfer } from "@/lib/quote";

describe("quote breakdown", () => {
  it("reports the rate actually used", () => {
    const quote = quoteCorridorTransfer({
      senderCountry: "GH",
      sourceAmount: 1200,
      fundingMethod: "mobile_money",
    });

    assert.equal(quote.breakdown.rate, USDC_RATES.GHS);
    assert.equal(quote.breakdown.bobPerUsdc, BOB_PER_USDC);
  });

  it("reconciles: gross - fee = settlement", () => {
    const quote = quoteCorridorTransfer({
      senderCountry: "NG",
      sourceAmount: 150000,
      fundingMethod: "bank_transfer",
    });

    const diff = Math.abs(quote.breakdown.grossUsdc - quote.estimatedFee - quote.settlementAmount);
    assert.ok(diff < 0.01, `gross - fee should equal settlement, off by ${diff}`);
  });

  it("flags when the minimum fee applied instead of the percentage", () => {
    const tiny = quoteCorridorTransfer({
      senderCountry: "NG",
      sourceAmount: 1000,
      fundingMethod: "bank_transfer",
    });

    assert.equal(tiny.breakdown.minimumFeeApplied, true);
    assert.equal(tiny.estimatedFee, MINIMUM_FEE_USDC);
    assert.ok(tiny.breakdown.percentFee < MINIMUM_FEE_USDC);
  });

  it("does not flag the minimum on a normal amount", () => {
    const normal = quoteCorridorTransfer({
      senderCountry: "NG",
      sourceAmount: 150000,
      fundingMethod: "bank_transfer",
    });

    assert.equal(normal.breakdown.minimumFeeApplied, false);
    assert.equal(normal.estimatedFee, normal.breakdown.percentFee);
  });

  it("carries the route's fee percentage", () => {
    for (const route of CORRIDOR_ROUTES) {
      const quote = quoteCorridorTransfer({
        senderCountry: route.fromCountry,
        sourceAmount: 500_000,
        fundingMethod: "bank_transfer",
      });

      assert.equal(quote.breakdown.corridorFeePercent, route.estimatedFeePercent);
    }
  });

  it("declares the rates as static demo data, not a live feed", () => {
    const quote = quoteCorridorTransfer({
      senderCountry: "KE",
      sourceAmount: 13000,
      fundingMethod: "agent",
    });

    assert.equal(
      quote.breakdown.rateSource,
      "demo-static",
      "the UI relies on this to label figures as illustrative",
    );
  });
});
