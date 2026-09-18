"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AGENTS,
  COUNTRY_LABELS,
  FUNDING_METHOD_LABELS,
  SOURCE_CURRENCIES,
} from "@/data/corridor-config";
import { formatBob, formatDuration, formatLocal, formatUsdc } from "@/lib/format";
import { useWalletSession } from "@/components/pollar/PollarRoot";
import { CorridorDiagram } from "@/components/transfer/CorridorDiagram";
import {
  Alert,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  Label,
  Select,
} from "@/components/ui/primitives";
import type { FundingMethod, Quote, SourceCountry, Transfer } from "@/types/corridor";

const SOURCE_COUNTRIES: SourceCountry[] = ["NG", "GH", "KE"];
const FUNDING_METHODS: FundingMethod[] = ["bank_transfer", "mobile_money", "agent"];

const DEFAULT_AMOUNTS: Record<SourceCountry, number> = {
  NG: 150000,
  GH: 1200,
  KE: 13000,
};

export function NewTransferForm() {
  const router = useRouter();
  const session = useWalletSession();
  const [isSubmitting, startSubmit] = useTransition();

  const [senderName, setSenderName] = useState("");
  const [senderCountry, setSenderCountry] = useState<SourceCountry>("NG");
  const [recipientName, setRecipientName] = useState("");
  const [recipientContact, setRecipientContact] = useState("");
  const [sourceAmount, setSourceAmount] = useState<number>(DEFAULT_AMOUNTS.NG);
  const [fundingMethod, setFundingMethod] = useState<FundingMethod>("bank_transfer");
  const [agentId, setAgentId] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);

  const agentsForCountry = AGENTS.filter((agent) => agent.country === senderCountry);

  const amountIsValid = Number.isFinite(sourceAmount) && sourceAmount > 0;
  // An invalid amount hides the stale quote by derivation rather than by
  // clearing state in the effect, which would cascade an extra render.
  const activeQuote = amountIsValid ? quote : null;

  // Re-quote through the documented POST /api/quotes endpoint whenever the
  // inputs change, so the preview the sender sees is the backend's own maths.
  useEffect(() => {
    if (!amountIsValid) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senderCountry, sourceAmount, fundingMethod }),
          signal: controller.signal,
        });
        const payload = await response.json();
        if (response.ok) setQuote(payload.data as Quote);
      } catch {
        // Aborted or offline: keep the last good quote rather than flashing.
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [amountIsValid, senderCountry, sourceAmount, fundingMethod]);

  function onCountryChange(next: SourceCountry) {
    setSenderCountry(next);
    setSourceAmount(DEFAULT_AMOUNTS[next]);
    setAgentId("");
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startSubmit(async () => {
      try {
        const response = await fetch("/api/transfers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderName: senderName.trim() || undefined,
            senderCountry,
            recipientName: recipientName.trim(),
            recipientContact: recipientContact.trim(),
            sourceAmount,
            fundingMethod,
            agentId: fundingMethod === "agent" && agentId ? agentId : undefined,
            pollarWalletAddress: session.address ?? undefined,
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          setError(payload?.error?.message ?? "Could not create this transfer.");
          return;
        }

        const transfer = payload.data as Transfer;
        router.push(`/transfer/${transfer.id}`);
      } catch {
        setError("Network error while creating the transfer. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
      <Card>
        <CardHeader
          title="Transfer details"
          description="Where the money starts, who receives it, and which local rail funds it."
        />
        <div className="space-y-5 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="senderName">Your name</Label>
              <Input
                id="senderName"
                value={senderName}
                onChange={(event) => setSenderName(event.target.value)}
                placeholder="Optional"
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senderCountry">Sending from</Label>
              <Select
                id="senderCountry"
                value={senderCountry}
                onChange={(event) => onCountryChange(event.target.value as SourceCountry)}
              >
                {SOURCE_COUNTRIES.map((code) => (
                  <option key={code} value={code}>
                    {COUNTRY_LABELS[code]} ({SOURCE_CURRENCIES[code]})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="recipientName">Recipient name</Label>
              <Input
                id="recipientName"
                required
                minLength={2}
                value={recipientName}
                onChange={(event) => setRecipientName(event.target.value)}
                placeholder="Lucia Fernandez"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recipientContact">Recipient phone or email</Label>
              <Input
                id="recipientContact"
                required
                minLength={3}
                value={recipientContact}
                onChange={(event) => setRecipientContact(event.target.value)}
                placeholder="lucia@example.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sourceAmount">
              Amount to send ({SOURCE_CURRENCIES[senderCountry]})
            </Label>
            <Input
              id="sourceAmount"
              type="number"
              min={1}
              step="any"
              required
              className="num"
              value={Number.isFinite(sourceAmount) ? sourceAmount : ""}
              onChange={(event) => setSourceAmount(event.target.valueAsNumber)}
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium uppercase tracking-wider text-ink-faint">
              Funding rail
            </legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {FUNDING_METHODS.map((method) => (
                <label
                  key={method}
                  className={`cursor-pointer rounded-xl border px-3 py-3 text-sm transition-colors ${
                    fundingMethod === method
                      ? "border-accent bg-destination-soft text-ink"
                      : "border-line bg-surface text-ink-soft hover:bg-surface-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="fundingMethod"
                    value={method}
                    checked={fundingMethod === method}
                    onChange={() => setFundingMethod(method)}
                    className="sr-only"
                  />
                  {FUNDING_METHOD_LABELS[method]}
                </label>
              ))}
            </div>
          </fieldset>

          {fundingMethod === "agent" ? (
            <div className="space-y-1.5">
              <Label htmlFor="agentId">Local agent</Label>
              <Select
                id="agentId"
                value={agentId}
                onChange={(event) => setAgentId(event.target.value)}
              >
                <option value="">Assign automatically</option>
                {agentsForCountry.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} · {agent.city} · {agent.rating.toFixed(1)}★
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          {error ? <Alert tone="danger">{error}</Alert> : null}
        </div>
      </Card>

      <div className="space-y-4 lg:sticky lg:top-24">
        <Card>
          <CardHeader
            title="Route preview"
            description="Quoted by the corridor backend before anything is created."
          />
          <div className="space-y-5 px-5 py-5">
            {activeQuote ? (
              <>
                <CorridorDiagram
                  senderCountry={activeQuote.senderCountry}
                  sourceAmount={activeQuote.sourceAmount}
                  sourceCurrency={activeQuote.sourceCurrency}
                  settlementAmount={activeQuote.settlementAmount}
                  payoutAmount={activeQuote.payoutAmount}
                  fundingMethod={activeQuote.fundingMethod}
                />
                <dl className="divide-y divide-line border-t border-line pt-1">
                  <Field label="You send">
                    {formatLocal(activeQuote.sourceAmount, activeQuote.sourceCurrency)}
                  </Field>
                  <Field
                    label={`Rate (${activeQuote.sourceCurrency} per USDC)`}
                  >
                    {activeQuote.breakdown.rate.toLocaleString("en-US")}
                  </Field>
                  <Field label="Converts to">
                    {formatUsdc(activeQuote.breakdown.grossUsdc)}
                  </Field>
                  <Field
                    label={
                      activeQuote.breakdown.minimumFeeApplied
                        ? `Corridor fee (minimum)`
                        : `Corridor fee (${activeQuote.breakdown.corridorFeePercent}%)`
                    }
                  >
                    −{formatUsdc(activeQuote.estimatedFee)}
                  </Field>
                  <Field label="Settles as">{formatUsdc(activeQuote.settlementAmount)}</Field>
                  <Field label="Payout rate (BOB per USDC)">
                    {activeQuote.breakdown.bobPerUsdc}
                  </Field>
                  <Field label="Recipient gets">{formatBob(activeQuote.payoutAmount)}</Field>
                  <Field label="Estimated time">
                    {formatDuration(activeQuote.estimatedTimeMinutes)}
                  </Field>
                  <Field label="Network">Stellar</Field>
                  <Field label="Wallet">
                    {session.address ? "Connected" : "Not connected"}
                  </Field>
                </dl>
                {activeQuote.breakdown.rateSource === "demo-static" ? (
                  <p className="rounded-xl bg-warn-soft px-3.5 py-2.5 text-xs leading-relaxed text-warn">
                    Demo rates. This build quotes from a fixed rate table, not a live FX feed, so
                    figures are illustrative.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-ink-soft">
                Enter an amount to see the corridor route, fee, and payout estimate.
              </p>
            )}
          </div>
        </Card>

        <Button type="submit" className="w-full" disabled={isSubmitting || !activeQuote}>
          {isSubmitting ? "Creating transfer…" : "Create transfer"}
        </Button>
        <p className="text-xs leading-relaxed text-ink-faint">
          Creating a transfer issues local funding instructions with a reference code. Nothing moves
          until a verified agent confirms the local payment.
        </p>
      </div>
    </form>
  );
}
