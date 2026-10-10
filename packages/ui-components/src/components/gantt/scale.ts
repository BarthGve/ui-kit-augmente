import {
  CalendarDate,
  DateFormatter,
  endOfMonth,
  endOfWeek,
  getLocalTimeZone,
  parseDate,
  startOfMonth,
  startOfWeek,
  today as localToday,
} from "@internationalized/date";
import type { DateInput, GanttTask, GanttZoom } from "./types";

const MS_PER_DAY = 86_400_000;

// ponytail: pixel mirror of the day-width tokens (2.5rem / 0.75rem / 0.25rem at
// 16px), kept for the pixel-to-date inverse (s23); keep both in sync.
const DAY_WIDTH: Record<GanttZoom, number> = { day: 40, week: 12, month: 4 };

export type Tick = { date: CalendarDate; index: number };
export type Position = { start: number; span: number };

export const toDay = (input?: DateInput): CalendarDate | null => {
  if (input instanceof CalendarDate) return input;
  if (typeof input !== "string") return null;
  try {
    return parseDate(input);
  } catch {
    return null;
  }
};

/** Whole days from `origin` to `date`; UTC has no DST, so it is exact. */
export const dayIndex = (origin: CalendarDate, date: CalendarDate): number =>
  (date.toDate("UTC").getTime() - origin.toDate("UTC").getTime()) / MS_PER_DAY;

/** The task's valid inclusive span, or null (missing, malformed or reversed). */
const spanOf = (task: GanttTask) => {
  const start = toDay(task.start);
  const end = toDay(task.end);
  if (!start || !end || end.compare(start) < 0) return null;
  return { start, end };
};

export const buildScale = ({
  tasks,
  zoom,
  locale,
  today = localToday(getLocalTimeZone()),
}: {
  tasks: GanttTask[];
  zoom: GanttZoom;
  locale: string;
  today?: CalendarDate;
}) => {
  const spans = tasks.map(spanOf).filter((s) => s !== null);
  let first = spans.length ? spans[0].start : today;
  let last = spans.length ? spans[0].end : today;
  for (const { start, end } of spans) {
    if (start.compare(first) < 0) first = start;
    if (end.compare(last) > 0) last = end;
  }

  const origin = startOfWeek(first, locale);
  const end = zoom === "month" ? endOfMonth(last) : endOfWeek(last, locale);
  const days = dayIndex(origin, end) + 1;

  const ticks: Tick[] = [];
  const step =
    zoom === "day"
      ? { days: 1 }
      : zoom === "week"
        ? { weeks: 1 }
        : { months: 1 };
  let date = zoom === "month" ? startOfMonth(origin) : origin;
  if (date.compare(origin) < 0) date = date.add(step);
  for (; date.compare(end) <= 0; date = date.add(step)) {
    ticks.push({ date, index: dayIndex(origin, date) });
  }

  const todayIndex = dayIndex(origin, today);

  return {
    origin,
    end,
    days,
    dayWidth: DAY_WIDTH[zoom],
    ticks,
    todayOffset: todayIndex >= 0 && todayIndex < days ? todayIndex : null,
    positionOf: (task: GanttTask): Position | null => {
      const span = spanOf(task);
      if (!span) return null;
      return {
        start: dayIndex(origin, span.start),
        span: dayIndex(span.start, span.end) + 1,
      };
    },
  };
};

export type GanttScale = ReturnType<typeof buildScale>;

/** Long, localised start and end labels of a task, or null without a valid span. */
export const formatDates = (task: GanttTask, locale: string) => {
  const span = spanOf(task);
  if (!span) return null;
  const formatter = new DateFormatter(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  });
  return {
    start: formatter.format(span.start.toDate("UTC")),
    end: formatter.format(span.end.toDate("UTC")),
  };
};
