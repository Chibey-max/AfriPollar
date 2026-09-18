"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui/primitives";

/**
 * Page-level error boundary.
 *
 * The most likely cause in this app is the transfer store being unreachable —
 * Supabase not migrated, credentials wrong, or a transient outage. A live demo
 * should say so plainly instead of showing an unstyled 500.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Corridor page error:", error);
  }, [error]);

  const looksLikeStorage =
    /transfers|supabase|schema cache|PGRST|fetch failed|Could not (list|load|create)/i.test(
      error.message,
    );

  return (
    <div className="mx-auto max-w-lg py-10">
      <Card>
        <div className="space-y-4 px-5 py-6">
          <h1 className="text-lg font-semibold tracking-tight text-ink">
            {looksLikeStorage ? "The corridor store is unreachable" : "Something went wrong"}
          </h1>

          <p className="text-sm leading-relaxed text-ink-soft">
            {looksLikeStorage ? (
              <>
                Transfers could not be read. If this deployment uses Supabase, check that the
                migration in <code>supabase/migrations</code> has been applied and that{" "}
                <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> are
                correct.
              </>
            ) : (
              "An unexpected error interrupted this page."
            )}
          </p>

          {error.digest ? (
            <p className="num text-xs text-ink-faint">Reference: {error.digest}</p>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-1">
            <Button onClick={reset}>Try again</Button>
            <Link
              href="/"
              className="inline-flex items-center rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
            >
              Back to corridor
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
