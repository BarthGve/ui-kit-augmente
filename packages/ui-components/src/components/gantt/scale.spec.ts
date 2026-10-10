import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { describe, expect, it } from "vitest";
import { defaultTokenRefs } from "@gouvfr-lasuite/ui-tokens";
import { buildScale, dayIndex, formatDates, MAX_DAYS, toDay } from "./scale";
import { tokens } from "./tokens";

const d = (iso: string) => toDay(iso)!;
const task = (start?: string, end?: string) => ({
  id: "t",
  name: "Task",
  start,
  end,
});

describe("toDay", () => {
  it("accepts an ISO string and a CalendarDate", () => {
    expect(toDay("2026-03-30")).toEqual(new CalendarDate(2026, 3, 30));
    expect(toDay(new CalendarDate(2026, 3, 30))).toEqual(
      new CalendarDate(2026, 3, 30),
    );
  });

  it("returns null on malformed or impossible dates, never throws", () => {
    expect(toDay("2026-02-30")).toBeNull();
    expect(toDay("2026-3-1")).toBeNull();
    expect(toDay("not a date")).toBeNull();
    expect(toDay(undefined)).toBeNull();
  });
});

describe("dayIndex", () => {
  it("counts whole days, leap day and backwards included", () => {
    expect(dayIndex(d("2026-03-28"), d("2026-03-30"))).toBe(2);
    expect(dayIndex(d("2028-02-28"), d("2028-03-01"))).toBe(2);
    expect(dayIndex(d("2026-03-30"), d("2026-03-28"))).toBe(-2);
  });
});

describe("buildScale", () => {
  const today_ = d("2026-03-04");

  describe("positionOf", () => {
    const scale = buildScale({
      tasks: [task("2026-03-02", "2026-03-31")],
      zoom: "week",
      today: today_,
      locale: "fr-FR",
    });

    it("sizes bars with an inclusive end", () => {
      expect(scale.positionOf(task("2026-03-03", "2026-03-03"))).toEqual({
        start: 1,
        span: 1,
      });
      expect(scale.positionOf(task("2026-03-03", "2026-03-05"))).toEqual({
        start: 1,
        span: 3,
      });
      expect(scale.positionOf(task("2026-03-30", "2026-04-02"))).toEqual({
        start: 28,
        span: 4,
      });
    });

    it("gives no bar when dates are missing, invalid or reversed", () => {
      expect(scale.positionOf(task("2026-03-05", "2026-03-03"))).toBeNull();
      expect(scale.positionOf(task("2026-03-05"))).toBeNull();
      expect(scale.positionOf(task(undefined, "2026-03-05"))).toBeNull();
      expect(scale.positionOf(task())).toBeNull();
      expect(scale.positionOf(task("2026-02-30", "2026-03-05"))).toBeNull();
    });
  });

  describe("range", () => {
    // 2026-03-04 is a Wednesday, 2026-04-15 a Wednesday.
    const tasks = [
      task("2026-03-10", "2026-03-12"),
      task("2026-03-04", "2026-03-20"),
      task("2026-04-01", "2026-04-15"),
      task("2026-01-01", "2026-01-02x"),
      task(),
    ];

    it("starts at the locale's week start of the earliest valid start", () => {
      const fr = buildScale({
        tasks,
        zoom: "week",
        today: today_,
        locale: "fr-FR",
      });
      const us = buildScale({
        tasks,
        zoom: "week",
        today: today_,
        locale: "en-US",
      });
      expect(fr.origin).toEqual(d("2026-03-02")); // Monday
      expect(us.origin).toEqual(d("2026-03-01")); // Sunday
    });

    it("ends at the end of the week, or of the month in month zoom", () => {
      const week = buildScale({
        tasks,
        zoom: "week",
        today: today_,
        locale: "fr-FR",
      });
      expect(week.end).toEqual(d("2026-04-19"));
      expect(week.days).toBe(dayIndex(week.origin, week.end) + 1);
      const month = buildScale({
        tasks,
        zoom: "month",
        today: today_,
        locale: "fr-FR",
      });
      expect(month.end).toEqual(d("2026-04-30"));
    });

    it("falls back to a range around today when no task has dates", () => {
      const scale = buildScale({
        tasks: [task(), task("2026-05-01")],
        zoom: "week",
        today: today_,
        locale: "fr-FR",
      });
      expect(scale.origin).toEqual(d("2026-03-02"));
      expect(scale.end).toEqual(d("2026-03-08"));
      expect(scale.todayOffset).toBe(2);
    });

    it("defaults today to the local day", () => {
      const scale = buildScale({ tasks: [], zoom: "week", locale: "fr-FR" });
      const now = today(getLocalTimeZone());
      expect(scale.todayOffset).toBe(dayIndex(scale.origin, now));
    });
  });

  describe("zoom", () => {
    const tasks = [task("2026-03-04", "2026-04-15")];
    const at = (zoom: "day" | "week" | "month") =>
      buildScale({ tasks, zoom, today: today_, locale: "fr-FR" });

    it("has a distinct, decreasing day width", () => {
      expect(at("day").dayWidth).toBeGreaterThan(at("week").dayWidth);
      expect(at("week").dayWidth).toBeGreaterThan(at("month").dayWidth);
      expect(at("month").dayWidth).toBeGreaterThan(0);
    });

    it("matches the day-width tokens at 16px per rem, so they cannot drift", () => {
      const t = tokens(defaultTokenRefs);
      for (const zoom of ["day", "week", "month"] as const) {
        expect(`${at(zoom).dayWidth / 16}rem`).toBe(t[`day-width--${zoom}`]);
      }
    });

    it("ticks every day in day zoom", () => {
      const scale = at("day");
      expect(scale.ticks).toHaveLength(scale.days);
      expect(scale.ticks[0]).toEqual({ date: scale.origin, index: 0 });
      expect(scale.ticks[1]).toEqual({ date: d("2026-03-03"), index: 1 });
    });

    it("ticks every locale week start in week zoom", () => {
      const scale = at("week");
      // 2026-03-02 .. 2026-04-19: 7 Mondays
      expect(scale.ticks.map((t) => t.date.toString())).toEqual([
        "2026-03-02",
        "2026-03-09",
        "2026-03-16",
        "2026-03-23",
        "2026-03-30",
        "2026-04-06",
        "2026-04-13",
      ]);
      expect(scale.ticks.map((t) => t.index)).toEqual([
        0, 7, 14, 21, 28, 35, 42,
      ]);
    });

    it("ticks every first of month in month zoom", () => {
      const scale = at("month");
      // 2026-03-02 .. 2026-04-30
      expect(scale.ticks).toEqual([{ date: d("2026-04-01"), index: 30 }]);
      const wide = buildScale({
        tasks: [task("2026-01-01", "2026-03-04")],
        zoom: "month",
        today: today_,
        locale: "fr-FR",
      });
      // origin 2025-12-29
      expect(wide.ticks.map((t) => t.date.toString())).toEqual([
        "2026-01-01",
        "2026-02-01",
        "2026-03-01",
      ]);
    });
  });

  describe("bounded range", () => {
    // Worst case of the end padding: up to 6 days before, a month after.
    const LIMIT = MAX_DAYS + 37;
    const forever = task("0001-01-01", "9999-12-31");

    it.each(["day", "week", "month"] as const)(
      "%s zoom: extreme dates give at most MAX_DAYS (+ padding) days and ticks, today inside",
      (zoom) => {
        const scale = buildScale({
          tasks: [forever],
          zoom,
          today: today_,
          locale: "fr-FR",
        });
        expect(scale.days).toBeLessThanOrEqual(LIMIT);
        expect(scale.ticks.length).toBeLessThanOrEqual(LIMIT);
        expect(scale.todayOffset).not.toBeNull();
        // The bar is clipped to the window.
        expect(scale.positionOf(forever)).toEqual({
          start: 0,
          span: scale.days,
        });
      },
    );

    it("keeps the earliest start when the window can start there", () => {
      const scale = buildScale({
        tasks: [task("2026-03-02", "9999-12-31")],
        zoom: "week",
        today: today_,
        locale: "fr-FR",
      });
      expect(scale.origin).toEqual(d("2026-03-02"));
      expect(scale.days).toBeLessThanOrEqual(LIMIT);
    });

    it("gives no bar to a valid task wholly outside the window", () => {
      const scale = buildScale({
        tasks: [forever, task("0001-01-01", "0001-01-10")],
        zoom: "week",
        today: today_,
        locale: "fr-FR",
      });
      expect(scale.positionOf(task("0001-01-01", "0001-01-10"))).toBeNull();
    });
  });

  describe("todayOffset", () => {
    // fr-FR, week zoom: range 2026-03-02 .. 2026-03-08
    const at = (day: string) =>
      buildScale({
        tasks: [task("2026-03-04", "2026-03-05")],
        zoom: "week",
        today: d(day),
        locale: "fr-FR",
      }).todayOffset;

    it("is the day index of today inside the range", () => {
      expect(at("2026-03-02")).toBe(0);
      expect(at("2026-03-04")).toBe(2);
      expect(at("2026-03-08")).toBe(6);
    });

    it("is null outside the range", () => {
      expect(at("2026-03-01")).toBeNull();
      expect(at("2026-03-09")).toBeNull();
    });
  });
});

describe("formatDates", () => {
  it("formats with Intl in the locale", () => {
    expect(formatDates(task("2026-03-03", "2026-03-10"), "fr-FR")).toEqual({
      start: "3 mars 2026",
      end: "10 mars 2026",
    });
    expect(formatDates(task("2026-03-03", "2026-03-03"), "en-US")).toEqual({
      start: "March 3, 2026",
      end: "March 3, 2026",
    });
  });

  it("returns null for a task without a valid span", () => {
    expect(formatDates(task("2026-03-05"), "fr-FR")).toBeNull();
    expect(formatDates(task("2026-03-05", "2026-03-03"), "fr-FR")).toBeNull();
  });
});

// The test run is pinned to TZ=UTC (src/tests/Global.ts) and both Intl and
// getLocalTimeZone() keep the zone they started with, so the zone-sensitive
// checks run in a fresh Node process started with a real TZ.
describe("under a real local time zone", () => {
  const tsxCli = createRequire(__filename).resolve("tsx/cli");
  const scaleUrl = pathToFileURL(join(__dirname, "scale.ts")).href;
  // Pairs two days apart across each zone's 2026 DST changes (Paris 29 Mar /
  // 25 Oct, Los Angeles 8 Mar / 1 Nov, Auckland 5 Apr / 27 Sep) and a leap day.
  const pairs = [
    ["2026-03-28", "2026-03-30"],
    ["2026-10-24", "2026-10-26"],
    ["2026-03-07", "2026-03-09"],
    ["2026-10-31", "2026-11-02"],
    ["2026-04-04", "2026-04-06"],
    ["2026-09-26", "2026-09-28"],
    ["2028-02-28", "2028-03-01"],
  ];
  const script = `
    import { dayIndex, formatDates, toDay } from ${JSON.stringify(scaleUrl)};
    import { getLocalTimeZone } from "@internationalized/date";
    const pairs = ${JSON.stringify(pairs)};
    console.log(JSON.stringify({
      zone: getLocalTimeZone(),
      days: pairs.map(([a, b]) => dayIndex(toDay(a), toDay(b))),
      fr: formatDates({ id: "t", name: "T", start: "2026-03-03", end: "2026-03-10" }, "fr-FR"),
      en: formatDates({ id: "t", name: "T", start: "2026-03-03", end: "2026-03-03" }, "en-US"),
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

  it.each(["Europe/Paris", "America/Los_Angeles", "Pacific/Auckland"])(
    "gives exact days and the same labels under TZ=%s",
    (tz) => {
      const result = runIn(tz);
      expect(result.zone).toBe(tz);
      expect(result.days).toEqual(pairs.map(() => 2));
      expect(result.fr).toEqual({ start: "3 mars 2026", end: "10 mars 2026" });
      expect(result.en).toEqual({
        start: "March 3, 2026",
        end: "March 3, 2026",
      });
    },
    20_000,
  );
});
