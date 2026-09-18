"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AGENTS, COUNTRY_LABELS } from "@/data/corridor-config";
import { STATUS_TEXT } from "@/components/transfer/badges";
import { Input, Select } from "@/components/ui/primitives";
import type { TransferStatus } from "@/types/corridor";

const FILTERABLE_STATUSES: TransferStatus[] = [
  "awaiting_local_funding",
  "local_funding_confirmed",
  "wallet_ready",
  "settled_on_stellar",
  "payout_ready",
  "completed",
  "failed",
];

const COUNTRIES = [...new Set(AGENTS.map((agent) => agent.country))];

/** Country / status / reference filters, held in the URL so a view is shareable. */
export function AgentFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [reference, setReference] = useState(params.get("reference") ?? "");

  function apply(next: Record<string, string>) {
    const query = new URLSearchParams(params.toString());

    for (const [key, value] of Object.entries(next)) {
      if (value) query.set(key, value);
      else query.delete(key);
    }

    router.replace(query.size ? `/agent?${query}` : "/agent", { scroll: false });
  }

  // Debounce the reference search so each keystroke is not a navigation.
  useEffect(() => {
    const current = params.get("reference") ?? "";
    if (reference === current) return;

    const timer = setTimeout(() => apply({ reference }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  return (
    <div className="grid gap-3 px-5 py-4 sm:grid-cols-3">
      <Select
        aria-label="Filter by country"
        value={params.get("country") ?? ""}
        onChange={(event) => apply({ country: event.target.value })}
      >
        <option value="">All countries</option>
        {COUNTRIES.map((code) => (
          <option key={code} value={code}>
            {COUNTRY_LABELS[code]}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filter by status"
        value={params.get("status") ?? ""}
        onChange={(event) => apply({ status: event.target.value })}
      >
        <option value="">All statuses</option>
        {FILTERABLE_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_TEXT[status]}
          </option>
        ))}
      </Select>

      <Input
        aria-label="Search by reference code"
        value={reference}
        onChange={(event) => setReference(event.target.value)}
        placeholder="Search reference (AFRI-…)"
        className="num"
      />
    </div>
  );
}
