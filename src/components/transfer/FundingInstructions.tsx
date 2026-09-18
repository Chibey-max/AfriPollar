import { formatDateTime } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/primitives";
import { CopyButton } from "@/components/ui/CopyButton";
import type { FundingInstruction } from "@/types/corridor";

export function FundingInstructions({ instruction }: { instruction: FundingInstruction }) {
  const rows: { label: string; value: string }[] = [];

  if (instruction.bankName) rows.push({ label: "Bank", value: instruction.bankName });
  if (instruction.accountName) rows.push({ label: "Account name", value: instruction.accountName });
  if (instruction.accountNumber)
    rows.push({ label: "Account number", value: instruction.accountNumber });
  if (instruction.phoneNumber) rows.push({ label: "Mobile money number", value: instruction.phoneNumber });
  if (instruction.agentName) rows.push({ label: "Agent", value: instruction.agentName });

  return (
    <Card>
      <CardHeader
        title="Pay locally to fund this transfer"
        description={`${instruction.displayName} · expires ${formatDateTime(instruction.expiresAt)} UTC`}
      />
      <div className="space-y-4 px-5 py-5">
        <div className="rounded-xl border border-dashed border-origin/40 bg-origin-soft px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-origin">
                Payment reference
              </p>
              <p className="num mt-1 truncate text-base font-semibold text-ink">
                {instruction.referenceCode}
              </p>
            </div>
            <CopyButton value={instruction.referenceCode} className="shrink-0 bg-surface" />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-origin">
            The agent matches your local payment using this reference. Include it exactly.
          </p>
        </div>

        {rows.length > 0 ? (
          <dl className="divide-y divide-line">
            {rows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="text-sm text-ink-soft">{row.label}</dt>
                <dd className="num text-right text-sm font-medium text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <p className="text-xs leading-relaxed text-ink-faint">
          Sandbox rail. These are demo payment details for the hackathon build — no real local
          account is debited.
        </p>
      </div>
    </Card>
  );
}
