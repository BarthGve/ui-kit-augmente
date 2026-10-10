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
  /** Names the grid (required: the chart has no visible title). */
  "aria-label": string;
  className?: string;
};
