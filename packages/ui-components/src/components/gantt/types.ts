import type { CalendarDate } from "@internationalized/date";

/** A calendar day: ISO `"YYYY-MM-DD"` or a `CalendarDate`. Never an instant. */
export type DateInput = string | CalendarDate;

export type GanttZoom = "day" | "week" | "month";

export interface GanttTask {
  /** Stable identifier. */
  id: string;
  name: string;
  start?: DateInput;
  /** Inclusive: a one-day task has `start` equal to `end`. */
  end?: DateInput;
}
