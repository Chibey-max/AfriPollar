import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  requireConfirmFundingInput,
  requireCreateTransferInput,
  requireSettleTransferInput,
} from "@/lib/validation";

const validCreate = {
  senderCountry: "NG",
  recipientName: "Lucia Fernandez",
  recipientContact: "lucia@example.com",
  sourceAmount: 150000,
  fundingMethod: "bank_transfer",
};

describe("requireCreateTransferInput", () => {
  it("accepts and normalises a valid body", () => {
    const input = requireCreateTransferInput({
      ...validCreate,
      senderName: "Demo Sender",
      recipientName: "  Lucia Fernandez  ",
      recipientContact: "  lucia@example.com  ",
    });

    assert.equal(input.recipientName, "Lucia Fernandez");
    assert.equal(input.recipientContact, "lucia@example.com");
    assert.equal(input.senderCountry, "NG");
    assert.equal(input.mode, "sandbox", "mode must default to sandbox, never live");
  });

  it("only honours an explicit live mode", () => {
    assert.equal(requireCreateTransferInput({ ...validCreate, mode: "live" }).mode, "live");
    assert.equal(requireCreateTransferInput({ ...validCreate, mode: "nonsense" }).mode, "sandbox");
  });

  it("rejects a non-object body", () => {
    for (const body of [null, undefined, "string", 42]) {
      assert.throws(() => requireCreateTransferInput(body), /must be an object/);
    }
  });

  it("rejects unsupported sender countries", () => {
    assert.throws(
      () => requireCreateTransferInput({ ...validCreate, senderCountry: "ZA" }),
      /senderCountry/,
    );
  });

  it("rejects a missing or too-short recipient name", () => {
    for (const recipientName of ["", "L", 42, undefined]) {
      assert.throws(
        () => requireCreateTransferInput({ ...validCreate, recipientName }),
        /recipientName/,
      );
    }
  });

  it("rejects a missing recipient contact", () => {
    assert.throws(
      () => requireCreateTransferInput({ ...validCreate, recipientContact: "ab" }),
      /recipientContact/,
    );
  });

  it("rejects non-positive, non-numeric, and non-finite amounts", () => {
    for (const sourceAmount of [0, -1, "150000", Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.throws(
        () => requireCreateTransferInput({ ...validCreate, sourceAmount }),
        /sourceAmount/,
      );
    }
  });

  it("rejects an unsupported funding method", () => {
    assert.throws(
      () => requireCreateTransferInput({ ...validCreate, fundingMethod: "cheque" }),
      /fundingMethod/,
    );
  });

  it("drops non-string optional fields rather than trusting them", () => {
    const input = requireCreateTransferInput({
      ...validCreate,
      senderName: 42,
      pollarWalletAddress: {},
      agentId: [],
    });

    assert.equal(input.senderName, undefined);
    assert.equal(input.pollarWalletAddress, undefined);
    assert.equal(input.agentId, undefined);
  });
});

describe("requireConfirmFundingInput", () => {
  it("accepts and trims a valid confirmation", () => {
    const input = requireConfirmFundingInput({
      agentId: "  agent-lagos-001  ",
      localPaymentReference: "  AFRI-TEST-0001  ",
      confirmationNote: "  Received  ",
    });

    assert.equal(input.agentId, "agent-lagos-001");
    assert.equal(input.localPaymentReference, "AFRI-TEST-0001");
    assert.equal(input.confirmationNote, "Received");
  });

  it("requires an agent identity", () => {
    assert.throws(
      () => requireConfirmFundingInput({ localPaymentReference: "AFRI-TEST-0001" }),
      /agentId/,
    );
  });

  it("requires the payment reference", () => {
    assert.throws(
      () => requireConfirmFundingInput({ agentId: "agent-lagos-001" }),
      /localPaymentReference/,
    );
  });

  it("leaves the note undefined when absent", () => {
    const input = requireConfirmFundingInput({
      agentId: "agent-lagos-001",
      localPaymentReference: "AFRI-TEST-0001",
    });

    assert.equal(input.confirmationNote, undefined);
  });
});

describe("requireSettleTransferInput", () => {
  it("treats a missing body as an empty sandbox settlement", () => {
    assert.deepEqual(requireSettleTransferInput(null), {});
  });

  it("only marks completed on an explicit true", () => {
    assert.equal(requireSettleTransferInput({ markCompleted: true }).markCompleted, true);
    assert.equal(requireSettleTransferInput({ markCompleted: "true" }).markCompleted, false);
  });

  it("passes a string hash through and ignores other types", () => {
    assert.equal(requireSettleTransferInput({ stellarTxHash: "abc123" }).stellarTxHash, "abc123");
    assert.equal(requireSettleTransferInput({ stellarTxHash: 42 }).stellarTxHash, undefined);
  });
});
