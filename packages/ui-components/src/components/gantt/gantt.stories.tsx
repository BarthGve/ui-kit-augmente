import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CalendarDate } from "@internationalized/date";
import { Gantt } from "./index";
import type { GanttTask, GanttZoom } from "./types";

const TASKS: GanttTask[] = [
  {
    id: "brief",
    name: "Write the brief",
    start: "2026-03-02",
    end: "2026-03-13",
  },
  {
    id: "build",
    name: "Build the prototype",
    start: "2026-03-09",
    end: "2026-04-03",
  },
  { id: "review", name: "Review", start: "2026-03-25", end: "2026-03-25" },
  { id: "plan", name: "Plan the launch" },
  { id: "release", name: "Release", start: "2026-04-06", end: "2026-04-10" },
];

// 100 tasks over 18 months, staggered.
const origin = new CalendarDate(2026, 1, 5);
const LONG: GanttTask[] = Array.from({ length: 100 }, (_, i) => {
  const start = origin.add({ days: i * 5 });
  return {
    id: `task-${i}`,
    name: `Task ${i + 1}`,
    start,
    end: start.add({ days: 7 + (i % 4) * 7 }),
  };
});

const meta = {
  title: "Components/Gantt",
  component: Gantt,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ height: "24rem" }}>
        <Story />
      </div>
    ),
  ],
  args: { "aria-label": "Project schedule", tasks: TASKS, today: "2026-03-23" },
} satisfies Meta<typeof Gantt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutDates: Story = {
  args: {
    tasks: [
      { id: "a", name: "Dated", start: "2026-03-02", end: "2026-03-06" },
      { id: "b", name: "No dates" },
      { id: "c", name: "Only a start", start: "2026-03-04" },
      {
        id: "d",
        name: "End before start",
        start: "2026-03-10",
        end: "2026-03-02",
      },
    ],
  },
};

export const OneDayTasks: Story = {
  args: {
    defaultZoom: "day",
    tasks: [
      { id: "a", name: "Kick-off", start: "2026-03-23", end: "2026-03-23" },
      { id: "b", name: "Demo", start: "2026-03-26", end: "2026-03-26" },
      {
        id: "c",
        name: "Retrospective",
        start: "2026-03-27",
        end: "2026-03-27",
      },
    ],
  },
};

export const LongSchedule: Story = {
  args: { tasks: LONG, defaultZoom: "month", today: "2026-09-01" },
};

export const Empty: Story = {
  args: { tasks: [] },
};

// Controlled: the story owns the zoom and shows it.
export const Zoomed: Story = {
  render: function Render(args) {
    const [zoom, setZoom] = useState<GanttZoom>("day");
    return <Gantt {...args} zoom={zoom} onZoomChange={setZoom} />;
  },
};

// 30 tasks over five months in day zoom: both axes scroll.
export const WideSchedule: Story = {
  args: { tasks: LONG.slice(0, 30), defaultZoom: "day" },
};
