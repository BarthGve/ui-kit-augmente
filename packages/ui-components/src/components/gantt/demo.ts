import type { GanttDependency, GanttTask } from "./types";

/**
 * Demonstration data of the `Dependencies` story, also mounted by the CT smoke
 * (s24 AC6). Not exported from the library. Fixed dates, no clock.
 *
 * A five-link chain (brief to launch), a diamond (design, API and interface,
 * integration), a conflict already there (the interface starts on the day the
 * design ends), a task without dates (its link is listed, not drawn), and a
 * one-day retrospective far right: the axis does not grow while dragging, so
 * it gives every other task three weeks of room at week zoom.
 */
export const DEMO_TODAY = "2026-03-23";

export const DEMO_TASKS: GanttTask[] = [
  {
    id: "brief",
    name: "Write the brief",
    start: "2026-03-02",
    end: "2026-03-06",
  },
  {
    id: "design",
    name: "Design the service",
    start: "2026-03-09",
    end: "2026-03-20",
  },
  { id: "api", name: "Build the API", start: "2026-03-23", end: "2026-04-10" },
  {
    id: "ui",
    name: "Build the interface",
    start: "2026-03-20",
    end: "2026-04-17",
  },
  {
    id: "docs",
    name: "Write the help pages",
    start: "2026-04-13",
    end: "2026-05-08",
  },
  {
    id: "integrate",
    name: "Integrate",
    start: "2026-04-20",
    end: "2026-04-30",
  },
  {
    id: "test",
    name: "Test with users",
    start: "2026-05-04",
    end: "2026-05-15",
  },
  { id: "training", name: "Plan the training" },
  { id: "launch", name: "Launch", start: "2026-05-18", end: "2026-05-22" },
  {
    id: "retro",
    name: "Retrospective",
    start: "2026-06-19",
    end: "2026-06-19",
  },
];

export const DEMO_DEPENDENCIES: GanttDependency[] = [
  { from: "brief", to: "design" },
  { from: "design", to: "api" },
  { from: "design", to: "ui" },
  { from: "api", to: "integrate" },
  { from: "ui", to: "integrate" },
  { from: "integrate", to: "test" },
  { from: "test", to: "launch" },
  { from: "training", to: "launch" },
  { from: "launch", to: "retro" },
];
