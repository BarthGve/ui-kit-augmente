import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_DEPENDENCIES, DEMO_TASKS, DEMO_TODAY } from "./demo";
import {
  checkLink,
  conflictsOf,
  type LinkPair,
  type LinkSpan,
  normalizeLinks,
} from "./links";
import { buildScale, dayIndex, toDay } from "./scale";

// The demonstration data (s24 AC6): the `Dependencies` story and the CT smoke
// both load it, so these invariants are what a hand-check can rely on.

const ids = new Set(DEMO_TASKS.map((t) => t.id));
const spans = new Map<string, LinkSpan | null>(
  DEMO_TASKS.map((t) => {
    const start = toDay(t.start);
    const end = toDay(t.end);
    return [
      t.id,
      start && end && end.compare(start) >= 0 ? { start, end } : null,
    ];
  }),
);
const hasBar = (id: string) => !!spans.get(id);

describe("demonstration data", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it("does not depend on the clock", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2020-01-15T12:00:00Z"));
    vi.resetModules();
    const early = await import("./demo");
    vi.setSystemTime(new Date("2031-09-03T23:30:00Z"));
    vi.resetModules();
    const late = await import("./demo");
    expect(late.DEMO_TASKS).toEqual(early.DEMO_TASKS);
    expect(late.DEMO_DEPENDENCIES).toEqual(early.DEMO_DEPENDENCIES);
    expect(late.DEMO_TODAY).toBe(early.DEMO_TODAY);
    expect(toDay(DEMO_TODAY)).not.toBeNull();
  });

  it("holds only valid links", () => {
    expect(normalizeLinks(DEMO_DEPENDENCIES, ids)).toEqual(DEMO_DEPENDENCIES);
  });

  it("has a link already in conflict", () => {
    expect(conflictsOf(DEMO_DEPENDENCIES, spans).size).toBeGreaterThan(0);
  });

  it("has a chain of at least five linked tasks", () => {
    const next = new Map<string, string[]>();
    for (const { from, to } of DEMO_DEPENDENCIES)
      next.set(from, [...(next.get(from) ?? []), to]);
    // Longest path in tasks (the links are acyclic, checked below).
    const depth = (id: string): number =>
      1 + Math.max(0, ...(next.get(id) ?? []).map(depth));
    expect(Math.max(...DEMO_TASKS.map((t) => depth(t.id)))).toBeGreaterThan(4);
  });

  it("has a diamond: one predecessor, two successors, one join", () => {
    const has = (from: string, to: string) =>
      DEMO_DEPENDENCIES.some((l) => l.from === from && l.to === to);
    const diamond = DEMO_DEPENDENCIES.some((ab) =>
      DEMO_DEPENDENCIES.some(
        (ac) =>
          ac.from === ab.from &&
          ac.to !== ab.to &&
          DEMO_DEPENDENCIES.some(
            (bd) => bd.from === ab.to && bd.to !== ab.from && has(ac.to, bd.to),
          ),
      ),
    );
    expect(diamond).toBe(true);
  });

  it("has a task without dates", () => {
    expect(DEMO_TASKS.some((t) => !hasBar(t.id))).toBe(true);
  });

  it("has no loop, and a link the user tries is refused as one", () => {
    const pairs: LinkPair[] = DEMO_TASKS.flatMap((a) =>
      DEMO_TASKS.map((b) => ({ from: a.id, to: b.id })),
    );
    const refusals = pairs.map((p) =>
      checkLink(DEMO_DEPENDENCIES, p.from, p.to, hasBar),
    );
    expect(refusals).toContain("cycle");
    // Every existing link is acyclic: removing it, adding it back is allowed.
    for (const link of DEMO_DEPENDENCIES) {
      const rest = DEMO_DEPENDENCIES.filter((l) => l !== link);
      if (hasBar(link.from) && hasBar(link.to))
        expect(checkLink(rest, link.from, link.to, hasBar)).toBeNull();
    }
  });

  // The axis ends with the week of the latest end and does not grow while
  // dragging (s23): a one-day milestone far right gives every other task
  // three weeks of room at week zoom, whatever the locale's week start.
  it.each(["en-US", "fr-FR", "de-DE", "es-ES", "nl-NL", "ar-EG"])(
    "leaves three weeks of slack at week zoom (%s)",
    (locale) => {
      const scale = buildScale({
        tasks: DEMO_TASKS,
        zoom: "week",
        locale,
        today: toDay(DEMO_TODAY)!,
      });
      const dated = [...spans.values()]
        .filter((s): s is LinkSpan => !!s)
        .sort((a, b) => a.end.compare(b.end));
      const milestone = dated.at(-1)!;
      expect(milestone.end.compare(milestone.start)).toBe(0);
      expect(dayIndex(dated.at(-2)!.end, scale.end)).toBeGreaterThanOrEqual(21);
    },
  );
});
