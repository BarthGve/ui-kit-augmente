import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import {
  addUnits,
  clampToAxis,
  isNoop,
  moveSpan,
  resizeEnd,
  resizeStart,
  toChange,
  unitsFromPixels,
} from "./edit";
import { toDay } from "./scale";

const d = (iso: string) => toDay(iso)!;
const span = (start: string, end: string) => ({ start: d(start), end: d(end) });
const iso = (s: {
  start: { toString(): string };
  end: { toString(): string };
}) => [s.start.toString(), s.end.toString()];

describe("addUnits", () => {
  it("adds days in day zoom and 7-day weeks in week zoom, both ways", () => {
    expect(addUnits(d("2026-03-04"), "day", 3)).toEqual(d("2026-03-07"));
    expect(addUnits(d("2026-03-04"), "day", -3)).toEqual(d("2026-03-01"));
    expect(addUnits(d("2026-03-04"), "week", 2)).toEqual(d("2026-03-18"));
    expect(addUnits(d("2026-03-04"), "week", -1)).toEqual(d("2026-02-25"));
  });

  it("adds calendar months, clamped to the month's last day", () => {
    expect(addUnits(d("2026-01-31"), "month", 1)).toEqual(d("2026-02-28"));
    expect(addUnits(d("2024-02-29"), "month", 12)).toEqual(d("2025-02-28"));
    expect(addUnits(d("2026-03-31"), "month", -1)).toEqual(d("2026-02-28"));
    expect(addUnits(d("2026-03-15"), "month", -14)).toEqual(d("2025-01-15"));
  });
});

describe("moveSpan", () => {
  it("shifts both dates by the same unit in day and week zoom", () => {
    expect(iso(moveSpan(span("2026-03-04", "2026-03-10"), "day", 3))).toEqual([
      "2026-03-07",
      "2026-03-13",
    ]);
    expect(iso(moveSpan(span("2026-03-04", "2026-03-10"), "week", -1))).toEqual(
      ["2026-02-25", "2026-03-03"],
    );
  });

  it("keeps the length in days across a clamped month move", () => {
    expect(iso(moveSpan(span("2026-01-31", "2026-02-05"), "month", 1))).toEqual(
      ["2026-02-28", "2026-03-05"],
    );
    // 59 days long: + 1 month on each date would end on 2026-04-30.
    expect(iso(moveSpan(span("2026-01-31", "2026-03-31"), "month", 1))).toEqual(
      ["2026-02-28", "2026-04-28"],
    );
  });

  it("never inverts a one-day task", () => {
    const moved = moveSpan(span("2026-03-31", "2026-03-31"), "month", -1);
    expect(iso(moved)).toEqual(["2026-02-28", "2026-02-28"]);
  });
});

describe("resizeEnd / resizeStart", () => {
  const s = span("2026-03-04", "2026-03-10");

  it("resizeEnd changes only the end", () => {
    expect(resizeEnd(s, "day", 2)).toEqual({
      start: d("2026-03-04"),
      end: d("2026-03-12"),
      clamped: false,
    });
    expect(resizeEnd(s, "day", -6)).toEqual({
      start: d("2026-03-04"),
      end: d("2026-03-04"),
      clamped: false,
    });
    expect(resizeEnd(s, "month", 1).end).toEqual(d("2026-04-10"));
  });

  it("resizeEnd clamps at end == start and says so", () => {
    expect(resizeEnd(s, "day", -10)).toEqual({
      start: d("2026-03-04"),
      end: d("2026-03-04"),
      clamped: true,
    });
    expect(resizeEnd(s, "week", -1)).toEqual({
      start: d("2026-03-04"),
      end: d("2026-03-04"),
      clamped: true,
    });
  });

  it("resizeStart changes only the start and never passes the end", () => {
    expect(resizeStart(s, "day", -2)).toEqual({
      start: d("2026-03-02"),
      end: d("2026-03-10"),
      clamped: false,
    });
    expect(resizeStart(s, "day", 6)).toEqual({
      start: d("2026-03-10"),
      end: d("2026-03-10"),
      clamped: false,
    });
    expect(resizeStart(s, "week", 1)).toEqual({
      start: d("2026-03-10"),
      end: d("2026-03-10"),
      clamped: true,
    });
  });
});

describe("from the original span", () => {
  it("n then 0 returns the original, even after a clamped month", () => {
    const original = span("2026-01-31", "2026-03-31");
    expect(iso(moveSpan(original, "month", 1))).toEqual([
      "2026-02-28",
      "2026-04-28",
    ]);
    expect(moveSpan(original, "month", 0)).toEqual(original);
    expect(resizeEnd(original, "month", -1).end).toEqual(d("2026-02-28"));
    expect(resizeEnd(original, "month", 0).end).toEqual(d("2026-03-31"));
  });
});

describe("unitsFromPixels", () => {
  it("day zoom rounds half away from zero, symmetric", () => {
    expect(unitsFromPixels(119, 40, "day", d("2026-03-04"))).toBe(3);
    expect(unitsFromPixels(20, 40, "day", d("2026-03-04"))).toBe(1);
    expect(unitsFromPixels(-20, 40, "day", d("2026-03-04"))).toBe(-1);
    expect(unitsFromPixels(19, 40, "day", d("2026-03-04"))).toBe(0);
    expect(unitsFromPixels(-19, 40, "day", d("2026-03-04"))).toBe(0);
  });

  it("week zoom snaps to whole 7-day weeks", () => {
    expect(unitsFromPixels(20, 12, "week", d("2026-03-04"))).toBe(0);
    expect(unitsFromPixels(50, 12, "week", d("2026-03-04"))).toBe(1);
    expect(unitsFromPixels(-50, 12, "week", d("2026-03-04"))).toBe(-1);
    expect(unitsFromPixels(42, 12, "week", d("2026-03-04"))).toBe(1);
    expect(unitsFromPixels(-42, 12, "week", d("2026-03-04"))).toBe(-1);
  });

  it("month zoom picks the nearest calendar month from the anchor date", () => {
    // 2026-02 has 28 days: +1 month is 28 days away.
    expect(unitsFromPixels(4 * 13, 4, "month", d("2026-02-01"))).toBe(0);
    expect(unitsFromPixels(4 * 14, 4, "month", d("2026-02-01"))).toBe(1);
    expect(unitsFromPixels(4 * 15, 4, "month", d("2026-02-01"))).toBe(1);
    // 2026-01 has 31 days: the same 15 days is still nearer to 0.
    expect(unitsFromPixels(4 * 15, 4, "month", d("2026-01-01"))).toBe(0);
    expect(unitsFromPixels(4 * 15.5, 4, "month", d("2026-01-01"))).toBe(1);
    expect(unitsFromPixels(4 * 59, 4, "month", d("2026-01-01"))).toBe(2);
  });

  it("month zoom is symmetric backwards", () => {
    // 2026-03-01 - 1 month = 2026-02-01, 28 days back.
    expect(unitsFromPixels(-4 * 14, 4, "month", d("2026-03-01"))).toBe(-1);
    expect(unitsFromPixels(-4 * 13, 4, "month", d("2026-03-01"))).toBe(0);
    // 2026-02-01 - 1 month = 2026-01-01, 31 days back.
    expect(unitsFromPixels(-4 * 15.5, 4, "month", d("2026-02-01"))).toBe(-1);
    expect(unitsFromPixels(-4 * 15, 4, "month", d("2026-02-01"))).toBe(0);
  });

  it("gives 0 when the geometry is unknown", () => {
    expect(unitsFromPixels(100, 0, "day", d("2026-03-04"))).toBe(0);
    expect(unitsFromPixels(Number.NaN, 40, "month", d("2026-03-04"))).toBe(0);
  });

  it("caps an absurd offset at 2 x MAX_DAYS days, quickly", () => {
    const began = performance.now();
    // 7320 days from 2026-03-04: 240 months is 7305 days, -241 is -7333.
    for (const dx of [1e12, 1e308]) {
      expect(unitsFromPixels(dx, 1, "month", d("2026-03-04"))).toBe(240);
      expect(unitsFromPixels(-dx, 1, "month", d("2026-03-04"))).toBe(-241);
      expect(unitsFromPixels(dx, 1, "day", d("2026-03-04"))).toBe(7320);
    }
    expect(unitsFromPixels(1, 1e-300, "week", d("2026-03-04"))).toBe(1046);
    // Uncapped, 1e12 alone takes seconds and 1e308 does not finish.
    expect(performance.now() - began).toBeLessThan(2000);
  });
});

describe("clampToAxis", () => {
  const axis = { origin: d("2026-03-02"), end: d("2026-03-29") };
  const s = span("2026-03-10", "2026-03-12");

  it("leaves an in-bounds move alone", () => {
    expect(clampToAxis(s, axis, 5, "day", "move")).toBe(5);
    expect(clampToAxis(s, axis, -8, "day", "move")).toBe(-8);
  });

  it("stops a move at the axis edges, per zoom unit", () => {
    expect(clampToAxis(s, axis, 100, "day", "move")).toBe(17);
    expect(clampToAxis(s, axis, -100, "day", "move")).toBe(-8);
    expect(clampToAxis(s, axis, 3, "week", "move")).toBe(2);
    expect(clampToAxis(s, axis, -2, "week", "move")).toBe(-1);
    expect(clampToAxis(s, axis, 1, "month", "move")).toBe(0);
    expect(clampToAxis(s, axis, 1e9, "day", "move")).toBe(17);
    expect(clampToAxis(s, axis, -Infinity, "week", "move")).toBe(-1);
  });

  it("bounds the edited edge of a resize", () => {
    expect(clampToAxis(s, axis, 100, "day", "resize-end")).toBe(17);
    expect(clampToAxis(s, axis, -100, "day", "resize-start")).toBe(-8);
  });

  it("lets a span touching an edge move away from it only", () => {
    const first = span("2026-03-02", "2026-03-04");
    expect(clampToAxis(first, axis, 5, "day", "move")).toBe(5);
    expect(clampToAxis(first, axis, -1, "day", "move")).toBe(0);
    const last = span("2026-03-27", "2026-03-29");
    expect(clampToAxis(last, axis, 1, "day", "move")).toBe(0);
    expect(clampToAxis(last, axis, -1, "day", "move")).toBe(-1);
  });

  it("collapses to no movement for a span already outside the window", () => {
    // Either could move fully inside, and still does not move.
    const before = span("2026-02-28", "2026-03-04");
    const after = span("2026-03-20", "2026-03-31");
    for (const n of [-5, 5]) {
      expect(clampToAxis(before, axis, n, "day", "move")).toBe(0);
      expect(clampToAxis(after, axis, n, "day", "move")).toBe(0);
    }
    expect(clampToAxis(before, axis, 3, "day", "resize-end")).toBe(0);
  });
});

describe("toChange / isNoop", () => {
  it("emits ISO calendar days", () => {
    expect(toChange(span("2026-03-04", "0999-01-02"))).toEqual({
      start: "2026-03-04",
      end: "0999-01-02",
    });
  });

  it("is a no-op only when both dates are unchanged", () => {
    const s = span("2026-03-04", "2026-03-10");
    expect(isNoop(s, span("2026-03-04", "2026-03-10"))).toBe(true);
    expect(isNoop(s, span("2026-03-05", "2026-03-10"))).toBe(false);
    expect(isNoop(s, span("2026-03-04", "2026-03-11"))).toBe(false);
  });
});

// Vitest is pinned to TZ=UTC (src/tests/Global.ts), so the zone checks run in
// a fresh Node process with a real TZ (same pattern as scale.spec.ts). Each
// case straddles one zone's 2026 DST change (Paris 29 Mar / 25 Oct, Los
// Angeles 8 Mar / 1 Nov, Auckland 5 Apr / 27 Sep); the month ties sit within
// an hour of the half, so a local-time day count flips them.
describe("under a real local time zone", () => {
  const tsxCli = createRequire(__filename).resolve("tsx/cli");
  const editUrl = pathToFileURL(join(__dirname, "edit.ts")).href;
  const scaleUrl = pathToFileURL(join(__dirname, "scale.ts")).href;
  const script = `
    import * as e from ${JSON.stringify(editUrl)};
    import { toDay } from ${JSON.stringify(scaleUrl)};
    import { getLocalTimeZone } from "@internationalized/date";
    const s = (a, b) => ({ start: toDay(a), end: toDay(b) });
    const out = (x) => [x.start.toString(), x.end.toString()];
    const axis = { origin: toDay("2026-03-02"), end: toDay("2026-11-29") };
    console.log(JSON.stringify({
      zone: getLocalTimeZone(),
      move: [
        out(e.moveSpan(s("2026-03-28", "2026-03-30"), "day", 1)),
        out(e.moveSpan(s("2026-03-07", "2026-03-09"), "month", 1)),
        out(e.moveSpan(s("2026-10-24", "2026-10-26"), "week", 1)),
        out(e.moveSpan(s("2026-09-26", "2026-09-28"), "month", -1)),
      ],
      resize: [
        out(e.resizeEnd(s("2026-04-04", "2026-04-06"), "day", -5)),
        out(e.resizeStart(s("2026-10-31", "2026-11-02"), "week", 1)),
      ],
      units: [
        e.unitsFromPixels(15.48, 1, "month", toDay("2026-03-01")),
        e.unitsFromPixels(15.01, 1, "month", toDay("2026-04-01")),
        e.unitsFromPixels(-15.51, 1, "month", toDay("2026-11-01")),
        e.unitsFromPixels(2.5, 1, "day", toDay("2026-03-28")),
      ],
      clamp: [
        e.clampToAxis(s("2026-03-28", "2026-03-30"), axis, 1000, "day", "move"),
        e.clampToAxis(s("2026-03-28", "2026-03-30"), axis, -1000, "day", "move"),
        e.clampToAxis(s("2026-03-28", "2026-03-30"), axis, 100, "month", "move"),
      ],
      change: e.toChange(s("2026-03-29", "2026-10-25")),
    }));
  `;
  const runIn = (tz: string) =>
    JSON.parse(
      execFileSync(process.execPath, [tsxCli, "--eval", script], {
        cwd: __dirname,
        env: { ...process.env, TZ: tz },
        encoding: "utf8",
      }),
    );
  const expected = {
    move: [
      ["2026-03-29", "2026-03-31"],
      ["2026-04-07", "2026-04-09"],
      ["2026-10-31", "2026-11-02"],
      ["2026-08-26", "2026-08-28"],
    ],
    resize: [
      ["2026-04-04", "2026-04-04"],
      ["2026-11-02", "2026-11-02"],
    ],
    units: [0, 1, -1, 3],
    clamp: [244, -26, 7],
    change: { start: "2026-03-29", end: "2026-10-25" },
  };

  it.each(["Europe/Paris", "America/Los_Angeles", "Pacific/Auckland"])(
    "gives the same calendar results under TZ=%s",
    (tz) => {
      const { zone, ...result } = runIn(tz);
      expect(zone).toBe(tz);
      expect(result).toEqual(expected);
    },
    20_000,
  );
});
