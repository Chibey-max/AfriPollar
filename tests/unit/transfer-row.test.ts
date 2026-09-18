import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { toRow, toTransfer, type Row } from "@/lib/transfer-row";
import { applyFundingConfirmation, applySettlement, buildTransfer } from "@/lib/transfer-domain";
import type { CreateTransferInput } from "@/types/corridor";

const input: CreateTransferInput = {
  senderName: "Demo Sender",
  senderCountry: "NG",
  recipientName: "Lucia Fernandez",
  recipientContact: "lucia@example.com",
  sourceAmount: 150000,
  fundingMethod: "bank_transfer",
};

/**
 * Strips keys whose value is `undefined`.
 *
 * `buildTransfer` omits unset optional keys entirely, while the round-trip sets
 * them to `undefined`. Both serialise identically and behave identically on
 * property access, so equality is compared on the serialisable shape.
 */
function normalise<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function settledTransfer() {
  const created = buildTransfer(input);
  const confirmed = applyFundingConfirmation(created, {
    agentId: "agent-lagos-001",
    localPaymentReference: created.localPaymentReference,
    confirmationNote: "Received",
  });
  return applySettlement(confirmed, { stellarTxHash: "abc123", markCompleted: true });
}

describe("transfer row mapping", () => {
  it("round-trips a transfer without losing anything", () => {
    const transfer = settledTransfer();
    assert.deepEqual(normalise(toTransfer(toRow(transfer))), normalise(transfer));
  });

  it("round-trips a freshly created transfer with its optional fields unset", () => {
    const transfer = buildTransfer({ ...input, senderName: undefined });
    const back = toTransfer(toRow(transfer));

    assert.deepEqual(normalise(back), normalise(transfer));
    assert.equal(back.senderName, undefined);
    assert.equal(back.agentId, undefined);
    assert.equal(back.stellarTxHash, undefined);
  });

  it("maps absent optional values to NULL rather than undefined", () => {
    const row = toRow(buildTransfer({ ...input, senderName: undefined }));

    assert.equal(row.sender_name, null);
    assert.equal(row.agent_id, null);
    assert.equal(row.stellar_tx_hash, null);
    assert.equal(row.confirmation_note, null);
  });

  it("reads numeric columns back as numbers when Postgres returns strings", () => {
    const transfer = settledTransfer();
    const row = toRow(transfer);

    // PostgREST can serialise `numeric` as a string to protect precision.
    const asStrings: Row = {
      ...row,
      source_amount: String(row.source_amount),
      settlement_amount: String(row.settlement_amount),
      payout_amount: String(row.payout_amount),
    };

    const back = toTransfer(asStrings);
    assert.equal(back.sourceAmount, transfer.sourceAmount);
    assert.equal(back.settlementAmount, transfer.settlementAmount);
    assert.equal(back.payoutAmount, transfer.payoutAmount);
  });

  it("defaults a missing timeline to an empty array", () => {
    const row = { ...toRow(buildTransfer(input)), timeline: null as never };
    assert.deepEqual(toTransfer(row).timeline, []);
  });

  it("covers every column the migration declares", () => {
    const migration = readFileSync(
      path.join(process.cwd(), "supabase/migrations/0001_create_transfers.sql"),
      "utf8",
    );

    // Column names are the first token on each line inside the create table body.
    const declared = [
      ...migration
        .slice(migration.indexOf("create table"), migration.indexOf("-- The agent desk"))
        .matchAll(/^\s{2}([a-z_]+)\s+(text|numeric|jsonb|timestamptz)/gm),
    ].map((match) => match[1]);

    const mapped = Object.keys(toRow(settledTransfer()));

    assert.ok(declared.length > 20, "migration parse should find the column list");
    assert.deepEqual(
      declared.filter((column) => !mapped.includes(column)),
      [],
      "every column in the migration must be written by toRow",
    );
    assert.deepEqual(
      mapped.filter((column) => !declared.includes(column)),
      [],
      "toRow must not write a column the migration does not declare",
    );
  });
});
