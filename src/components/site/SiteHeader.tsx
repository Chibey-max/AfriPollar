import Link from "next/link";
import { WalletBadge } from "@/components/pollar/WalletBadge";
import { ModeBadge } from "@/components/transfer/badges";
import type { CorridorMode } from "@/types/corridor";

const NAV = [
  { href: "/", label: "Corridor" },
  { href: "/transfer/new", label: "Send" },
  { href: "/agent", label: "Agent desk" },
  { href: "/settings", label: "Settings" },
];

export function SiteHeader({ mode }: { mode: CorridorMode }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="flex min-h-11 items-center gap-2.5">
          <span
            aria-hidden
            className="size-5 rounded-md bg-gradient-to-br from-origin to-destination"
          />
          <span className="text-sm font-semibold tracking-tight text-ink">AfriPollar</span>
        </Link>

        <nav aria-label="Primary" className="order-3 w-full sm:order-none sm:w-auto">
          <ul className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 text-sm text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <span className="hidden sm:block">
            <ModeBadge mode={mode} />
          </span>
          <WalletBadge />
        </div>
      </div>
    </header>
  );
}
