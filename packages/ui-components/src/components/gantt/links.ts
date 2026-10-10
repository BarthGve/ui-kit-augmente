import type { CalendarDate } from "@internationalized/date";
import type { GanttScale, Position } from "./scale";

/**
 * Pure dependency rules of the Gantt (s24), finish-to-start only: `to` starts
 * after `from` ends. No React, no instant, no time zone; inputs are never
 * mutated, and every loop is bounded by the (capped) link and task counts.
 */
export type LinkPair = { from: string; to: string };

/** Links drawn and listed; the surplus is ignored (caller data stays bounded). */
export const MAX_LINKS = 1000;

/** Identity of a link: the ordered pair, collision-free (`a`+`bb` vs `ab`+`b`). */
export const linkKey = ({ from, to }: LinkPair) =>
  `${from.length}:${from}${to}`;

/**
 * Valid links in input order: known ids only, no self-link, no duplicate
 * (first wins; the reverse pair is another link), at most `MAX_LINKS`.
 */
export const normalizeLinks = (
  pairs: readonly LinkPair[] | undefined,
  ids: ReadonlySet<string>,
): LinkPair[] => {
  const seen = new Set<string>();
  const out: LinkPair[] = [];
  for (const pair of pairs ?? []) {
    if (out.length >= MAX_LINKS) break;
    if (!pair || typeof pair !== "object") continue;
    const { from, to } = pair;
    if (from === to || !ids.has(from) || !ids.has(to)) continue;
    const key = linkKey(pair);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ from, to });
  }
  return out;
};

/**
 * True when `target` can be reached from `start` along the links (a node
 * reaches itself). Iterative DFS with a visited set: O(V + E), no recursion,
 * and terminates on cyclic data. The step budget (V + E + 1) is a backstop: if
 * it ever runs out the answer is `true`, so a caller refuses rather than hangs.
 */
export const reaches = (
  links: readonly LinkPair[],
  start: string,
  target: string,
): boolean => {
  const next = new Map<string, string[]>();
  for (const { from, to } of links) {
    const list = next.get(from);
    if (list) list.push(to);
    else next.set(from, [to]);
    if (!next.has(to)) next.set(to, []);
  }
  let budget = next.size + links.length + 1;
  const visited = new Set([start]);
  const stack = [start];
  while (stack.length) {
    if (--budget < 0) return true;
    const node = stack.pop()!;
    if (node === target) return true;
    for (const to of next.get(node) ?? []) {
      if (--budget < 0) return true;
      if (visited.has(to)) continue;
      visited.add(to);
      stack.push(to);
    }
  }
  return false;
};

export type LinkRefusal = "self" | "exists" | "limit" | "no_dates" | "cycle";

/**
 * Why the user cannot add `from` to `to`, or null. Checked in this order:
 * `exists` comes first so that an existing link can still be removed after
 * a task lost its dates or the list is full; `limit` refuses a link that
 * `normalizeLinks` would drop (`links` is the normalised list).
 */
export const checkLink = (
  links: readonly LinkPair[],
  from: string,
  to: string,
  hasBar: (id: string) => boolean,
): LinkRefusal | null => {
  if (from === to) return "self";
  if (links.some((l) => l.from === from && l.to === to)) return "exists";
  if (links.length >= MAX_LINKS) return "limit";
  if (!hasBar(from) || !hasBar(to)) return "no_dates";
  if (reaches(links, to, from)) return "cycle";
  return null;
};

export type LinkSpan = { start: CalendarDate; end: CalendarDate };

/** Finish-to-start broken: the successor starts on or before the last day. */
export const conflictOf = (pred: LinkSpan, succ: LinkSpan) =>
  succ.start.compare(pred.end) <= 0;

const valid = (span: LinkSpan | null | undefined): span is LinkSpan =>
  !!span && span.end.compare(span.start) >= 0;

/** Keys of the links in conflict; a task without a valid span has none. */
export const conflictsOf = (
  links: readonly LinkPair[],
  spans: ReadonlyMap<string, LinkSpan | null | undefined>,
): Set<string> => {
  const out = new Set<string>();
  for (const l of links) {
    const pred = spans.get(l.from);
    const succ = spans.get(l.to);
    if (valid(pred) && valid(succ) && conflictOf(pred, succ))
      out.add(linkKey(l));
  }
  return out;
};

/**
 * A route corner: x = `day` days + `gutters` link gutters + `leads` link
 * leads; y = `row` row pitches, plus half a row height when `centre`.
 */
export type RoutePoint = {
  day: number;
  gutters: number;
  leads: number;
  row: number;
  centre: boolean;
};
export type RouteSegment = [RoutePoint, RoutePoint];

// ponytail: px mirrors of the `link-gutter` (2.75rem) and `link-lead`
// (0.75rem) tokens at a 16px root, used only to choose a route; at another
// root the choice may differ, the line still lands on the bars (CSS calc).
const LINK_GUTTER = 44;
const LINK_LEAD = 12;

const point = (
  day: number,
  row: number,
  { gutters = 0, leads = 0, centre = true } = {},
): RoutePoint => ({ day, gutters, leads, row, centre });

/**
 * Orthogonal route from the end of the predecessor's bar to the start of the
 * successor's, at most five segments. Forward when the gap clears a gutter
 * and a lead; otherwise a U along the line between the two rows (below the
 * predecessor row when the successor is below, above it otherwise). A
 * zero-length segment (successor on the predecessor's row) is left out.
 */
export const routeOf = (
  pred: Position & { row: number },
  succ: Position & { row: number },
  { dayWidth }: Pick<GanttScale, "dayWidth">,
): RouteSegment[] => {
  const end = pred.start + pred.span;
  const corners =
    (succ.start - end) * dayWidth >= LINK_GUTTER + LINK_LEAD
      ? [
          point(end, pred.row),
          point(succ.start, pred.row, { leads: -1 }),
          point(succ.start, succ.row, { leads: -1 }),
          point(succ.start, succ.row),
        ]
      : (() => {
          const line = succ.row > pred.row ? pred.row + 1 : pred.row;
          return [
            point(end, pred.row),
            point(end, pred.row, { gutters: 1 }),
            point(end, line, { gutters: 1, centre: false }),
            point(succ.start, line, { leads: -1, centre: false }),
            point(succ.start, succ.row, { leads: -1 }),
            point(succ.start, succ.row),
          ];
        })();
  return corners
    .slice(1)
    .map((p, i): RouteSegment => [corners[i], p])
    .filter(
      ([a, b]) =>
        a.row !== b.row ||
        a.centre !== b.centre ||
        a.day !== b.day ||
        a.gutters !== b.gutters ||
        a.leads !== b.leads,
    );
};

/** Per task id: the tasks it starts after and the tasks that require it. */
export const neighboursOf = (links: readonly LinkPair[]) => {
  const out = new Map<string, { after: string[]; before: string[] }>();
  const entry = (id: string) => {
    let e = out.get(id);
    if (!e) out.set(id, (e = { after: [], before: [] }));
    return e;
  };
  for (const { from, to } of links) {
    entry(from).before.push(to);
    entry(to).after.push(from);
  }
  return out;
};
