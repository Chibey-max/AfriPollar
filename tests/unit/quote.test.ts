import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BOB_PER_USDC, CORRIDOR_ROUTES, USDC_RATES } from "@/data/corridor-config";
import { quoteCorridorTransfer } from "@/lib/quote";

describe("quoteCorridorTransfer", () => {
  it("converts local currency to USDC at the configured rate", () => {
    const quote = quoteCorridorTransfer({
      senderCountry: "NG",
      sourceAmount: 152000,
      fundingMethod: "bank_transfer",
    });

    const gross = 152000 / USDC_RATES.NGN;
    assert.equal(quote.sourceCurrency, "NGN");
    assert.equal(quote.settlementAsset, "USDC");
    assert.ok(Math.abs(quote.settlementAmount - (gross - quote.estimatedFee)) < 0.01);
  });

  it("derives the payout in BOB from the settled USDC", () => {
    const quote = quoteCorridorTransfer({
      senderCountry: "NG",
      sourceAmount: 150000,
      fundingMethod: "bank_transfer",
    });

    assert.ok(Math.abs(quote.payoutAmount - quote.settlementAmount * BOB_PER_USDC) < 0.01);
    assert.equal(quote.payoutCurrency, "BOB");
  });

  it("charges the route's percentage fee on larger amounts", () => {
    const route = CORRIDOR_ROUTES.find((item) => item.fromCountry === "NG")!;
    const quote = quoteCorridorTransfer({
      senderCountry: "NG",
      sourceAmount: 1_520_000,
      fundingMethod: "bank_transfer",
    });

    const gross = 1_520_000 / USDC_RATES.NGN;
    assert.ok(Math.abs(quote.estimatedFee - gross * (route.estimatedFeePercent / 100)) < 0.01);
  });

  it("applies a floor fee so tiny transfers are not free", () => {
    const quote = quoteCorridorTransfer({
      senderCountry: "NG",
      sourceAmount: 1000,
      fundingMethod: "bank_transfer",
    });

    assert.equal(quote.estimatedFee, 0.75);
  });

  it("never returns a negative settlement amount", () => {
    const quote = quoteCorridorTransfer({
      senderCountry: "NG",
      sourceAmount: 1,
      fundingMethod: "bank_transfer",
    });

    assert.ok(quote.settlementAmount >= 0);
  });

  it("routes each supported country to its own currency and route", () => {
    for (const route of CORRIDOR_ROUTES) {
      const quote = quoteCorridorTransfer({
        senderCountry: route.fromCountry,
        sourceAmount: 10_000,
        fundingMethod: "agent",
      });

      assert.equal(quote.routeId, route.id);
      assert.equal(quote.sourceCurrency, route.sourceCurrency);
      assert.equal(quote.recipientCountry, "BO");
      assert.equal(quote.estimatedTimeMinutes, route.estimatedTimeMinutes);
    }
  });

  it("carries the funding method through to the quote", () => {
    const quote = quoteCorridorTransfer({
      senderCountry: "GH",
      sourceAmount: 1200,
      fundingMethod: "mobile_money",
    });

    assert.equal(quote.fundingMethod, "mobile_money");
  });

  it("rejects non-positive and non-finite amounts", () => {
    for (const amount of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.throws(
        () =>
          quoteCorridorTransfer({
            senderCountry: "NG",
            sourceAmount: amount,
            fundingMethod: "bank_transfer",
          }),
        /positive number/,
      );
    }
  });

  it("rejects an unsupported sender country", () => {
    assert.throws(
      () =>
        quoteCorridorTransfer({
          // @ts-expect-error deliberately outside the supported corridor set
          senderCountry: "ZA",
          sourceAmount: 1000,
          fundingMethod: "bank_transfer",
        }),
      /Unsupported sender country/,
    );
  });

  it("rounds every money field to two decimals", () => {
    const quote = quoteCorridorTransfer({
      senderCountry: "KE",
      sourceAmount: 13_337,
      fundingMethod: "agent",
    });

    for (const value of [
      quote.sourceAmount,
      quote.settlementAmount,
      quote.payoutAmount,
      quote.estimatedFee,
    ]) {
      assert.equal(value, Math.round(value * 100) / 100);
    }
  });
});
