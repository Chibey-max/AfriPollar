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
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/78 shadow-[var(--shadow-nav)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-h-11 items-center gap-2.5">
          <span
            aria-hidden
            className="size-6 rounded-lg bg-gradient-to-br from-origin via-accent to-signal shadow-[0_0_24px_rgb(47_212_134/0.18)]"
          />
          <span className="text-sm font-semibold tracking-tight text-ink">AfriPollar</span>
        </Link>

        <nav aria-label="Primary" className="order-3 w-full sm:order-none sm:w-auto">
          <ul className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="link-underline flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 font-mono text-xs uppercase tracking-wider text-ink-soft transition-colors hover:text-accent"
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
