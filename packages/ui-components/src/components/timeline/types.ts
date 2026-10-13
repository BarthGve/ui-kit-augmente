import { HTMLAttributes, ReactNode } from "react";

/** Progress of an event; shown by marker shape and a hidden label. */
export type TimelineState = "done" | "current" | "upcoming";

export type TimelineEvent = {
  id: string;
  /** A `Date`, or an ISO string; a date-only string is read as a UTC day. */
  date: Date | string;
  title: ReactNode;
  content?: ReactNode;
  /** Omitted: a neutral marker and no state label. */
  state?: TimelineState;
};

export type TimelineProps = Omit<
  HTMLAttributes<HTMLOListElement>,
  "children" | "role"
> & {
  /** Rendered in the given order, never sorted. */
  events: TimelineEvent[];
  /** `horizontal` lays events on one row inside a focusable scroll region. */
  orientation?: "vertical" | "horizontal";
  /** Options of `Intl.DateTimeFormat`; default `{ dateStyle: "medium" }`. */
  dateFormat?: Intl.DateTimeFormatOptions;
};
