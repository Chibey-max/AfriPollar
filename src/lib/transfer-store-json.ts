import "server-only";

import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { applyFundingConfirmation, applySettlement, buildTransfer } from "@/lib/transfer-domain";
import type {
  ConfirmFundingInput,
  CreateTransferInput,
  SettleTransferInput,
  Transfer,
} from "@/types/corridor";

/**
 * Local JSON persistence for development and the offline demo.
 *
 * This backend is single-instance only: the write queue serialises writes
 * inside one process, and a serverless filesystem would not persist at all.
 * Use Supabase for anything deployed.
 */

type StoreData = {
  transfers: Transfer[];
};

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "transfers.json");
let writeQueue = Promise.resolve();

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(STORE_PATH, "utf8");
  } catch {
    await writeStore({ transfers: [] });
  }
}

async function readStore(): Promise<StoreData> {
  await ensureStore();
  const content = await readFile(STORE_PATH, "utf8");
  return JSON.parse(content) as StoreData;
}

async function writeStore(data: StoreData) {
  await mkdir(DATA_DIR, { recursive: true });
  const tempPath = `${STORE_PATH}.${process.pid}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`);
  await rename(tempPath, STORE_PATH);
}

function mutateStore<T>(mutator: (data: StoreData) => T | Promise<T>): Promise<T> {
  const run = writeQueue.then(async () => {
    const data = await readStore();
    const result = await mutator(data);
    await writeStore(data);
    return result;
  });

  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );

  return run;
}

export async function listTransfers() {
  const data = await readStore();
  return data.transfers.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getTransfer(id: string) {
  const data = await readStore();
  return data.transfers.find((transfer) => transfer.id === id) ?? null;
}

export async function createTransfer(input: CreateTransferInput) {
  return mutateStore((data) => {
    const transfer = buildTransfer(input);
    data.transfers.push(transfer);
    return transfer;
  });
}

export async function confirmFunding(transferId: string, input: ConfirmFundingInput) {
  return mutateStore((data) => {
    const index = data.transfers.findIndex((transfer) => transfer.id === transferId);

    if (index < 0) {
      throw new Error("Transfer not found");
    }

    const next = applyFundingConfirmation(data.transfers[index], input);
    data.transfers[index] = next;
    return next;
  });
}

export async function settleTransfer(transferId: string, input: SettleTransferInput) {
  return mutateStore((data) => {
    const index = data.transfers.findIndex((transfer) => transfer.id === transferId);

    if (index < 0) {
      throw new Error("Transfer not found");
    }

    const next = applySettlement(data.transfers[index], input);
    data.transfers[index] = next;
    return next;
  });
}

export async function resetTransfers() {
  await writeStore({ transfers: [] });
}
