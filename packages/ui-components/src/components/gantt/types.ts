import type { CalendarDate } from "@internationalized/date";
import type { HTMLAttributes } from "react";

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

/** Dates of a task after an edit, as ISO calendar days (`"YYYY-MM-DD"`). */
export type GanttTaskChange = { start: string; end: string };

export type GanttProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "className" | "aria-label"
> & {
  /** Rows, in display order. Never mutated. */
  tasks: GanttTask[];
  /** Axis scale, controlled. Leave undefined for the uncontrolled mode. */
  zoom?: GanttZoom;
  /** Initial axis scale in the uncontrolled mode. Default: `"week"`. */
  defaultZoom?: GanttZoom;
  /** Called with the zoom requested from the zoom control. */
  onZoomChange?: (zoom: GanttZoom) => void;
  /** Day of the today marker. Default: today in the local time zone. */
  today?: DateInput;
  /**
   * Lets the user move and resize task bars, with the pointer or from a
   * focused row with the keyboard. Default: `false` (read-only, exactly as
   * without the prop). Ignored in a right-to-left (`dir="rtl"`) container.
   */
  editable?: boolean;
  /**
   * Called once when an edit ends with new dates. `tasks` is never mutated:
   * apply the change to your data, or the bar goes back to its dates.
   */
  onTaskChange?: (id: string, change: GanttTaskChange) => void;
  /** Names the grid (required: the chart has no visible title). */
  "aria-label": string;
  className?: string;
};
