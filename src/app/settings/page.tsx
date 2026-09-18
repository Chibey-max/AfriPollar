import type { Metadata } from "next";
import { BOB_PER_USDC, CORRIDOR_ROUTES, USDC_RATES } from "@/data/corridor-config";
import { pollarMode } from "@/lib/mode";
import { WalletPanel } from "@/components/pollar/WalletBadge";
import { ModeBadge } from "@/components/transfer/badges";
import { Card, CardHeader, Field } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Settings · AfriPollar",
};

export default function SettingsPage() {
  const mode = pollarMode();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="max-w-2xl text-sm text-ink-soft">
          What is live, what is sandbox, and which rates this deployment quotes with.
        </p>
      </header>

      <Card>
        <CardHeader
          title="Pollar wallet"
          description="Wallet onboarding, session, and Stellar address."
          action={<ModeBadge mode={mode === "live" ? "live" : "sandbox"} />}
        />
        <WalletPanel />
      </Card>

      <Card>
        <CardHeader
          title="Live vs sandbox"
          description="Stated plainly so nothing in the demo is mistaken for production."
        />
        <dl className="divide-y divide-line px-5 py-2">
          <Field label="Pollar wallet onboarding">
            {mode === "live" ? "Live Pollar SDK" : "Demo wallet (no API key)"}
          </Field>
          <Field label="Stellar settlement">
            {mode === "live" ? "Live-capable · records real tx hash" : "Sandbox record"}
          </Field>
          <Field label="African local rails">Sandbox instructions</Field>
          <Field label="Agent confirmation">Manual, by verified agent</Field>
          <Field label="Bolivia BOB payout">Prepared path · Pollar-operated</Field>
          <Field label="Persistence">Local JSON store</Field>
        </dl>
      </Card>

      <Card>
        <CardHeader
          title="Corridor rates"
          description="Static demo rates. A production build sources these from a live FX feed."
        />
        <dl className="divide-y divide-line px-5 py-2">
          {Object.entries(USDC_RATES).map(([currency, rate]) => (
            <Field key={currency} label={`${currency} per USDC`}>
              {rate.toLocaleString("en-US")}
            </Field>
          ))}
          <Field label="BOB per USDC">{BOB_PER_USDC}</Field>
          {CORRIDOR_ROUTES.map((route) => (
            <Field key={route.id} label={`${route.id} fee`}>
              {route.estimatedFeePercent}%
            </Field>
          ))}
        </dl>
      </Card>
    </div>
  );
}
