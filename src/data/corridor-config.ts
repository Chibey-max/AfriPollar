import type {
  Agent,
  CorridorRoute,
  FundingMethod,
  SourceCountry,
  SourceCurrency,
} from "@/types/corridor";

export const COUNTRY_LABELS: Record<SourceCountry | "BO", string> = {
  NG: "Nigeria",
  GH: "Ghana",
  KE: "Kenya",
  BO: "Bolivia",
};

export const SOURCE_CURRENCIES: Record<SourceCountry, SourceCurrency> = {
  NG: "NGN",
  GH: "GHS",
  KE: "KES",
};

export const USDC_RATES: Record<SourceCurrency, number> = {
  NGN: 1520,
  GHS: 12.2,
  KES: 129,
};

export const BOB_PER_USDC = 6.92;

export const FUNDING_METHOD_LABELS: Record<FundingMethod, string> = {
  bank_transfer: "Bank transfer",
  mobile_money: "Mobile money",
  agent: "Verified local agent",
};

export const CORRIDOR_ROUTES: CorridorRoute[] = [
  {
    id: "ng-bo-sandbox",
    fromCountry: "NG",
    toCountry: "BO",
    sourceCurrency: "NGN",
    settlementAsset: "USDC",
    payoutCurrency: "BOB",
    estimatedFeePercent: 1.4,
    estimatedTimeMinutes: 18,
    mode: "sandbox",
  },
  {
    id: "gh-bo-sandbox",
    fromCountry: "GH",
    toCountry: "BO",
    sourceCurrency: "GHS",
    settlementAsset: "USDC",
    payoutCurrency: "BOB",
    estimatedFeePercent: 1.6,
    estimatedTimeMinutes: 22,
    mode: "sandbox",
  },
  {
    id: "ke-bo-sandbox",
    fromCountry: "KE",
    toCountry: "BO",
    sourceCurrency: "KES",
    settlementAsset: "USDC",
    payoutCurrency: "BOB",
    estimatedFeePercent: 1.5,
    estimatedTimeMinutes: 20,
    mode: "sandbox",
  },
];

export const AGENTS: Agent[] = [
  {
    id: "agent-lagos-001",
    name: "Ada Local Rails",
    country: "NG",
    city: "Lagos",
    rail: "bank_transfer",
    rating: 4.9,
    available: true,
  },
  {
    id: "agent-accra-001",
    name: "Kwame Mobile Desk",
    country: "GH",
    city: "Accra",
    rail: "mobile_money",
    rating: 4.8,
    available: true,
  },
  {
    id: "agent-nairobi-001",
    name: "Amina Cash Desk",
    country: "KE",
    city: "Nairobi",
    rail: "agent",
    rating: 4.7,
    available: true,
  },
];

