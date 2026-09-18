export type CountryCode = "NG" | "GH" | "KE" | "BO";

export type SourceCountry = Exclude<CountryCode, "BO">;

export type SourceCurrency = "NGN" | "GHS" | "KES";

export type FundingMethod = "bank_transfer" | "mobile_money" | "agent";

export type CorridorMode = "sandbox" | "live";

export type TransferStatus =
  | "created"
  | "awaiting_local_funding"
  | "local_funding_confirmed"
  | "wallet_ready"
  | "settlement_pending"
  | "settled_on_stellar"
  | "payout_ready"
  | "completed"
  | "failed";

export type TimelineEvent = {
  status: TransferStatus;
  label: string;
  description: string;
  at: string;
};

export type CorridorRoute = {
  id: string;
  fromCountry: SourceCountry;
  toCountry: "BO";
  sourceCurrency: SourceCurrency;
  settlementAsset: "USDC";
  payoutCurrency: "BOB";
  estimatedFeePercent: number;
  estimatedTimeMinutes: number;
  mode: CorridorMode;
};

export type Agent = {
  id: string;
  name: string;
  country: SourceCountry;
  city: string;
  rail: FundingMethod;
  rating: number;
  available: boolean;
};

export type FundingInstruction = {
  id: string;
  transferId: string;
  method: FundingMethod;
  displayName: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  phoneNumber?: string;
  agentName?: string;
  referenceCode: string;
  expiresAt: string;
};

/**
 * How a quote was arrived at, for display only.
 *
 * Deliberately not stored on `Transfer`: it is derived from the rate table at
 * quote time, so persisting it would add a column that can only go stale.
 */
export type QuoteBreakdown = {
  /** Units of source currency per USDC at quote time. */
  rate: number;
  /** USDC before the corridor fee. */
  grossUsdc: number;
  corridorFeePercent: number;
  percentFee: number;
  minimumFee: number;
  /** True when the floor fee applied instead of the percentage. */
  minimumFeeApplied: boolean;
  bobPerUsdc: number;
  /** Whether the rates came from a live feed or the static demo table. */
  rateSource: "demo-static" | "live-feed";
};

export type Quote = {
  routeId: string;
  senderCountry: SourceCountry;
  recipientCountry: "BO";
  sourceAmount: number;
  sourceCurrency: SourceCurrency;
  settlementAmount: number;
  settlementAsset: "USDC";
  payoutAmount: number;
  payoutCurrency: "BOB";
  estimatedFee: number;
  estimatedTimeMinutes: number;
  fundingMethod: FundingMethod;
  mode: CorridorMode;
  breakdown: QuoteBreakdown;
};

export type Transfer = {
  id: string;
  routeId: string;
  senderName?: string;
  senderCountry: SourceCountry;
  recipientName: string;
  recipientCountry: "BO";
  recipientContact: string;
  sourceAmount: number;
  sourceCurrency: SourceCurrency;
  settlementAmount: number;
  settlementAsset: "USDC";
  payoutAmount: number;
  payoutCurrency: "BOB";
  fundingMethod: FundingMethod;
  mode: CorridorMode;
  status: TransferStatus;
  pollarWalletAddress?: string;
  stellarTxHash?: string;
  stellarExplorerUrl?: string;
  agentId?: string;
  localPaymentReference: string;
  confirmationNote?: string;
  fundingInstruction: FundingInstruction;
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
};

export type CreateTransferInput = {
  senderName?: string;
  senderCountry: SourceCountry;
  recipientName: string;
  recipientContact: string;
  sourceAmount: number;
  fundingMethod: FundingMethod;
  pollarWalletAddress?: string;
  agentId?: string;
  mode?: CorridorMode;
};

export type ConfirmFundingInput = {
  agentId: string;
  localPaymentReference: string;
  confirmationNote?: string;
};

export type SettleTransferInput = {
  pollarWalletAddress?: string;
  stellarTxHash?: string;
  markCompleted?: boolean;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

