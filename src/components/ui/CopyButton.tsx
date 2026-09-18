"use client";

import { useEffect, useState } from "react";
import { cx } from "@/components/ui/primitives";

export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          // Clipboard can be blocked (insecure origin, denied permission).
          // The value stays visible on screen, so this fails quietly.
        }
      }}
      className={cx(
        "inline-flex min-h-11 items-center rounded-lg border border-line px-3 text-xs font-medium text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink",
        className,
      )}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
