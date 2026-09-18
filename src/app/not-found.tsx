import Link from "next/link";
import { Card } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-10">
      <Card>
        <div className="space-y-4 px-5 py-6">
          <h1 className="text-lg font-semibold tracking-tight text-ink">Transfer not found</h1>
          <p className="text-sm leading-relaxed text-ink-soft">
            No corridor transfer matches that link. Check the transfer ID, or ask the sender to
            re-share the claim link.
          </p>
          <Link
            href="/"
            className="inline-flex items-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink transition-colors hover:opacity-90"
          >
            Back to corridor
          </Link>
        </div>
      </Card>
    </div>
  );
}
