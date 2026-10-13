import type { CalendarDate } from "@internationalized/date";
import { dayIndex, MAX_DAYS, type Axis } from "./scale";
import type { GanttZoom } from "./types";

/**
 * Pure edit rules of the Gantt (s23), all on `CalendarDate`: no instant, no
 * time zone. Every result is computed from the span at the start of the edit,
 * never from a previous preview (month addition clamps and is not reversible).
 */
export type GanttUnitSpan = { start: CalendarDate; end: CalendarDate };
export type GanttEditMode = "move" | "resize-start" | "resize-end";

/** `n` zoom units after `date`: days, 7-day weeks, or clamped calendar months. */
export const addUnits = (date: CalendarDate, zoom: GanttZoom, n: number) =>
  zoom === "day"
    ? date.add({ days: n })
    : zoom === "week"
      ? date.add({ weeks: n })
      : date.add({ months: n });

/** Moves the start by `n` units and keeps the length in days. */
export const moveSpan = (
  span: GanttUnitSpan,
  zoom: GanttZoom,
  n: number,
): GanttUnitSpan => {
  const start = addUnits(span.start, zoom, n);
  return { start, end: start.add({ days: dayIndex(span.start, span.end) }) };
};

/** Moves the end by `n` units, never before the start (`clamped` says so). */
export const resizeEnd = (span: GanttUnitSpan, zoom: GanttZoom, n: number) => {
  const end = addUnits(span.end, zoom, n);
  const clamped = end.compare(span.start) < 0;
  return { start: span.start, end: clamped ? span.start : end, clamped };
};

/** Moves the start by `n` units, never after the end (`clamped` says so). */
export const resizeStart = (
  span: GanttUnitSpan,
  zoom: GanttZoom,
  n: number,
) => {
  const start = addUnits(span.start, zoom, n);
  const clamped = start.compare(span.end) > 0;
  return { start: clamped ? span.end : start, end: span.end, clamped };
};

/** Half away from zero, and never `-0`, so both directions snap alike. */
const roundHalfAway = (x: number) =>
  Math.sign(x) * Math.round(Math.abs(x)) || 0;

const AVERAGE_MONTH_DAYS = 30.4375;

/**
 * Units of `zoom` nearest to a pointer offset of `dx` pixels, from the date
 * being edited (`from`: the start for a move or a start resize, the end for
 * an end resize). Months are matched by their real length; a tie goes away
 * from zero, as in day and week zoom. The offset is capped at 2 x MAX_DAYS
 * days (more than any axis), so absurd geometry cannot stall the month search.
 */
export const unitsFromPixels = (
  dx: number,
  pxPerDay: number,
  zoom: GanttZoom,
  from: CalendarDate,
): number => {
  const raw = dx / pxPerDay;
  if (!Number.isFinite(raw)) return 0;
  const days = Math.max(-2 * MAX_DAYS, Math.min(2 * MAX_DAYS, raw));
  if (zoom === "day") return roundHalfAway(days);
  if (zoom === "week") return roundHalfAway(days / 7);
  const n0 = roundHalfAway(days / AVERAGE_MONTH_DAYS);
  let best = n0;
  let bestGap = Infinity;
  for (const n of [n0 - 1, n0, n0 + 1]) {
    const gap = Math.abs(dayIndex(from, addUnits(from, "month", n)) - days);
    if (gap < bestGap || (gap === bestGap && Math.abs(n) > Math.abs(best))) {
      best = n;
      bestGap = gap;
    }
  }
  return best || 0;
};

const EDIT: Record<GanttEditMode, typeof moveSpan> = {
  move: moveSpan,
  "resize-start": (span, zoom, n) => resizeStart(span, zoom, n),
  "resize-end": (span, zoom, n) => resizeEnd(span, zoom, n),
};

/**
 * `n` limited so that the edited span stays on the axis (start >= origin,
 * end <= axis end). A span already outside the axis (clipped by MAX_DAYS)
 * does not move at all. `n` is a whole number of units.
 */
export const clampToAxis = (
  span: GanttUnitSpan,
  axis: Axis,
  n: number,
  zoom: GanttZoom,
  mode: GanttEditMode,
): number => {
  const inside = (s: GanttUnitSpan) =>
    s.start.compare(axis.origin) >= 0 && s.end.compare(axis.end) <= 0;
  if (!inside(span)) return 0;
  // Every unit is at least a day, so the axis length bounds the search.
  const sign = Math.sign(n);
  let lo = 0;
  let hi = Math.min(Math.abs(n), dayIndex(axis.origin, axis.end));
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (inside(EDIT[mode](span, zoom, sign * mid))) lo = mid;
    else hi = mid - 1;
  }
  return sign * lo || 0;
};

/** The `onTaskChange` payload: ISO calendar days. */
export const toChange = ({ start, end }: GanttUnitSpan) => ({
  start: start.toString(),
  end: end.toString(),
});

/** True when the edit changed neither date. */
export const isNoop = (original: GanttUnitSpan, next: GanttUnitSpan) =>
  original.start.compare(next.start) === 0 &&
  original.end.compare(next.end) === 0;
