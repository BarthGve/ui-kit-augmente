import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { CalendarDate } from "@internationalized/date";
import { describe, expect, it } from "vitest";
import {
  checkLink,
  conflictOf,
  conflictsOf,
  linkKey,
  type LinkPair,
  MAX_LINKS,
  neighboursOf,
  normalizeLinks,
  reaches,
  routeOf,
  type RoutePoint,
} from "./links";

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};
const link = (from: string, to: string): LinkPair => ({ from, to });
const links = (...pairs: string[]) =>
  deepFreeze(pairs.map((p) => link(p[0], p[1])));
const chain = (n: number) =>
  deepFreeze(Array.from({ length: n }, (_, i) => link(`n${i}`, `n${i + 1}`)));
const d = (y: number, m: number, day: number) => new CalendarDate(y, m, day);

describe("normalizeLinks", () => {
  const ids = new Set(["A", "B", "C"]);

  it("drops unknown ids, self-links and duplicates, keeps order and the reverse pair", () => {
    const input = deepFreeze([
      link("A", "B"),
      link("A", "Z"),
      link("Z", "B"),
      link("C", "C"),
      link("B", "C"),
      link("A", "B"),
      link("B", "A"),
    ]);
    const out = normalizeLinks(input, ids);
    expect(out).toEqual([link("A", "B"), link("B", "C"), link("B", "A")]);
    expect(input).toHaveLength(7);
  });

  it("accepts undefined", () => {
    expect(normalizeLinks(undefined, ids)).toEqual([]);
  });

  it("skips entries that are not objects (untrusted caller data)", () => {
    const input = deepFreeze([null, "AB", link("A", "B")]) as never;
    expect(normalizeLinks(input, ids)).toEqual([link("A", "B")]);
  });

  it(`keeps at most MAX_LINKS (${MAX_LINKS}) valid links, first ones first`, () => {
    const many = chain(MAX_LINKS + 1);
    const known = new Set(
      Array.from({ length: MAX_LINKS + 2 }, (_, i) => `n${i}`),
    );
    const out = normalizeLinks(many, known);
    expect(MAX_LINKS).toBe(1000);
    expect(out).toHaveLength(1000);
    expect(out[999]).toEqual(link("n999", "n1000"));
  });

  it("does not let a key collision merge two different pairs", () => {
    const known = new Set(["a", "ab", "b", "bb"]);
    const out = normalizeLinks(
      deepFreeze([link("a", "bb"), link("ab", "b")]),
      known,
    );
    expect(out).toHaveLength(2);
    expect(linkKey(out[0])).not.toBe(linkKey(out[1]));
  });
});

describe("reaches", () => {
  it("answers on an empty link list", () => {
    expect(reaches([], "A", "B")).toBe(false);
    expect(reaches([], "A", "A")).toBe(true);
  });

  it("follows the links forward only", () => {
    const ls = links("AB", "BC");
    expect(reaches(ls, "A", "C")).toBe(true);
    expect(reaches(ls, "C", "A")).toBe(false);
    expect(reaches(ls, "A", "A")).toBe(true);
  });

  it("walks a raw 50 000-node chain without overflowing the stack", () => {
    const ls = chain(50_000);
    expect(reaches(ls, "n0", "n50000")).toBe(true);
    expect(reaches(ls, "n50000", "n0")).toBe(false);
  });

  // A synchronous infinite loop cannot be stopped by a Vitest timeout: the
  // step budget turns a missing visited set into a wrong answer, not a hang.
  it("terminates on cyclic input data and still answers correctly", () => {
    const ls = links("AB", "BA", "BC", "CB");
    expect(reaches(ls, "A", "Z")).toBe(false);
    expect(reaches(ls, "A", "C")).toBe(true);
  });
});

describe("checkLink", () => {
  const all = () => true;

  it("refuses a self-link first", () => {
    expect(checkLink(links("AB"), "A", "A", () => false)).toBe("self");
  });

  it("reports an existing link before a missing bar", () => {
    expect(checkLink(links("AB"), "A", "B", () => false)).toBe("exists");
  });

  it("refuses a task without dates", () => {
    expect(checkLink(links("AB"), "B", "C", (id) => id !== "C")).toBe(
      "no_dates",
    );
    expect(checkLink(links("AB"), "C", "B", (id) => id !== "C")).toBe(
      "no_dates",
    );
  });

  it("reports a missing bar before a cycle", () => {
    expect(checkLink(links("AB"), "B", "A", (id) => id !== "A")).toBe(
      "no_dates",
    );
  });

  it("refuses the reverse pair and a chain closing on itself", () => {
    expect(checkLink(links("AB"), "B", "A", all)).toBe("cycle");
    expect(checkLink(links("AB", "BC"), "C", "A", all)).toBe("cycle");
  });

  it("accepts a link that closes no cycle", () => {
    const diamond = links("AB", "AC", "BD", "CD");
    expect(checkLink(diamond, "D", "E", all)).toBeNull();
    expect(checkLink(diamond, "A", "D", all)).toBeNull();
    expect(checkLink(links("AB", "BC"), "A", "C", all)).toBeNull();
  });

  it("accepts the first link ever", () => {
    expect(checkLink([], "A", "B", all)).toBeNull();
  });

  it(`refuses a new link once ${MAX_LINKS} are held, still finds the existing one`, () => {
    const full = chain(MAX_LINKS);
    expect(checkLink(full, "x", "y", all)).toBe("limit");
    expect(checkLink(full, "n0", "n1", all)).toBe("exists");
    expect(checkLink(chain(MAX_LINKS - 1), "x", "y", all)).toBeNull();
  });

  it(`searches a ${MAX_LINKS - 1}-link chain`, () => {
    const n = MAX_LINKS - 1;
    const ls = chain(n);
    expect(checkLink(ls, `n${n}`, "n0", all)).toBe("cycle");
    expect(checkLink(ls, "n0", `n${n}`, all)).toBeNull();
  });

  it("terminates on cyclic input data", () => {
    expect(checkLink(links("AB", "BA"), "D", "A", all)).toBeNull();
    expect(checkLink(links("AB", "BA"), "B", "D", all)).toBeNull();
  });
});

describe("conflictOf", () => {
  const span = (start: CalendarDate, end: CalendarDate) => ({ start, end });

  it("is a conflict when the successor starts on or before the predecessor's last day", () => {
    const pred = span(d(2026, 3, 2), d(2026, 3, 10));
    expect(conflictOf(pred, span(d(2026, 3, 11), d(2026, 3, 12)))).toBe(false);
    expect(conflictOf(pred, span(d(2026, 3, 10), d(2026, 3, 12)))).toBe(true);
    expect(conflictOf(pred, span(d(2026, 3, 1), d(2026, 3, 1)))).toBe(true);
  });

  it("compares across a month end and a leap day", () => {
    const pred = span(d(2028, 2, 20), d(2028, 2, 29));
    expect(conflictOf(pred, span(d(2028, 3, 1), d(2028, 3, 2)))).toBe(false);
    expect(conflictOf(pred, span(d(2028, 2, 29), d(2028, 3, 2)))).toBe(true);
    const april = span(d(2026, 4, 1), d(2026, 4, 30));
    expect(conflictOf(april, span(d(2026, 5, 1), d(2026, 5, 1)))).toBe(false);
  });
});

describe("conflictsOf", () => {
  it("returns the keys of the conflicting links, ignoring tasks without a valid span", () => {
    const spans = new Map(
      deepFreeze([
        ["A", { start: d(2026, 3, 2), end: d(2026, 3, 10) }],
        ["B", { start: d(2026, 3, 10), end: d(2026, 3, 12) }],
        ["C", { start: d(2026, 3, 13), end: d(2026, 3, 14) }],
        ["R", { start: d(2026, 3, 9), end: d(2026, 3, 1) }],
        ["N", null],
      ] as const),
    );
    const ls = links("AB", "BC", "AR", "RB", "AN", "AX");
    expect(conflictsOf(ls, spans)).toEqual(new Set([linkKey(link("A", "B"))]));
  });
});

describe("routeOf", () => {
  // Literal pixels at a 16px root: link-gutter 44, link-lead 12, row pitch
  // 40 + 1, row height 40.
  const px = (p: RoutePoint, dayWidth: number) => ({
    x: p.day * dayWidth + p.gutters * 44 + p.leads * 12,
    y: p.row * 41 + (p.centre ? 20 : 0),
  });
  const check = (
    pred: { row: number; start: number; span: number },
    succ: { row: number; start: number; span: number },
    dayWidth: number,
  ) => {
    const route = routeOf(deepFreeze(pred), deepFreeze(succ), { dayWidth });
    expect(route.length).toBeGreaterThan(0);
    expect(route.length).toBeLessThanOrEqual(5);
    const first = route[0][0];
    const last = route[route.length - 1];
    expect(first).toEqual({
      day: pred.start + pred.span,
      gutters: 0,
      leads: 0,
      row: pred.row,
      centre: true,
    });
    expect(last[1]).toEqual({
      day: succ.start,
      gutters: 0,
      leads: 0,
      row: succ.row,
      centre: true,
    });
    const [a, b] = [px(last[0], dayWidth), px(last[1], dayWidth)];
    expect(a.y).toBe(b.y);
    expect(b.x).toBeGreaterThan(a.x);
    route.forEach(([p, q], i) => {
      const [s, t] = [px(p, dayWidth), px(q, dayWidth)];
      expect(s.x === t.x || s.y === t.y).toBe(true);
      expect(s).not.toEqual(t);
      if (i > 0) expect(p).toEqual(route[i - 1][1]);
    });
    return route;
  };

  it("takes the forward route from a 56px gap, the U route below", () => {
    // Month zoom (4px a day): 14 days = 56px, 13 days = 52px.
    expect(
      check({ row: 0, start: 0, span: 5 }, { row: 2, start: 19, span: 3 }, 4),
    ).toHaveLength(3);
    expect(
      check({ row: 0, start: 0, span: 5 }, { row: 2, start: 18, span: 3 }, 4),
    ).toHaveLength(5);
    // Week zoom (12px a day): 5 days = 60px, 4 days = 48px.
    expect(
      check({ row: 1, start: 3, span: 2 }, { row: 3, start: 10, span: 1 }, 12),
    ).toHaveLength(3);
    expect(
      check({ row: 1, start: 3, span: 2 }, { row: 3, start: 9, span: 1 }, 12),
    ).toHaveLength(5);
  });

  it("puts the forward vertical one lead before the successor", () => {
    const route = check(
      { row: 0, start: 0, span: 2 },
      { row: 4, start: 4, span: 1 },
      40,
    );
    expect(route[1][0]).toEqual({
      day: 4,
      gutters: 0,
      leads: -1,
      row: 0,
      centre: true,
    });
    expect(route[1][1]).toEqual({
      day: 4,
      gutters: 0,
      leads: -1,
      row: 4,
      centre: true,
    });
  });

  it("takes the U route when the successor starts before the predecessor ends", () => {
    const route = check(
      { row: 0, start: 10, span: 10 },
      { row: 1, start: 5, span: 2 },
      40,
    );
    expect(route).toHaveLength(5);
    expect(route[0][1]).toEqual({
      day: 20,
      gutters: 1,
      leads: 0,
      row: 0,
      centre: true,
    });
  });

  it("runs the U route along the line between adjacent rows", () => {
    const route = check(
      { row: 3, start: 0, span: 2 },
      { row: 4, start: 2, span: 1 },
      12,
    );
    expect(route[1][1]).toEqual({
      day: 2,
      gutters: 1,
      leads: 0,
      row: 4,
      centre: false,
    });
    expect(route[2][1]).toEqual({
      day: 2,
      gutters: 0,
      leads: -1,
      row: 4,
      centre: false,
    });
  });

  it("runs the U route along the top of the predecessor row when the successor is above", () => {
    const route = check(
      { row: 5, start: 0, span: 2 },
      { row: 1, start: 2, span: 1 },
      12,
    );
    expect(route[1][1]).toEqual({
      day: 2,
      gutters: 1,
      leads: 0,
      row: 5,
      centre: false,
    });
  });

  // Rows are distinct tasks, but duplicate ids or a caller slip could pass
  // one row twice: the route stays drawable, with no zero-length segment.
  it("routes a successor on the predecessor's own row without a degenerate segment", () => {
    expect(
      check({ row: 2, start: 0, span: 2 }, { row: 2, start: 10, span: 1 }, 12),
    ).toHaveLength(2);
    const u = check(
      { row: 2, start: 0, span: 2 },
      { row: 2, start: 1, span: 1 },
      12,
    );
    expect(u).toHaveLength(5);
    expect(u[1][1]).toEqual({
      day: 2,
      gutters: 1,
      leads: 0,
      row: 2,
      centre: false,
    });
  });

  it("spans rows 400 apart either way", () => {
    expect(
      check(
        { row: 0, start: 0, span: 2 },
        { row: 400, start: 30, span: 1 },
        12,
      ),
    ).toHaveLength(3);
    expect(
      check({ row: 400, start: 0, span: 2 }, { row: 0, start: 1, span: 1 }, 12),
    ).toHaveLength(5);
  });
});

describe("neighboursOf", () => {
  it("lists predecessors and successors per id, in input order", () => {
    const n = neighboursOf(links("AC", "BC", "CD", "CE"));
    expect(n.get("C")).toEqual({ after: ["A", "B"], before: ["D", "E"] });
    expect(n.get("A")).toEqual({ after: [], before: ["C"] });
    expect(n.get("E")).toEqual({ after: ["C"], before: [] });
    expect(n.has("Z")).toBe(false);
  });
});

// Vitest is pinned to TZ=UTC (src/tests/Global.ts), so the zone checks run in
// a fresh Node process with a real TZ (same pattern as edit.spec.ts). Every
// pair sits on one zone's 2026 DST change (Paris 29 Mar / 25 Oct, Los Angeles
// 8 Mar / 1 Nov, Auckland 5 Apr / 27 Sep): a whole-day count over local
// midnights rounded down flips the spring pair of the zone (a 23-hour day).
describe("under a real local time zone", () => {
  const tsxCli = createRequire(__filename).resolve("tsx/cli");
  const linksUrl = pathToFileURL(join(__dirname, "links.ts")).href;
  const script = `
    import * as l from ${JSON.stringify(linksUrl)};
    import { getLocalTimeZone, parseDate } from "@internationalized/date";
    const s = (a, b) => ({ start: parseDate(a), end: parseDate(b) });
    const pairs = [
      ["2026-03-20", "2026-03-29", "2026-03-30"],
      ["2026-03-20", "2026-03-30", "2026-03-30"],
      ["2026-03-01", "2026-03-08", "2026-03-09"],
      ["2026-09-20", "2026-09-27", "2026-09-28"],
      ["2026-10-20", "2026-10-25", "2026-10-26"],
      ["2026-04-01", "2026-04-05", "2026-04-06"],
      ["2026-09-20", "2026-09-28", "2026-09-28"],
    ];
    const one = pairs.map(([a, b, c]) => l.conflictOf(s(a, b), s(c, c)));
    const spans = new Map(pairs.flatMap(([a, b, c], i) =>
      [["p" + i, s(a, b)], ["s" + i, s(c, c)]]));
    const ls = pairs.map((_, i) => ({ from: "p" + i, to: "s" + i }));
    const many = [...l.conflictsOf(ls, spans)].map((k) => k.slice(-2)).sort();
    console.log(JSON.stringify({ zone: getLocalTimeZone(), one, many }));
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
    "gives the same conflicts under TZ=%s",
    (tz) => {
      const { zone, ...result } = runIn(tz);
      expect(zone).toBe(tz);
      expect(result).toEqual({
        one: [false, true, false, false, false, false, true],
        many: ["s1", "s6"],
      });
    },
    20_000,
  );
});
