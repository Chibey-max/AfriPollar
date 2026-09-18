import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyFundingConfirmation,
  applySettlement,
  buildTransfer,
  fundingInstructionFor,
} from "@/lib/transfer-domain";
import type { CreateTransferInput, TransferStatus } from "@/types/corridor";

const baseInput: CreateTransferInput = {
  senderCountry: "NG",
  recipientName: "Lucia Fernandez",
  recipientContact: "lucia@example.com",
  sourceAmount: 150000,
  fundingMethod: "bank_transfer",
};

describe("buildTransfer", () => {
  it("starts awaiting local funding with a two-step timeline", () => {
    const transfer = buildTransfer(baseInput);

    assert.equal(transfer.status, "awaiting_local_funding");
    assert.deepEqual(
      transfer.timeline.map((event) => event.status),
      ["created", "awaiting_local_funding"],
    );
  });

  it("ties the payment reference to the funding instruction", () => {
    const transfer = buildTransfer(baseInput);

    assert.equal(transfer.localPaymentReference, transfer.fundingInstruction.referenceCode);
    assert.ok(transfer.localPaymentReference.startsWith("AFRI-"));
    assert.equal(transfer.fundingInstruction.transferId, transfer.id);
  });

  it("defaults to sandbox mode rather than live", () => {
    assert.equal(buildTransfer(baseInput).mode, "sandbox");
    assert.equal(buildTransfer({ ...baseInput, mode: "live" }).mode, "live");
  });

  it("issues unique ids and references across transfers", () => {
    const a = buildTransfer(baseInput);
    const b = buildTransfer(baseInput);

    assert.notEqual(a.id, b.id);
    assert.notEqual(a.localPaymentReference, b.localPaymentReference);
  });
});

describe("fundingInstructionFor", () => {
  it("gives bank details for a bank transfer", () => {
    const instruction = fundingInstructionFor("trf_1", baseInput);

    assert.equal(instruction.method, "bank_transfer");
    assert.ok(instruction.accountNumber);
    assert.ok(instruction.bankName);
  });

  it("gives a phone number for mobile money", () => {
    const instruction = fundingInstructionFor("trf_1", {
      ...baseInput,
      fundingMethod: "mobile_money",
    });

    assert.equal(instruction.method, "mobile_money");
    assert.ok(instruction.phoneNumber);
    assert.equal(instruction.accountNumber, undefined);
  });

  it("names the requested agent, and falls back to one in the sender's country", () => {
    const requested = fundingInstructionFor("trf_1", {
      ...baseInput,
      fundingMethod: "agent",
      agentId: "agent-nairobi-001",
    });
    assert.equal(requested.agentName, "Amina Cash Desk");

    const fallback = fundingInstructionFor("trf_1", {
      ...baseInput,
      senderCountry: "GH",
      fundingMethod: "agent",
    });
    assert.equal(fallback.agentName, "Kwame Mobile Desk");
  });

  it("expires in the future", () => {
    const instruction = fundingInstructionFor("trf_1", baseInput);
    assert.ok(Date.parse(instruction.expiresAt) > Date.now());
  });
});

describe("applyFundingConfirmation", () => {
  it("advances through confirmed to wallet_ready and records the agent", () => {
    const transfer = buildTransfer(baseInput);
    const confirmed = applyFundingConfirmation(transfer, {
      agentId: "agent-lagos-001",
      localPaymentReference: transfer.localPaymentReference,
      confirmationNote: "Received",
    });

    assert.equal(confirmed.status, "wallet_ready");
    assert.equal(confirmed.agentId, "agent-lagos-001");
    assert.equal(confirmed.confirmationNote, "Received");

    const statuses = confirmed.timeline.map((event) => event.status);
    assert.ok(statuses.includes("local_funding_confirmed"));
    assert.ok(statuses.includes("wallet_ready"));
  });

  it("refuses a mismatched reference", () => {
    const transfer = buildTransfer(baseInput);

    assert.throws(
      () =>
        applyFundingConfirmation(transfer, {
          agentId: "agent-lagos-001",
          localPaymentReference: "AFRI-WRONG-0000",
        }),
      /does not match/,
    );
  });

  it("refuses to confirm twice", () => {
    const transfer = buildTransfer(baseInput);
    const input = {
      agentId: "agent-lagos-001",
      localPaymentReference: transfer.localPaymentReference,
    };
    const confirmed = applyFundingConfirmation(transfer, input);

    assert.throws(() => applyFundingConfirmation(confirmed, input), /Cannot confirm funding/);
  });
});

describe("applySettlement", () => {
  function confirmedTransfer() {
    const transfer = buildTransfer(baseInput);
    return applyFundingConfirmation(transfer, {
      agentId: "agent-lagos-001",
      localPaymentReference: transfer.localPaymentReference,
    });
  }

  it("records a sandbox hash with no explorer link when none is supplied", () => {
    const settled = applySettlement(confirmedTransfer(), { markCompleted: true });

    assert.ok(settled.stellarTxHash?.startsWith("sandbox-"));
    assert.equal(settled.stellarExplorerUrl, undefined, "sandbox must not fake an explorer link");
    assert.equal(settled.status, "completed");
  });

  it("records a real hash with an explorer link", () => {
    const settled = applySettlement(confirmedTransfer(), {
      stellarTxHash: "abc123def456",
      markCompleted: true,
    });

    assert.equal(settled.stellarTxHash, "abc123def456");
    assert.ok(settled.stellarExplorerUrl?.includes("abc123def456"));
    assert.ok(settled.stellarExplorerUrl?.startsWith("https://stellar.expert/"));
  });

  it("stops at payout_ready unless completion is requested", () => {
    const settled = applySettlement(confirmedTransfer(), {});
    assert.equal(settled.status, "payout_ready");
  });

  it("walks the full settlement timeline", () => {
    const settled = applySettlement(confirmedTransfer(), { markCompleted: true });
    const statuses = settled.timeline.map((event) => event.status);

    for (const expected of [
      "settlement_pending",
      "settled_on_stellar",
      "payout_ready",
      "completed",
    ] as TransferStatus[]) {
      assert.ok(statuses.includes(expected), `missing ${expected}`);
    }
  });

  it("refuses to settle an unfunded transfer", () => {
    assert.throws(() => applySettlement(buildTransfer(baseInput), {}), /Cannot settle/);
  });
});
