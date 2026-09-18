import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TIMELINE_STEPS, formatBob, formatDuration, formatUsdc, truncateMiddle } from "@/lib/format";

describe("money formatting", () => {
  it("always shows two decimals of USDC", () => {
    assert.equal(formatUsdc(97.3), "97.30 USDC");
    assert.equal(formatUsdc(0), "0.00 USDC");
  });

  it("groups thousands in BOB", () => {
    assert.equal(formatBob(1234.5), "1,234.5 BOB");
  });
});

describe("formatDuration", () => {
  it("renders sub-hour durations in minutes", () => {
    assert.equal(formatDuration(18), "~18 min");
  });

  it("renders longer durations in hours and minutes", () => {
    assert.equal(formatDuration(90), "~1h 30m");
    assert.equal(formatDuration(120), "~2h");
  });
});

describe("truncateMiddle", () => {
  it("leaves short values intact", () => {
    assert.equal(truncateMiddle("GABC", 6, 6), "GABC");
  });

  it("elides the middle of long values", () => {
    const result = truncateMiddle("GDEMOAFRIPOLLARCORRIDORSANDBOX", 6, 4);
    assert.ok(result.startsWith("GDEMOA"));
    assert.ok(result.endsWith("DBOX"));
    assert.ok(result.includes("…"));
  });
});

describe("TIMELINE_STEPS", () => {
  it("runs origin -> corridor -> destination without going backwards", () => {
    const order = { origin: 0, corridor: 1, destination: 2 };
    let seen = -1;

    for (const step of TIMELINE_STEPS) {
      assert.ok(order[step.leg] >= seen, `${step.status} breaks corridor leg order`);
      seen = order[step.leg];
    }
  });

  it("starts at creation and ends at completion", () => {
    assert.equal(TIMELINE_STEPS.at(0)?.status, "created");
    assert.equal(TIMELINE_STEPS.at(-1)?.status, "completed");
  });
});
