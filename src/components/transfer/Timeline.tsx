import { formatDateTime, TIMELINE_STEPS } from "@/lib/format";
import { cx } from "@/components/ui/primitives";
import type { TimelineEvent, TransferStatus } from "@/types/corridor";

const LEG_DOT = {
  origin: "bg-origin",
  corridor: "bg-accent",
  destination: "bg-destination",
} as const;

/**
 * Corridor proof timeline (PRD §9.2). Reached milestones are stamped with the
 * time they were recorded; the rest stay visible so the remaining path is
 * legible rather than hidden.
 */
export function Timeline({
  timeline,
  status,
}: {
  timeline: TimelineEvent[];
  status: TransferStatus;
}) {
  const reachedAt = new Map(timeline.map((event) => [event.status, event.at]));
  const lastReachedIndex = TIMELINE_STEPS.reduce(
    (acc, step, index) => (reachedAt.has(step.status) ? index : acc),
    -1,
  );

  return (
    <ol className="px-5 py-4">
      {TIMELINE_STEPS.map((step, index) => {
        const at = reachedAt.get(step.status);
        const reached = Boolean(at);
        const isCurrent = index === lastReachedIndex && status !== "completed";
        const isLast = index === TIMELINE_STEPS.length - 1;

        return (
          <li key={step.status} className="relative flex gap-3.5 pb-5 last:pb-0">
            {!isLast ? (
              <span
                aria-hidden
                className={cx(
                  "absolute left-[5px] top-4 h-full w-px",
                  index < lastReachedIndex ? "bg-line-strong" : "bg-line",
                )}
              />
            ) : null}
            <span
              aria-hidden
              className={cx(
                "relative mt-1 size-2.5 shrink-0 rounded-full",
                reached ? LEG_DOT[step.leg] : "border border-line-strong bg-surface",
                isCurrent && "ring-4 ring-accent/20",
              )}
            />
            <div className="min-w-0 flex-1">
              <p
                className={cx(
                  "text-sm font-medium",
                  reached ? "text-ink" : "text-ink-faint",
                )}
              >
                {step.label}
              </p>
              <p className="num mt-0.5 text-xs text-ink-faint">
                {at ? `${formatDateTime(at)} UTC` : "Pending"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
