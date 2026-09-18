import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  advanceTransfer,
  assertCanConfirmFunding,
  assertCanSettle,
  timelineEvent,
} from "@/lib/transfer-state";
import type { Transfer, TransferStatus } from "@/types/corridor";

function transferAt(status: TransferStatus): Transfer {
  const now = new Date().toISOString();
  return {
    id: "trf_test",
    routeId: "ng-bo-sandbox",
    senderCountry: "NG",
    recipientName: "Lucia Fernandez",
    recipientCountry: "BO",
    recipientContact: "lucia@example.com",
    sourceAmount: 150000,
    sourceCurrency: "NGN",
    settlementAmount: 97.3,
    settlementAsset: "USDC",
    payoutAmount: 673.32,
    payoutCurrency: "BOB",
    fundingMethod: "bank_transfer",
    mode: "sandbox",
    status,
    localPaymentReference: "AFRI-TEST-0001",
    fundingInstruction: {
      id: "fund_test",
      transferId: "trf_test",
      method: "bank_transfer",
      displayName: "Bank transfer",
      referenceCode: "AFRI-TEST-0001",
      expiresAt: now,
    },
    timeline: [timelineEvent("created", now)],
    createdAt: now,
    updatedAt: now,
  };
}

describe("timelineEvent", () => {
  it("labels and describes every status", () => {
    const statuses: TransferStatus[] = [
      "created",
      "awaiting_local_funding",
      "local_funding_confirmed",
      "wallet_ready",
      "settlement_pending",
      "settled_on_stellar",
      "payout_ready",
      "completed",
      "failed",
    ];

    for (const status of statuses) {
      const event = timelineEvent(status);
      assert.equal(event.status, status);
      assert.ok(event.label.length > 0, `${status} needs a label`);
      assert.ok(event.description.length > 0, `${status} needs a description`);
      assert.ok(!Number.isNaN(Date.parse(event.at)));
    }
  });
});

describe("advanceTransfer", () => {
  it("appends to the timeline without mutating the original", () => {
    const before = transferAt("awaiting_local_funding");
    const timelineLength = before.timeline.length;
    const after = advanceTransfer(before, "local_funding_confirmed");

    assert.equal(after.status, "local_funding_confirmed");
    assert.equal(after.timeline.length, timelineLength + 1);
    assert.equal(before.timeline.length, timelineLength, "input must not be mutated");
    assert.equal(before.status, "awaiting_local_funding");
  });

  it("stamps updatedAt and preserves earlier history", () => {
    const before = transferAt("awaiting_local_funding");
    const after = advanceTransfer(before, "wallet_ready");

    assert.ok(Date.parse(after.updatedAt) >= Date.parse(before.createdAt));
    assert.equal(after.timeline[0].status, "created");
    assert.equal(after.timeline.at(-1)?.status, "wallet_ready");
  });
});

describe("assertCanConfirmFunding", () => {
  it("allows confirmation only before the corridor leg starts", () => {
    for (const status of ["created", "awaiting_local_funding"] as TransferStatus[]) {
      assert.doesNotThrow(() => assertCanConfirmFunding(transferAt(status)));
    }
  });

  it("refuses to double-confirm an already-confirmed transfer", () => {
    for (const status of [
      "local_funding_confirmed",
      "wallet_ready",
      "settled_on_stellar",
      "completed",
      "failed",
    ] as TransferStatus[]) {
      assert.throws(() => assertCanConfirmFunding(transferAt(status)), /Cannot confirm funding/);
    }
  });
});

describe("assertCanSettle", () => {
  it("allows settlement once local funding is confirmed", () => {
    for (const status of [
      "local_funding_confirmed",
      "wallet_ready",
      "settlement_pending",
    ] as TransferStatus[]) {
      assert.doesNotThrow(() => assertCanSettle(transferAt(status)));
    }
  });

  it("refuses to settle unfunded or already-settled transfers", () => {
    for (const status of [
      "created",
      "awaiting_local_funding",
      "settled_on_stellar",
      "payout_ready",
      "completed",
    ] as TransferStatus[]) {
      assert.throws(() => assertCanSettle(transferAt(status)), /Cannot settle transfer/);
    }
  });
});
