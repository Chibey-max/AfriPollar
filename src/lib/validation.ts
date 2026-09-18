import type {
  ConfirmFundingInput,
  CreateTransferInput,
  FundingMethod,
  SettleTransferInput,
  SourceCountry,
} from "@/types/corridor";

const SOURCE_COUNTRIES = new Set<SourceCountry>(["NG", "GH", "KE"]);
const FUNDING_METHODS = new Set<FundingMethod>(["bank_transfer", "mobile_money", "agent"]);

export function requireCreateTransferInput(body: unknown): CreateTransferInput {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be an object");
  }

  const value = body as Record<string, unknown>;
  const senderCountry = value.senderCountry;
  const recipientName = value.recipientName;
  const recipientContact = value.recipientContact;
  const sourceAmount = value.sourceAmount;
  const fundingMethod = value.fundingMethod;

  if (typeof senderCountry !== "string" || !SOURCE_COUNTRIES.has(senderCountry as SourceCountry)) {
    throw new Error("senderCountry must be NG, GH, or KE");
  }

  if (typeof recipientName !== "string" || recipientName.trim().length < 2) {
    throw new Error("recipientName is required");
  }

  if (typeof recipientContact !== "string" || recipientContact.trim().length < 3) {
    throw new Error("recipientContact is required");
  }

  if (typeof sourceAmount !== "number" || !Number.isFinite(sourceAmount) || sourceAmount <= 0) {
    throw new Error("sourceAmount must be a positive number");
  }

  if (typeof fundingMethod !== "string" || !FUNDING_METHODS.has(fundingMethod as FundingMethod)) {
    throw new Error("fundingMethod must be bank_transfer, mobile_money, or agent");
  }

  return {
    senderName: typeof value.senderName === "string" ? value.senderName : undefined,
    senderCountry: senderCountry as SourceCountry,
    recipientName: recipientName.trim(),
    recipientContact: recipientContact.trim(),
    sourceAmount,
    fundingMethod: fundingMethod as FundingMethod,
    pollarWalletAddress:
      typeof value.pollarWalletAddress === "string" ? value.pollarWalletAddress : undefined,
    agentId: typeof value.agentId === "string" ? value.agentId : undefined,
    mode: value.mode === "live" ? "live" : "sandbox",
  };
}

export function requireConfirmFundingInput(body: unknown): ConfirmFundingInput {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be an object");
  }

  const value = body as Record<string, unknown>;

  if (typeof value.agentId !== "string" || value.agentId.trim().length < 3) {
    throw new Error("agentId is required");
  }

  if (
    typeof value.localPaymentReference !== "string" ||
    value.localPaymentReference.trim().length < 3
  ) {
    throw new Error("localPaymentReference is required");
  }

  return {
    agentId: value.agentId.trim(),
    localPaymentReference: value.localPaymentReference.trim(),
    confirmationNote:
      typeof value.confirmationNote === "string" ? value.confirmationNote.trim() : undefined,
  };
}

export function requireSettleTransferInput(body: unknown): SettleTransferInput {
  if (!body || typeof body !== "object") {
    return {};
  }

  const value = body as Record<string, unknown>;

  return {
    pollarWalletAddress:
      typeof value.pollarWalletAddress === "string" ? value.pollarWalletAddress : undefined,
    stellarTxHash: typeof value.stellarTxHash === "string" ? value.stellarTxHash : undefined,
    markCompleted: value.markCompleted === true,
  };
}

