import { readFileSync } from "fs";
import { resolve } from "path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultTokenRefs } from "@gouvfr-lasuite/ui-tokens";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { Gantt, GanttProps, GanttTask } from "./index";
import { MAX_DAYS } from "./scale";
import { tokens } from "./tokens";

// Vitest stubs stylesheets, so the sources are read from disk.
const read = (path: string) => readFileSync(resolve(__dirname, path), "utf8");

const TASKS: GanttTask[] = [
  { id: "a", name: "Write the brief", start: "2026-03-02", end: "2026-03-13" },
  { id: "b", name: "Build", start: "2026-03-09", end: "2026-04-03" },
  { id: "c", name: "Review", start: "2026-03-25", end: "2026-03-25" },
  { id: "d", name: "Plan the launch" },
  { id: "e", name: "Release", start: "2026-04-06", end: "2026-04-10" },
];

const renderGantt = (props: Partial<GanttProps> = {}, locale = "en-US") =>
  render(
    <CunninghamProvider currentLocale={locale}>
      <Gantt
        aria-label="Project schedule"
        tasks={TASKS}
        today="2026-03-23"
        {...props}
      />
    </CunninghamProvider>,
  );

const taskRow = (name: string) =>
  screen
    .getAllByRole("rowheader")
    .find((cell) => cell.textContent?.startsWith(name))!
    .closest<HTMLElement>('[role="row"]')!;
const bar = (row: HTMLElement) =>
  row.querySelector<HTMLElement>(".c__gantt__bar");
const cssVar = (el: HTMLElement | null, name: string) =>
  el?.style.getPropertyValue(name);

describe("Gantt structure (AC1)", () => {
  it("renders a grid with a header row and one row per task, indexed", () => {
    renderGantt();
    const grid = screen.getByRole("grid", { name: "Project schedule" });
    expect(grid).toHaveAttribute("aria-rowcount", String(TASKS.length + 1));
    const rows = within(grid).getAllByRole("row");
    expect(rows).toHaveLength(TASKS.length + 1);
    rows.forEach((row, i) =>
      expect(row).toHaveAttribute("aria-rowindex", String(i + 1)),
    );
    expect(within(rows[0]).getAllByRole("columnheader")).toHaveLength(2);
  });

  it("keeps the array order, the task name in a rowheader", () => {
    renderGantt();
    const [, ...rows] = screen.getAllByRole("row");
    rows.forEach((row, i) =>
      expect(within(row).getByRole("rowheader")).toHaveTextContent(
        TASKS[i].name,
      ),
    );
  });

  it("positions and sizes each bar in days from the scale origin, end inclusive", () => {
    // en-US weeks start on Sunday: the origin is 2026-03-01.
    renderGantt();
    for (const [name, start, span] of [
      ["Write the brief", "1", "12"],
      ["Build", "8", "26"],
      ["Review", "24", "1"],
    ]) {
      const b = bar(taskRow(name));
      expect(cssVar(b, "--gantt-start")).toBe(start);
      expect(cssVar(b, "--gantt-span")).toBe(span);
      expect(b).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("never mutates the tasks", () => {
    const tasks = Object.freeze(
      TASKS.map((task) => Object.freeze({ ...task })),
    ) as GanttTask[];
    const before = JSON.stringify(tasks);
    renderGantt({ tasks });
    expect(JSON.stringify(tasks)).toBe(before);
  });
});

describe("Gantt tasks without a valid span (AC3)", () => {
  it("renders the row and name with 'No dates' and no bar", () => {
    renderGantt({
      tasks: [
        { id: "n", name: "Nothing" },
        { id: "s", name: "Only start", start: "2026-03-02" },
        { id: "e", name: "Only end", end: "2026-03-02" },
        {
          id: "r",
          name: "Reversed",
          start: "2026-03-10",
          end: "2026-03-02",
        },
        { id: "m", name: "Malformed", start: "2026-02-30", end: "2026-03-02" },
      ],
    });
    for (const name of [
      "Nothing",
      "Only start",
      "Only end",
      "Reversed",
      "Malformed",
    ]) {
      const row = taskRow(name);
      expect(within(row).getByRole("rowheader")).toHaveTextContent(
        `${name}No dates`,
      );
      expect(bar(row)).toBeNull();
    }
  });
});

describe("Gantt today marker (AC3)", () => {
  it("marks today's column with a line and a 'Today' label", () => {
    const { container } = renderGantt();
    const line = container.querySelector<HTMLElement>(".c__gantt__today");
    expect(cssVar(line, "--gantt-start")).toBe("22");
    expect(line).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("draws no marker when today is outside the axis", () => {
    const { container } = renderGantt({ today: "2025-01-01" });
    expect(container.querySelector(".c__gantt__today")).toBeNull();
    expect(screen.queryByText("Today")).toBeNull();
  });
});

describe("Gantt axis", () => {
  it("week zoom: months above, week starts below", () => {
    renderGantt();
    const axis = screen.getAllByRole("row")[0];
    expect(within(axis).getByText("March 2026")).toBeInTheDocument();
    expect(within(axis).getByText("April 2026")).toBeInTheDocument();
    // Week starts of March 2026 in en-US: 1, 8, 15, 22, 29.
    for (const day of ["1", "8", "15", "22", "29"]) {
      expect(within(axis).getAllByText(day).length).toBeGreaterThan(0);
    }
    expect(within(axis).queryByText("2")).toBeNull();
  });

  it("month zoom: years above, months below", () => {
    renderGantt({ zoom: "month" });
    const axis = screen.getAllByRole("row")[0];
    expect(within(axis).getByText("2026")).toBeInTheDocument();
    expect(within(axis).getByText("Apr")).toBeInTheDocument();
  });
});

describe("Gantt zoom (AC2)", () => {
  const zoomButton = (name: string) => screen.getByRole("button", { name });
  const pressed = () =>
    within(screen.getByRole("group", { name: "Zoom level" }))
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-pressed") === "true")
      .map((b) => b.textContent);
  const axisTicks = (container: HTMLElement) =>
    container.querySelectorAll(
      ".c__gantt__axis-tier[aria-hidden] .c__gantt__axis-label",
    ).length;

  it("offers Day, Week and Month in a labelled group, Week pressed by default", () => {
    renderGantt();
    const group = screen.getByRole("group", { name: "Zoom level" });
    expect(
      within(group)
        .getAllByRole("button")
        .map((b) => [b.textContent, b.getAttribute("aria-pressed")]),
    ).toEqual([
      ["Day", "false"],
      ["Week", "true"],
      ["Month", "false"],
    ]);
  });

  it("uncontrolled: a click switches the scale and reports the zoom", async () => {
    const user = userEvent.setup();
    const onZoomChange = vi.fn();
    const { container } = renderGantt({ onZoomChange });
    // Week zoom, en-US, 2026-03-01 to 2026-04-11: 6 week ticks.
    expect(axisTicks(container)).toBe(6);
    await user.click(zoomButton("Day"));
    expect(pressed()).toEqual(["Day"]);
    expect(onZoomChange).toHaveBeenCalledWith("day");
    // Day zoom: one tick per day of the range.
    expect(axisTicks(container)).toBe(42);
    expect(screen.getByRole("grid").closest("[data-zoom]")).toHaveAttribute(
      "data-zoom",
      "day",
    );
  });

  it("uncontrolled: starts at defaultZoom", () => {
    renderGantt({ defaultZoom: "month" });
    expect(pressed()).toEqual(["Month"]);
  });

  it("controlled: clicks only request a zoom, the prop decides", async () => {
    const user = userEvent.setup();
    const onZoomChange = vi.fn();
    const { container, rerender } = renderGantt({
      zoom: "month",
      onZoomChange,
    });
    await user.click(zoomButton("Day"));
    expect(onZoomChange).toHaveBeenCalledWith("day");
    expect(pressed()).toEqual(["Month"]);
    expect(screen.getByRole("grid").closest("[data-zoom]")).toHaveAttribute(
      "data-zoom",
      "month",
    );
    rerender(
      <CunninghamProvider currentLocale="en-US">
        <Gantt
          aria-label="Project schedule"
          tasks={TASKS}
          today="2026-03-23"
          zoom="day"
          onZoomChange={onZoomChange}
        />
      </CunninghamProvider>,
    );
    expect(pressed()).toEqual(["Day"]);
    expect(axisTicks(container)).toBe(42);
  });

  it("controlled without a callback: follows the prop, ignores clicks", async () => {
    const user = userEvent.setup();
    const { rerender } = renderGantt({ zoom: "month" });
    await user.click(zoomButton("Day"));
    expect(pressed()).toEqual(["Month"]);
    rerender(
      <CunninghamProvider currentLocale="en-US">
        <Gantt
          aria-label="Project schedule"
          tasks={TASKS}
          today="2026-03-23"
          zoom="week"
        />
      </CunninghamProvider>,
    );
    expect(pressed()).toEqual(["Week"]);
  });

  it("native buttons: Tab reaches them, Enter and Space switch", async () => {
    const user = userEvent.setup();
    renderGantt();
    await user.tab();
    expect(zoomButton("Day")).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(pressed()).toEqual(["Day"]);
    await user.tab();
    expect(zoomButton("Week")).toHaveFocus();
    await user.keyboard(" ");
    expect(pressed()).toEqual(["Week"]);
  });

  it("labels the control in the active locale", () => {
    renderGantt({}, "fr-FR");
    const group = screen.getByRole("group", { name: "Niveau de zoom" });
    expect(
      within(group)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(["Jour", "Semaine", "Mois"]);
  });
});

describe("Gantt tab stop", () => {
  it("is a single tab stop on the first task row, after the zoom buttons; the next Tab leaves the grid", async () => {
    const user = userEvent.setup();
    render(
      <CunninghamProvider>
        <button>Before</button>
        <Gantt aria-label="Plan" tasks={TASKS} today="2026-03-23" />
        <button>After</button>
      </CunninghamProvider>,
    );
    const [, ...rows] = screen.getAllByRole("row");
    expect(rows[0]).toHaveAttribute("tabindex", "0");
    rows
      .slice(1)
      .forEach((row) => expect(row).toHaveAttribute("tabindex", "-1"));
    screen.getByRole("button", { name: "Before" }).focus();
    // Day, Week, Month, then the first row (DOM order = visual order).
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(rows[0]).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });
});

describe("Gantt keyboard (AC4)", () => {
  // jsdom has no layout: scrolling the bar into view is measured in the CT.
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  const taskRows = () => screen.getAllByRole("row").slice(1);
  const tabStops = () =>
    taskRows().filter((row) => row.getAttribute("tabindex") === "0");
  const focusFirstRow = async (user: ReturnType<typeof userEvent.setup>) => {
    taskRows()[0].focus();
    expect(taskRows()[0]).toHaveFocus();
    return user;
  };

  it("arrows move focus between rows and the single tab stop follows", async () => {
    renderGantt();
    const user = await focusFirstRow(userEvent.setup());
    await user.keyboard("{ArrowDown}");
    expect(taskRows()[1]).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(taskRows()[2]).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(taskRows()[1]).toHaveFocus();
    expect(tabStops()).toEqual([taskRows()[1]]);
  });

  it("Home and End focus the first and last task rows", async () => {
    renderGantt();
    const user = await focusFirstRow(userEvent.setup());
    await user.keyboard("{End}");
    expect(taskRows()[TASKS.length - 1]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(taskRows()[0]).toHaveFocus();
    expect(tabStops()).toEqual([taskRows()[0]]);
  });

  it("does not wrap: past either end the key is left to the browser", () => {
    renderGantt();
    const [first] = taskRows();
    const last = taskRows()[TASKS.length - 1];
    first.focus();
    expect(fireEvent.keyDown(first, { key: "ArrowUp" })).toBe(true);
    expect(fireEvent.keyDown(first, { key: "Home" })).toBe(true);
    expect(first).toHaveFocus();
    last.focus();
    expect(fireEvent.keyDown(last, { key: "ArrowDown" })).toBe(true);
    expect(last).toHaveFocus();
  });

  it("leaves modified arrows and the zoom buttons alone (reserved for s23)", () => {
    renderGantt();
    const [first] = taskRows();
    first.focus();
    for (const modifier of ["altKey", "shiftKey", "ctrlKey", "metaKey"]) {
      expect(
        fireEvent.keyDown(first, { key: "ArrowDown", [modifier]: true }),
      ).toBe(true);
      expect(first).toHaveFocus();
    }
    const day = screen.getByRole("button", { name: "Day" });
    day.focus();
    expect(fireEvent.keyDown(day, { key: "End" })).toBe(true);
    expect(day).toHaveFocus();
    // Plain arrows do act (otherwise the cases above prove nothing).
    expect(fireEvent.keyDown(first, { key: "ArrowDown" })).toBe(false);
    expect(taskRows()[1]).toHaveFocus();
  });

  it.each([
    [
      "en-US",
      [
        "Write the brief, from March 2, 2026 to March 13, 2026",
        "Review, March 25, 2026",
        "Plan the launch, no dates",
      ],
    ],
    [
      "fr-FR",
      [
        "Write the brief, du 2 mars 2026 au 13 mars 2026",
        "Review, le 25 mars 2026",
        "Plan the launch, sans dates",
      ],
    ],
  ])(
    "%s: the focused row announces its task and dates",
    async (locale, names) => {
      renderGantt({}, locale);
      const user = await focusFirstRow(userEvent.setup());
      const announced = [document.activeElement?.getAttribute("aria-label")];
      await user.keyboard("{ArrowDown}{ArrowDown}");
      announced.push(document.activeElement?.getAttribute("aria-label"));
      await user.keyboard("{ArrowDown}");
      announced.push(document.activeElement?.getAttribute("aria-label"));
      expect(announced).toEqual(names);
    },
  );

  it("navigation changes neither the data nor the zoom", async () => {
    const onZoomChange = vi.fn();
    // Not frozen: a write in a key handler would throw where no test sees it.
    const tasks = TASKS.map((task) => ({ ...task }));
    const before = JSON.stringify(tasks);
    renderGantt({ tasks, onZoomChange });
    const user = await focusFirstRow(userEvent.setup());
    await user.keyboard("{ArrowDown}{End}{Home}");
    expect(onZoomChange).not.toHaveBeenCalled();
    expect(JSON.stringify(tasks)).toBe(before);
  });

  it("rows added or removed keep one tab stop and a valid focus", async () => {
    const ui = (tasks: GanttTask[]) => (
      <CunninghamProvider>
        <Gantt aria-label="Plan" tasks={tasks} today="2026-03-23" />
      </CunninghamProvider>
    );
    const { rerender } = render(ui(TASKS));
    const user = await focusFirstRow(userEvent.setup());
    await user.keyboard("{ArrowDown}{ArrowDown}"); // "Review"
    // A row inserted above: the tab stop stays on the same task.
    rerender(ui([{ id: "z", name: "Zero" }, ...TASKS]));
    expect(tabStops()).toHaveLength(1);
    expect(tabStops()[0]).toHaveAccessibleName(/^Review/);
    expect(tabStops()[0]).toHaveFocus();
    // The focused row removed: the nearest row takes the stop and the focus.
    rerender(
      ui([{ id: "z", name: "Zero" }, ...TASKS].filter((t) => t.id !== "c")),
    );
    expect(tabStops()).toHaveLength(1);
    expect(tabStops()[0]).toHaveAccessibleName(/^Plan the launch/);
    expect(tabStops()[0]).toHaveFocus();
    // The last rows removed: the stop is clamped to the last row left.
    rerender(ui(TASKS.slice(0, 1)));
    expect(tabStops()).toHaveLength(1);
    expect(tabStops()[0]).toHaveAccessibleName(/^Write the brief/);
  });

  it("a click on a row moves the tab stop to it", async () => {
    const user = userEvent.setup();
    renderGantt();
    await user.click(within(taskRows()[3]).getByRole("rowheader"));
    expect(taskRows()[3]).toHaveFocus();
    expect(tabStops()).toEqual([taskRows()[3]]);
  });

  it("keeps rows as direct children of the grid, each with its cells (axe structure)", () => {
    renderGantt();
    const grid = screen.getByRole("grid");
    const rows = screen.getAllByRole("row");
    rows.forEach((row) => expect(row.parentElement).toBe(grid));
    expect(within(rows[0]).getAllByRole("columnheader")).toHaveLength(2);
    rows.slice(1).forEach((row) => {
      expect(within(row).getAllByRole("rowheader")).toHaveLength(1);
      expect(within(row).getAllByRole("gridcell")).toHaveLength(1);
    });
  });
});

describe("Gantt bounded range", () => {
  it("renders extreme dates with a bounded axis, rows and names intact", () => {
    const { container } = renderGantt({
      zoom: "day",
      tasks: [
        { id: "f", name: "Forever", start: "0001-01-01", end: "9999-12-31" },
        { id: "o", name: "Antiquity", start: "0001-01-01", end: "0001-01-10" },
      ],
    });
    expect(
      container.querySelectorAll(".c__gantt__axis-label").length,
    ).toBeLessThanOrEqual(2 * (MAX_DAYS + 37) + 1);
    expect(bar(taskRow("Forever"))).not.toBeNull();
    // Out of the window: no bar, but the dates still exist and are announced.
    const antiquity = taskRow("Antiquity");
    expect(bar(antiquity)).toBeNull();
    expect(within(antiquity).queryByText("No dates")).toBeNull();
    expect(antiquity.getAttribute("aria-label")).toMatch(
      /^Antiquity, from January 1, 1 to January 10, 1$/,
    );
  });
});

describe("Gantt empty", () => {
  it("shows 'No tasks' and no task row", () => {
    renderGantt({ tasks: [] });
    expect(screen.getByText("No tasks")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(1);
    expect(screen.getByRole("grid")).toHaveAttribute("aria-rowcount", "1");
  });
});

describe("Gantt accessible names (AC4)", () => {
  it.each([
    [
      "en-US",
      [
        "Write the brief, from March 2, 2026 to March 13, 2026",
        "Review, March 25, 2026",
        "Plan the launch, no dates",
      ],
    ],
    [
      "fr-FR",
      [
        "Write the brief, du 2 mars 2026 au 13 mars 2026",
        "Review, le 25 mars 2026",
        "Plan the launch, sans dates",
      ],
    ],
  ])("%s: each row is named with the task and its dates", (locale, names) => {
    renderGantt({}, locale);
    for (const name of names) {
      expect(screen.getByRole("row", { name })).toBeInTheDocument();
    }
  });
});

describe("Gantt root", () => {
  it("names the grid with aria-label and forwards the rest to the root", () => {
    renderGantt({
      "aria-label": "Roadmap",
      className: "custom",
      id: "plan",
      // @ts-expect-error data attributes are valid div attributes
      "data-testid": "gantt",
    });
    const root = screen.getByTestId("gantt");
    expect(screen.getByRole("grid", { name: "Roadmap" })).toBeInTheDocument();
    expect(root).not.toHaveAttribute("aria-label");
    expect(root).toHaveClass("c__gantt", "custom");
    expect(root).toHaveAttribute("id", "plan");
  });
});

// jsdom has neither PointerEvent nor layout: a MouseEvent carrying a pointer
// id, a stubbed capture, and a track of PX pixels per day.
class TestPointerEvent extends MouseEvent {
  pointerId: number;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
  }
}

const deepFreeze = (tasks: GanttTask[]) =>
  Object.freeze(tasks.map((task) => Object.freeze({ ...task }))) as GanttTask[];

// en-US weeks start on Sunday: the axis starts on 2026-01-04 (Frame).
const EDIT_TASKS = deepFreeze([
  { id: "a", name: "Write the brief", start: "2026-03-02", end: "2026-03-13" },
  { id: "b", name: "Build", start: "2026-01-31", end: "2026-02-05" },
  { id: "z", name: "Frame", start: "2026-01-04", end: "2026-06-30" },
  { id: "d", name: "Plan the launch" },
]);

describe("Gantt pointer move (s23)", () => {
  let px = 40;
  beforeEach(() => {
    px = 40;
    const proto = HTMLElement.prototype;
    const { getBoundingClientRect } = proto;
    const win = window as unknown as Record<string, unknown>;
    const pointer = win.PointerEvent;
    win.PointerEvent = TestPointerEvent;
    proto.setPointerCapture = vi.fn();
    proto.releasePointerCapture = vi.fn();
    proto.hasPointerCapture = vi.fn(() => true);
    proto.getBoundingClientRect = function (this: HTMLElement) {
      if (this.matches('[role="gridcell"].c__gantt__track')) {
        const days = Number(
          this.closest<HTMLElement>('[role="grid"]')!.style.getPropertyValue(
            "--gantt-days",
          ),
        );
        return new DOMRect(0, 0, days * px, 40);
      }
      return getBoundingClientRect.call(this);
    };
    return () => {
      proto.getBoundingClientRect = getBoundingClientRect;
      win.PointerEvent = pointer;
    };
  });

  const editGantt = (props: Partial<GanttProps> = {}) =>
    renderGantt({
      tasks: EDIT_TASKS,
      editable: true,
      zoom: "day",
      ...props,
    });
  const barOf = (name: string) => bar(taskRow(name))!;
  const start = (name: string) => Number(cssVar(barOf(name), "--gantt-start"));
  const down = (el: HTMLElement, x = 100) =>
    fireEvent.pointerDown(el, { clientX: x, button: 0, pointerId: 1 });
  const moveTo = (el: HTMLElement, x: number) =>
    fireEvent.pointerMove(el, { clientX: x, pointerId: 1 });
  const up = (el: HTMLElement, x: number) =>
    fireEvent.pointerUp(el, { clientX: x, pointerId: 1 });
  const drag = (name: string, dx: number) => {
    const el = barOf(name);
    down(el);
    moveTo(el, 100 + dx);
    up(el, 100 + dx);
  };
  const root = () =>
    screen.getByRole("grid").closest<HTMLElement>(".c__gantt")!;
  const ghost = () => document.querySelector<HTMLElement>(".c__gantt__ghost");
  const tip = () => document.querySelector<HTMLElement>(".c__gantt__tip");

  it("read-only by default: no editing DOM, chords and pointer left alone", () => {
    const onTaskChange = vi.fn();
    renderGantt({ tasks: EDIT_TASKS, zoom: "day", onTaskChange });
    expect(screen.queryByRole("status")).toBeNull();
    expect(root()).not.toHaveAttribute("data-editable");
    for (const row of screen.getAllByRole("row").slice(1)) {
      expect(row).not.toHaveAttribute("aria-keyshortcuts");
      expect(row).not.toHaveAttribute("aria-describedby");
    }
    const row = taskRow("Write the brief");
    row.focus();
    expect(fireEvent.keyDown(row, { key: "ArrowRight", altKey: true })).toBe(
      true,
    );
    const before = start("Write the brief");
    const el = barOf("Write the brief");
    down(el);
    moveTo(el, 220);
    expect(root()).not.toHaveAttribute("data-editing");
    expect(ghost()).toBeNull();
    expect(tip()).toBeNull();
    up(el, 220);
    expect(start("Write the brief")).toBe(before);
    expect(onTaskChange).not.toHaveBeenCalled();
  });

  it("day zoom: a drag of 3 days shifts both dates by 3 days, once (AC1)", () => {
    const onTaskChange = vi.fn();
    editGantt({ onTaskChange });
    drag("Write the brief", 3 * 40);
    expect(onTaskChange).toHaveBeenCalledTimes(1);
    expect(onTaskChange).toHaveBeenCalledWith("a", {
      start: "2026-03-05",
      end: "2026-03-16",
    });
  });

  it("week zoom snaps to whole weeks (AC4)", () => {
    px = 12;
    const onTaskChange = vi.fn();
    editGantt({ zoom: "week", onTaskChange });
    drag("Write the brief", 20); // 1.67 days: 0 weeks
    expect(onTaskChange).not.toHaveBeenCalled();
    drag("Write the brief", 50); // 4.17 days: 1 week
    expect(onTaskChange).toHaveBeenCalledTimes(1);
    expect(onTaskChange).toHaveBeenCalledWith("a", {
      start: "2026-03-09",
      end: "2026-03-20",
    });
  });

  it("month zoom moves by a calendar month, clamped, length kept in days (AC4)", () => {
    px = 4;
    const onTaskChange = vi.fn();
    editGantt({ zoom: "month", onTaskChange });
    drag("Build", 28 * 4);
    expect(onTaskChange).toHaveBeenCalledWith("b", {
      start: "2026-02-28",
      end: "2026-03-05",
    });
  });

  it("previews the move on the dragged row only, never touching the tasks", () => {
    editGantt();
    const before = JSON.stringify(EDIT_TASKS);
    const original = start("Write the brief");
    const others = [start("Build"), start("Frame")];
    const label = taskRow("Write the brief").getAttribute("aria-label");
    const el = barOf("Write the brief");
    down(el);
    moveTo(el, 100 + 3 * 40 + 7);
    expect(root()).toHaveAttribute("data-editing", "move");
    expect(start("Write the brief")).toBe(original + 3);
    expect(Number(cssVar(ghost(), "--gantt-start"))).toBe(original);
    expect(tip()).toHaveTextContent("March 5, 2026 to March 16, 2026");
    expect(taskRow("Write the brief").contains(tip())).toBe(true);
    expect([start("Build"), start("Frame")]).toEqual(others);
    expect(taskRow("Write the brief")).toHaveAttribute("aria-label", label!);
    expect(JSON.stringify(EDIT_TASKS)).toBe(before);
  });

  it("stops at the start of the axis and says so", () => {
    const onTaskChange = vi.fn();
    editGantt({ onTaskChange });
    const el = barOf("Write the brief");
    down(el);
    moveTo(el, 100 - 400 * 40);
    expect(start("Write the brief")).toBe(0);
    expect(el).toHaveAttribute("data-clamped");
    expect(tip()).toHaveTextContent("Limit of the chart reached");
    up(el, 100 - 400 * 40);
    expect(onTaskChange).toHaveBeenCalledWith("a", {
      start: "2026-01-04",
      end: "2026-01-15",
    });
  });

  it.each([
    [
      "Escape",
      () => fireEvent.keyDown(document.activeElement!, { key: "Escape" }),
    ],
    ["pointercancel", (el: HTMLElement) => fireEvent.pointerCancel(el)],
    [
      "lost capture",
      (el: HTMLElement) => fireEvent.lostPointerCapture(el, { pointerId: 1 }),
    ],
    ["window blur", () => fireEvent.blur(window)],
  ])("%s mid-drag restores the bar and commits nothing (AC5)", (_, cancel) => {
    const onTaskChange = vi.fn();
    editGantt({ onTaskChange });
    const original = start("Write the brief");
    const el = barOf("Write the brief");
    down(el);
    moveTo(el, 100 + 3 * 40);
    cancel(el);
    expect(start("Write the brief")).toBe(original);
    expect(root()).not.toHaveAttribute("data-editing");
    expect(ghost()).toBeNull();
    expect(tip()).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Write the brief: change cancelled, dates restored",
    );
    moveTo(el, 100 + 5 * 40);
    expect(start("Write the brief")).toBe(original);
    up(el, 100 + 5 * 40);
    expect(onTaskChange).not.toHaveBeenCalled();
  });

  it("Escape is stopped while a drag runs, and only then", () => {
    const outer = vi.fn();
    render(
      <CunninghamProvider>
        <div onKeyDown={outer}>
          <Gantt
            aria-label="Plan"
            tasks={EDIT_TASKS}
            zoom="day"
            today="2026-03-23"
            editable
          />
        </div>
      </CunninghamProvider>,
    );
    const row = taskRow("Write the brief");
    row.focus();
    const el = barOf("Write the brief");
    down(el);
    moveTo(el, 100 + 40);
    expect(fireEvent.keyDown(row, { key: "Escape" })).toBe(false);
    expect(outer).not.toHaveBeenCalled();
    expect(fireEvent.keyDown(row, { key: "Escape" })).toBe(true);
    expect(outer).toHaveBeenCalledTimes(1);
  });

  it("a drag back to the start, or under half a unit, commits nothing", () => {
    const onTaskChange = vi.fn();
    editGantt({ onTaskChange });
    drag("Write the brief", 15);
    const el = barOf("Write the brief");
    down(el);
    moveTo(el, 100 + 3 * 40);
    moveTo(el, 100);
    up(el, 100);
    expect(onTaskChange).not.toHaveBeenCalled();
  });

  it("controlled: a parent that ignores the change gets the bar back; one that applies it shows the new bar", () => {
    const ignored = vi.fn();
    const { unmount } = editGantt({ onTaskChange: ignored });
    const original = start("Write the brief");
    drag("Write the brief", 2 * 40);
    expect(ignored).toHaveBeenCalledTimes(1);
    expect(start("Write the brief")).toBe(original);
    expect(ghost()).toBeNull();
    unmount();

    const Parent = () => {
      const [tasks, setTasks] = useState(EDIT_TASKS);
      return (
        <CunninghamProvider>
          <Gantt
            aria-label="Plan"
            tasks={tasks}
            zoom="day"
            today="2026-03-23"
            editable
            onTaskChange={(id, change) =>
              setTasks((all) =>
                all.map((task) =>
                  task.id === id ? { ...task, ...change } : task,
                ),
              )
            }
          />
        </CunninghamProvider>
      );
    };
    render(<Parent />);
    drag("Write the brief", 2 * 40);
    expect(start("Write the brief")).toBe(original + 2);
    expect(ghost()).toBeNull();
    expect(root()).not.toHaveAttribute("data-editing");
  });

  it("announces the snapped dates and the commit in one status region", () => {
    editGantt({ onTaskChange: vi.fn() });
    expect(screen.getAllByRole("status")).toHaveLength(1);
    const el = barOf("Write the brief");
    down(el);
    moveTo(el, 100 + 3 * 40);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Write the brief: March 5, 2026 to March 16, 2026",
    );
    up(el, 100 + 3 * 40);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Write the brief rescheduled: March 5, 2026 to March 16, 2026",
    );
  });

  it("a task without dates or clipped by the window cannot be dragged", () => {
    const onTaskChange = vi.fn();
    editGantt({
      onTaskChange,
      tasks: [
        { id: "f", name: "Forever", start: "0001-01-01", end: "9999-12-31" },
        { id: "n", name: "Nothing" },
      ],
    });
    expect(bar(taskRow("Nothing"))).toBeNull();
    const el = barOf("Forever");
    const before = start("Forever");
    down(el);
    moveTo(el, 100 + 3 * 40);
    expect(root()).not.toHaveAttribute("data-editing");
    up(el, 100 + 3 * 40);
    expect(start("Forever")).toBe(before);
    expect(onTaskChange).not.toHaveBeenCalled();
  });

  it("unmounted mid-drag, it leaves Escape and blur to the page", () => {
    const outer = vi.fn();
    document.addEventListener("keydown", outer);
    const blur = vi.spyOn(window, "removeEventListener");
    const { unmount } = editGantt();
    const el = barOf("Write the brief");
    down(el);
    moveTo(el, 100 + 40);
    unmount();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(outer).toHaveBeenCalledTimes(1);
    expect(blur).toHaveBeenCalledWith("blur", expect.any(Function));
    document.removeEventListener("keydown", outer);
    blur.mockRestore();
  });

  it("a task clipped on the start side of the window cannot be dragged", () => {
    const onTaskChange = vi.fn();
    // Ten years from today's window floor: Early starts before the window.
    editGantt({
      onTaskChange,
      today: "2026-03-23",
      tasks: [
        { id: "e", name: "Early", start: "2010-01-01", end: "2026-03-10" },
        { id: "l", name: "Late", start: "2026-03-01", end: "2030-01-01" },
      ],
    });
    const el = barOf("Early");
    expect(start("Early")).toBe(0);
    down(el);
    moveTo(el, 100 + 3 * 40);
    expect(root()).not.toHaveAttribute("data-editing");
    up(el, 100 + 3 * 40);
    expect(onTaskChange).not.toHaveBeenCalled();
  });

  it("unmeasured track geometry starts no drag", () => {
    px = 0;
    editGantt();
    const el = barOf("Write the brief");
    down(el);
    moveTo(el, 100 + 3 * 40);
    expect(root()).not.toHaveAttribute("data-editing");
    expect(tip()).toBeNull();
  });

  it("only the primary button starts a drag", () => {
    editGantt();
    const el = barOf("Write the brief");
    fireEvent.pointerDown(el, { clientX: 100, button: 2, pointerId: 1 });
    moveTo(el, 100 + 3 * 40);
    expect(root()).not.toHaveAttribute("data-editing");
  });

  it("a commit that moves the axis origin keeps the leftmost visible day", () => {
    // TASKS: the axis starts on 2026-03-01; moving the earliest task a week
    // later moves it to 2026-03-08.
    const Parent = () => {
      const [tasks, setTasks] = useState(TASKS);
      return (
        <CunninghamProvider>
          <Gantt
            aria-label="Plan"
            tasks={tasks}
            zoom="day"
            today="2026-03-23"
            editable
            onTaskChange={(id, change) =>
              setTasks((all) =>
                all.map((task) =>
                  task.id === id ? { ...task, ...change } : task,
                ),
              )
            }
          />
        </CunninghamProvider>
      );
    };
    const { container } = render(<Parent />);
    const scroller = container.querySelector<HTMLElement>(
      ".c__gantt__scroller",
    )!;
    scroller.scrollLeft = 400;
    drag("Write the brief", 7 * 40);
    expect(start("Build")).toBe(1);
    expect(scroller.scrollLeft).toBe(400 - 7 * 40);
  });

  describe("resize", () => {
    const span = (name: string) => Number(cssVar(barOf(name), "--gantt-span"));
    const handle = (name: string, edge: "start" | "end") =>
      barOf(name).querySelector<HTMLElement>(
        `.c__gantt__handle[data-edge="${edge}"]`,
      )!;
    const resize = (name: string, edge: "start" | "end", dx: number) => {
      const el = handle(name, edge);
      down(el);
      moveTo(el, 100 + dx);
      up(el, 100 + dx);
    };
    const handles = () => document.querySelectorAll(".c__gantt__handle");

    it("editable: two hidden, unfocusable handles per editable bar, none otherwise", () => {
      const { unmount } = editGantt({
        tasks: [
          ...EDIT_TASKS,
          { id: "f", name: "Forever", start: "0001-01-01", end: "9999-12-31" },
        ],
      });
      for (const name of ["Write the brief", "Build", "Frame"]) {
        const edges = [...barOf(name).querySelectorAll(".c__gantt__handle")];
        expect(edges.map((el) => el.getAttribute("data-edge"))).toEqual([
          "start",
          "end",
        ]);
        for (const el of edges) {
          expect(el.closest('[aria-hidden="true"]')).not.toBeNull();
          expect(el).not.toHaveAttribute("tabindex");
        }
      }
      // No bar, or a bar clipped by the window: nothing to resize.
      expect(
        taskRow("Plan the launch").querySelector(".c__gantt__handle"),
      ).toBeNull();
      expect(barOf("Forever").querySelector(".c__gantt__handle")).toBeNull();
      unmount();
      renderGantt({ tasks: EDIT_TASKS, zoom: "day" });
      expect(handles()).toHaveLength(0);
    });

    it("the end handle changes only the end, the start handle only the start (AC2)", () => {
      const onTaskChange = vi.fn();
      editGantt({ onTaskChange });
      resize("Write the brief", "end", 2 * 40);
      expect(onTaskChange).toHaveBeenLastCalledWith("a", {
        start: "2026-03-02",
        end: "2026-03-15",
      });
      resize("Write the brief", "start", 2 * 40);
      expect(onTaskChange).toHaveBeenLastCalledWith("a", {
        start: "2026-03-04",
        end: "2026-03-13",
      });
      expect(onTaskChange).toHaveBeenCalledTimes(2);
    });

    it("the end never goes before the start: one unit wide, flagged, committed clamped (AC2)", () => {
      const onTaskChange = vi.fn();
      editGantt({ onTaskChange });
      const original = start("Write the brief");
      const el = handle("Write the brief", "end");
      down(el);
      moveTo(el, 100 - 30 * 40);
      expect(start("Write the brief")).toBe(original);
      expect(span("Write the brief")).toBe(1);
      expect(barOf("Write the brief")).toHaveAttribute("data-clamped");
      expect(tip()).toHaveTextContent("The end cannot be before the start");
      expect(screen.getByRole("status")).toHaveTextContent(
        "The end cannot be before the start",
      );
      up(el, 100 - 30 * 40);
      expect(onTaskChange).toHaveBeenLastCalledWith("a", {
        start: "2026-03-02",
        end: "2026-03-02",
      });
      resize("Write the brief", "start", 30 * 40);
      expect(onTaskChange).toHaveBeenLastCalledWith("a", {
        start: "2026-03-13",
        end: "2026-03-13",
      });
    });

    it("snaps a resize to whole weeks and calendar months, from the edited edge (AC4)", () => {
      px = 12;
      const onTaskChange = vi.fn();
      const { unmount } = editGantt({ zoom: "week", onTaskChange });
      resize("Write the brief", "end", 50); // 4.17 days: 1 week
      expect(onTaskChange).toHaveBeenLastCalledWith("a", {
        start: "2026-03-02",
        end: "2026-03-20",
      });
      unmount();
      px = 4;
      onTaskChange.mockClear();
      editGantt({
        zoom: "month",
        onTaskChange,
        tasks: [
          { id: "j", name: "January", start: "2026-01-10", end: "2026-01-31" },
          { id: "f", name: "February", start: "2026-01-10", end: "2026-02-28" },
          { id: "z", name: "Frame", start: "2026-01-04", end: "2026-06-30" },
        ],
      });
      resize("January", "end", 28 * 4); // Jan 31 + 1 month, clamped
      expect(onTaskChange).toHaveBeenLastCalledWith("j", {
        start: "2026-01-10",
        end: "2026-02-28",
      });
      // 14.5 days from Feb 28 is nearer one month (28 days) than none; from
      // the start (Jan 10, a 31-day month) it would be nearer none.
      resize("February", "end", 14.5 * 4);
      expect(onTaskChange).toHaveBeenLastCalledWith("f", {
        start: "2026-01-10",
        end: "2026-03-28",
      });
      expect(onTaskChange).toHaveBeenCalledTimes(2);
    });

    it.each([
      [
        "Escape",
        () => fireEvent.keyDown(document.activeElement!, { key: "Escape" }),
      ],
      ["pointercancel", (el: HTMLElement) => fireEvent.pointerCancel(el)],
      ["window blur", () => fireEvent.blur(window)],
    ])("a resize session, cancelled by %s, restores the dates", (_, cancel) => {
      const onTaskChange = vi.fn();
      editGantt({ onTaskChange });
      const before = [start("Write the brief"), span("Write the brief")];
      const el = handle("Write the brief", "end");
      down(el);
      moveTo(el, 100 + 3 * 40);
      expect(root()).toHaveAttribute("data-editing", "resize-end");
      expect(span("Write the brief")).toBe(before[1] + 3);
      cancel(el);
      expect([start("Write the brief"), span("Write the brief")]).toEqual(
        before,
      );
      expect(root()).not.toHaveAttribute("data-editing");
      up(el, 100 + 3 * 40);
      expect(onTaskChange).not.toHaveBeenCalled();
      const first = handle("Write the brief", "start");
      down(first);
      moveTo(first, 100 - 40);
      expect(root()).toHaveAttribute("data-editing", "resize-start");
    });

    it("unmounted mid auto-scroll, no frame is left to run", () => {
      const frames = new Map<number, FrameRequestCallback>();
      let next = 0;
      const raf = vi
        .spyOn(window, "requestAnimationFrame")
        .mockImplementation((cb) => (frames.set(++next, cb), next));
      const caf = vi
        .spyOn(window, "cancelAnimationFrame")
        .mockImplementation((id) => void frames.delete(id));
      // A 1000px box whose visible track starts after a 200px column.
      const proto = HTMLElement.prototype;
      const measured = proto.getBoundingClientRect;
      proto.getBoundingClientRect = function (this: HTMLElement) {
        if (this.matches(".c__gantt__scroller"))
          return new DOMRect(0, 0, 1000, 300);
        if (this.matches(".c__gantt__axis > .c__gantt__task"))
          return new DOMRect(0, 0, 200, 40);
        return measured.call(this);
      };
      const width = vi
        .spyOn(proto, "clientWidth", "get")
        .mockImplementation(function (this: HTMLElement) {
          return this.matches(".c__gantt__scroller") ? 1000 : 0;
        });
      try {
        const { container, unmount } = editGantt();
        const scroller = container.querySelector<HTMLElement>(
          ".c__gantt__scroller",
        )!;
        const el = barOf("Write the brief");
        down(el, 500);
        moveTo(el, 990); // 10px from the right edge
        expect(frames.size).toBe(1);
        // The loop runs: one frame scrolls and asks for the next.
        const [first] = frames.values();
        frames.clear();
        first(0);
        expect(scroller.scrollLeft).toBeGreaterThan(0);
        expect(frames.size).toBe(1);
        unmount();
        expect(frames.size).toBe(0);
      } finally {
        proto.getBoundingClientRect = measured;
        width.mockRestore();
        raf.mockRestore();
        caf.mockRestore();
      }
    });

    it("bars narrower than the 24px target carry no handles", () => {
      px = 12;
      editGantt({
        zoom: "week",
        tasks: [
          { id: "o", name: "One day", start: "2026-03-10", end: "2026-03-10" },
          { id: "t", name: "Two days", start: "2026-03-10", end: "2026-03-11" },
        ],
      });
      // Week zoom: 12px a day, at the root font size.
      expect(barOf("One day").querySelector(".c__gantt__handle")).toBeNull();
      expect(
        barOf("Two days").querySelectorAll(".c__gantt__handle"),
      ).toHaveLength(2);
      // The bar itself still moves.
      const el = barOf("One day");
      down(el);
      moveTo(el, 100 + 7 * 12);
      expect(root()).toHaveAttribute("data-editing", "move");
    });
  });

  describe("keyboard", () => {
    // jsdom has no layout: the bar scrolled into view after Enter is the CT's.
    beforeEach(() => {
      Element.prototype.scrollIntoView = vi.fn();
    });

    const press = (
      row: HTMLElement,
      key: string,
      modifiers: Record<string, boolean> = {},
    ) => fireEvent.keyDown(row, { key, ...modifiers });
    const alt = (row: HTMLElement, key: string) =>
      press(row, key, { altKey: true });
    const shift = (row: HTMLElement, key: string) =>
      press(row, key, { shiftKey: true });
    const focused = (name: string) => {
      const row = taskRow(name);
      row.focus();
      return row;
    };
    const status = () => screen.getByRole("status");

    it("Alt+Arrow previews a move from the original dates; Enter commits it once (AC3)", () => {
      const onTaskChange = vi.fn();
      editGantt({ onTaskChange });
      const original = start("Write the brief");
      const row = focused("Write the brief");
      expect(alt(row, "ArrowRight")).toBe(false);
      expect(root()).toHaveAttribute("data-editing", "move");
      expect(Number(cssVar(ghost(), "--gantt-start"))).toBe(original);
      expect(tip()).toHaveTextContent("March 3, 2026 to March 14, 2026");
      expect(onTaskChange).not.toHaveBeenCalled();
      alt(row, "ArrowRight");
      alt(row, "ArrowLeft");
      expect(start("Write the brief")).toBe(original + 1);
      expect(press(row, "Enter")).toBe(false);
      expect(onTaskChange).toHaveBeenCalledTimes(1);
      expect(onTaskChange).toHaveBeenCalledWith("a", {
        start: "2026-03-03",
        end: "2026-03-14",
      });
      expect(root()).not.toHaveAttribute("data-editing");
      expect(ghost()).toBeNull();
      expect(row).toHaveFocus();
      // No session: Enter is the page's again.
      expect(press(row, "Enter")).toBe(true);
      expect(onTaskChange).toHaveBeenCalledTimes(1);
    });

    it("Shift+Arrow changes only the end, never before the start; Alt and Shift compose (AC2, AC3)", () => {
      const onTaskChange = vi.fn();
      const { unmount } = editGantt({ zoom: "week", onTaskChange });
      let row = focused("Write the brief");
      expect(shift(row, "ArrowRight")).toBe(false);
      expect(root()).toHaveAttribute("data-editing", "resize-end");
      press(row, "Enter");
      expect(onTaskChange).toHaveBeenLastCalledWith("a", {
        start: "2026-03-02",
        end: "2026-03-20",
      });
      // Mar 13 - 1 week = Mar 6; - 2 weeks is before Mar 2: one day wide.
      shift(row, "ArrowLeft");
      shift(row, "ArrowLeft");
      expect(barOf("Write the brief")).toHaveAttribute("data-clamped");
      expect(tip()).toHaveTextContent("The end cannot be before the start");
      expect(status()).toHaveTextContent("The end cannot be before the start");
      shift(row, "ArrowLeft");
      shift(row, "ArrowRight");
      press(row, "Enter");
      // Bounded: the refused step did not count, one step back is Mar 6.
      expect(onTaskChange).toHaveBeenLastCalledWith("a", {
        start: "2026-03-02",
        end: "2026-03-06",
      });
      unmount();

      editGantt({ onTaskChange });
      row = focused("Write the brief");
      alt(row, "ArrowRight");
      shift(row, "ArrowLeft");
      press(row, "Enter");
      expect(onTaskChange).toHaveBeenCalledTimes(3);
      expect(onTaskChange).toHaveBeenLastCalledWith("a", {
        start: "2026-03-03",
        end: "2026-03-13",
      });
    });

    it("steps by the zoom unit: a week, or a clamped month undone exactly (AC4)", () => {
      const onTaskChange = vi.fn();
      const { unmount } = editGantt({ zoom: "week", onTaskChange });
      let row = focused("Write the brief");
      alt(row, "ArrowRight");
      press(row, "Enter");
      expect(onTaskChange).toHaveBeenLastCalledWith("a", {
        start: "2026-03-09",
        end: "2026-03-20",
      });
      unmount();

      editGantt({ zoom: "month", onTaskChange });
      row = focused("Build");
      alt(row, "ArrowRight");
      press(row, "Enter");
      expect(onTaskChange).toHaveBeenLastCalledWith("b", {
        start: "2026-02-28",
        end: "2026-03-05",
      });
      // From the original: Jan 31 +1 -1 month is Jan 31, not Jan 28.
      alt(row, "ArrowRight");
      alt(row, "ArrowLeft");
      press(row, "Enter");
      expect(onTaskChange).toHaveBeenCalledTimes(2);
    });

    it("Escape cancels: original dates, announced, nothing reported, focus kept (AC5)", () => {
      const onTaskChange = vi.fn();
      const outer = vi.fn();
      document.addEventListener("keydown", outer);
      try {
        editGantt({ onTaskChange });
        const original = start("Write the brief");
        const row = focused("Write the brief");
        alt(row, "ArrowRight");
        alt(row, "ArrowRight");
        outer.mockClear();
        expect(press(row, "Escape")).toBe(false);
        expect(outer).not.toHaveBeenCalled();
        expect(start("Write the brief")).toBe(original);
        expect(root()).not.toHaveAttribute("data-editing");
        expect(ghost()).toBeNull();
        expect(tip()).toBeNull();
        expect(status()).toHaveTextContent(
          "Write the brief: change cancelled, dates restored",
        );
        expect(row).toHaveFocus();
        press(row, "Enter");
        expect(onTaskChange).not.toHaveBeenCalled();
        outer.mockClear();
        expect(press(row, "Escape")).toBe(true);
        expect(outer).toHaveBeenCalledTimes(1);
      } finally {
        document.removeEventListener("keydown", outer);
      }
    });

    it("leaving the row, the window, or navigating rows cancels; navigation is unchanged", () => {
      const onTaskChange = vi.fn();
      editGantt({ onTaskChange });
      const original = start("Write the brief");
      let row = focused("Write the brief");
      const open = () => {
        alt(row, "ArrowRight");
        expect(root()).toHaveAttribute("data-editing", "move");
      };
      open();
      focused("Build");
      expect(root()).not.toHaveAttribute("data-editing");
      expect(start("Write the brief")).toBe(original);

      row = focused("Write the brief");
      open();
      fireEvent.blur(window);
      expect(root()).not.toHaveAttribute("data-editing");

      // The first row: ArrowUp moves nowhere, yet ends the session.
      open();
      expect(press(row, "ArrowUp")).toBe(true);
      expect(root()).not.toHaveAttribute("data-editing");
      expect(row).toHaveFocus();

      open();
      expect(press(row, "ArrowDown")).toBe(false);
      expect(taskRow("Build")).toHaveFocus();
      expect(root()).not.toHaveAttribute("data-editing");
      expect(start("Write the brief")).toBe(original);
      expect(onTaskChange).not.toHaveBeenCalled();
      // Without a session the keys navigate as in s22.
      expect(press(taskRow("Build"), "Home")).toBe(false);
      expect(row).toHaveFocus();
    });

    it("leaves the chords to the browser when it cannot edit (guard)", () => {
      const onTaskChange = vi.fn();
      const chords = (row: HTMLElement) =>
        [
          alt(row, "ArrowRight"),
          shift(row, "ArrowLeft"),
          press(row, "ArrowRight", { ctrlKey: true }),
          press(row, "ArrowRight", { metaKey: true }),
          press(row, "ArrowRight", { altKey: true, shiftKey: true }),
        ].every(Boolean) && !root().hasAttribute("data-editing");
      const { unmount } = renderGantt({
        tasks: EDIT_TASKS,
        zoom: "day",
        onTaskChange,
      });
      expect(chords(focused("Write the brief"))).toBe(true);
      unmount();

      const view = editGantt({
        onTaskChange,
        tasks: [
          ...EDIT_TASKS,
          { id: "f", name: "Forever", start: "0001-01-01", end: "9999-12-31" },
        ],
      });
      expect(chords(focused("Plan the launch"))).toBe(true);
      expect(chords(focused("Forever"))).toBe(true);
      const day = screen.getByRole("button", { name: "Day" });
      day.focus();
      expect(alt(day, "ArrowRight")).toBe(true);
      // Ctrl/Meta/Alt+Shift on an editable row (Alt alone does act).
      const row = focused("Write the brief");
      expect(
        [
          press(row, "ArrowRight", { ctrlKey: true, altKey: true }),
          press(row, "ArrowRight", { metaKey: true, shiftKey: true }),
          press(row, "ArrowRight", { altKey: true, shiftKey: true }),
        ].every(Boolean),
      ).toBe(true);
      expect(root()).not.toHaveAttribute("data-editing");
      expect(alt(row, "ArrowRight")).toBe(false);
      press(row, "Escape");
      view.unmount();

      // Right-to-left: editing is off altogether.
      render(
        <div dir="rtl">
          <CunninghamProvider>
            <Gantt
              aria-label="Plan"
              tasks={EDIT_TASKS}
              zoom="day"
              today="2026-03-23"
              editable
              onTaskChange={onTaskChange}
            />
          </CunninghamProvider>
        </div>,
      );
      expect(chords(focused("Write the brief"))).toBe(true);
      expect(taskRow("Write the brief")).not.toHaveAttribute(
        "aria-keyshortcuts",
      );
      expect(document.querySelector(".c__gantt__handle")).toBeNull();
      expect(screen.queryByRole("status")).toBeNull();
      expect(onTaskChange).not.toHaveBeenCalled();
    });

    it("a chord during a pointer drag is left alone and the drag goes on", () => {
      const onTaskChange = vi.fn();
      editGantt({ onTaskChange });
      const row = focused("Write the brief");
      const el = barOf("Write the brief");
      down(el);
      moveTo(el, 100 + 2 * 40);
      expect(alt(row, "ArrowRight")).toBe(true);
      expect(press(row, "Enter")).toBe(true);
      up(el, 100 + 2 * 40);
      expect(onTaskChange).toHaveBeenCalledTimes(1);
      expect(onTaskChange).toHaveBeenCalledWith("a", {
        start: "2026-03-04",
        end: "2026-03-15",
      });
    });

    it("describes the shortcuts on editable rows only; the row name stays during a session", () => {
      editGantt({
        tasks: [
          ...EDIT_TASKS,
          { id: "f", name: "Forever", start: "0001-01-01", end: "9999-12-31" },
        ],
      });
      const row = taskRow("Write the brief");
      expect(row).toHaveAttribute(
        "aria-keyshortcuts",
        "Alt+ArrowLeft Alt+ArrowRight Shift+ArrowLeft Shift+ArrowRight Enter Escape",
      );
      expect(row).toHaveAccessibleDescription(
        "Alt plus Left or Right arrow moves the task by one step of the zoom. Shift plus Left or Right arrow changes its end date. Enter confirms, Escape cancels.",
      );
      for (const name of ["Plan the launch", "Forever"]) {
        expect(taskRow(name)).not.toHaveAttribute("aria-keyshortcuts");
        expect(taskRow(name)).not.toHaveAttribute("aria-describedby");
      }
      const label = row.getAttribute("aria-label");
      row.focus();
      alt(row, "ArrowRight");
      shift(row, "ArrowRight");
      expect(row).toHaveAttribute("aria-label", label!);
    });

    it.each([
      [
        "en-US",
        [
          "Write the brief: March 3, 2026 to March 14, 2026",
          "Write the brief: March 4, 2026 to March 15, 2026",
          "Write the brief rescheduled: March 4, 2026 to March 15, 2026",
          "Write the brief: change cancelled, dates restored",
        ],
      ],
      [
        "fr-FR",
        [
          "Write the brief : du 3 mars 2026 au 14 mars 2026",
          "Write the brief : du 4 mars 2026 au 15 mars 2026",
          "Write the brief replanifiée : du 4 mars 2026 au 15 mars 2026",
          "Write the brief : modification annulée, dates rétablies",
        ],
      ],
    ])("%s: announces each step, the commit and the cancel", (locale, said) => {
      renderGantt(
        {
          tasks: EDIT_TASKS,
          zoom: "day",
          editable: true,
          onTaskChange: vi.fn(),
        },
        locale,
      );
      const row = focused("Write the brief");
      const heard: (string | null)[] = [];
      alt(row, "ArrowRight");
      heard.push(status().textContent);
      alt(row, "ArrowRight");
      heard.push(status().textContent);
      press(row, "Enter");
      heard.push(status().textContent);
      alt(row, "ArrowRight");
      press(row, "Escape");
      heard.push(status().textContent);
      expect(heard).toEqual(said);
    });

    it("stops at the edges of the axis, also for a move after a longer end", () => {
      const onTaskChange = vi.fn();
      editGantt({ onTaskChange });
      // Frame starts on the axis origin.
      const row = focused("Frame");
      alt(row, "ArrowLeft");
      expect(start("Frame")).toBe(0);
      expect(barOf("Frame")).toHaveAttribute("data-clamped");
      expect(tip()).toHaveTextContent("Limit of the chart reached");
      expect(status()).toHaveTextContent("Limit of the chart reached");
      press(row, "Enter");
      expect(onTaskChange).not.toHaveBeenCalled();
      // The end pushed to the axis end, a move would cross it: refused.
      for (let i = 0; i < 10; i++) shift(row, "ArrowRight");
      expect(tip()).toHaveTextContent("Limit of the chart reached");
      alt(row, "ArrowRight");
      expect(start("Frame")).toBe(0);
      expect(tip()).toHaveTextContent("Limit of the chart reached");
      press(row, "Enter");
      expect(onTaskChange).toHaveBeenCalledTimes(1);
      expect(onTaskChange.mock.calls[0][1].start).toBe("2026-01-04");
    });

    it("unmounted mid-session, it leaves Escape and blur to the page", () => {
      const outer = vi.fn();
      try {
        const { unmount } = editGantt();
        alt(focused("Write the brief"), "ArrowRight");
        expect(root()).toHaveAttribute("data-editing", "move");
        unmount();
        document.addEventListener("keydown", outer);
        fireEvent.keyDown(document.body, { key: "Escape" });
        expect(outer).toHaveBeenCalledTimes(1);
      } finally {
        document.removeEventListener("keydown", outer);
      }
    });
  });
});

describe("Gantt tokens", () => {
  it("emits every token of tokens.ts in the generated :root block", () => {
    const css = read("../../cunningham-tokens.css");
    const root = css.split(":root {")[1]?.split("}")[0] ?? "";
    for (const key of Object.keys(tokens(defaultTokenRefs))) {
      expect(root).toContain(`--c--components--gantt--${key}:`);
    }
  });
});

// Bodies (nested blocks included) of every block whose header matches.
const blocks = (scss: string, header: RegExp) => {
  const found: string[] = [];
  const re = new RegExp(`${header.source}[^{;]*\\{`, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(scss))) {
    let depth = 1;
    let end = match.index + match[0].length;
    const start = end;
    while (depth > 0 && end < scss.length) {
      if (scss[end] === "{") depth++;
      if (scss[end] === "}") depth--;
      end++;
    }
    found.push(scss.slice(start, end - 1));
  }
  return found.join("\n");
};

describe("Gantt stylesheet", () => {
  const scss = () =>
    read("index.scss")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");

  it("reads colours and sizes from tokens, never literals", () => {
    const source = scss();
    for (const property of [
      "background-color",
      "color",
      "border-radius",
      "block-size",
      "padding-inline",
    ]) {
      expect(source).toMatch(
        new RegExp(`${property}:\\s*var\\(--c--components--gantt--`),
      );
    }
    expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(source).not.toMatch(/rgba?\(/);
    expect(source).not.toMatch(/\d(px|rem)\b/);
  });

  it("marks the pressed zoom with an underline in the ring tokens, kept in forced colors", () => {
    const source = scss();
    const pressed = blocks(source, /\[aria-pressed="true"\]/);
    expect(pressed).toMatch(
      /text-decoration:\s*underline\s+var\(--c--components--gantt--focus-ring-width\)\s+var\(--c--components--gantt--focus-ring-color\);/,
    );
    expect(blocks(source, /@media \(forced-colors: active\)/)).toMatch(
      /\[aria-pressed="true"\][^{]*\{\s*text-decoration-color:\s*Highlight;/,
    );
  });

  it("freezes the task column and the axis with sticky positioning", () => {
    const source = scss();
    expect(blocks(source, /&__task\b/)).toMatch(/position:\s*sticky;/);
    expect(blocks(source, /&__axis\b/)).toMatch(/position:\s*sticky;/);
  });

  it("draws the ring from tokens, with forced-colors and reduced-motion rules", () => {
    const source = scss();
    expect(blocks(source, /:focus-visible/)).toMatch(
      /outline:\s*var\(--c--components--gantt--focus-ring-width\)\s+solid\s+var\(--c--components--gantt--focus-ring-color\);[\s\S]*outline-offset:\s*var\(--c--components--gantt--focus-ring-offset\);/,
    );
    const forced = blocks(source, /@media \(forced-colors: active\)/);
    expect(forced).toMatch(/outline-color:\s*Highlight;/);
    expect(forced).toMatch(/border-color:\s*CanvasText;/);
    expect(blocks(source, /@media \(prefers-reduced-motion: reduce\)/)).toMatch(
      /transition:\s*none;/,
    );
  });

  it("editing: grab cursors only when editable, no lag, no selection, forced colors", () => {
    const source = scss();
    const editable = blocks(source, /&\[data-editable\]/);
    const editing = blocks(source, /&\[data-editing[^\]]*\]/);
    expect(editable).toMatch(/cursor:\s*grab;/);
    expect(editing).toMatch(/cursor:\s*grabbing;/);
    expect(editing).toMatch(/transition:\s*none;/);
    expect(editing).toMatch(/user-select:\s*none;/);
    // Read-only bars keep the s22 cursor: every cursor rule is an editing one.
    const cursors = (text: string) => text.match(/cursor:/g)?.length ?? 0;
    expect(cursors(editable) + cursors(editing)).toBe(cursors(source));
    expect(blocks(source, /&__ghost\b/)).toMatch(
      /border:\s*var\(--c--components--gantt--border-width\)\s+dashed\s+var\(--c--components--gantt--ghost-border-color\);/,
    );
    const tipBlock = blocks(source, /&__tip\b/);
    expect(tipBlock).toMatch(
      /background-color:\s*var\(--c--components--gantt--tooltip-background-color\);/,
    );
    expect(tipBlock).toMatch(
      /color:\s*var\(--c--components--gantt--tooltip-color\);/,
    );
    expect(blocks(source, /\[data-preview\]/)).toMatch(
      /outline:\s*var\(--c--components--gantt--focus-ring-width\)\s+solid\s+var\(--c--components--gantt--drag-outline-color\);/,
    );
    const forced = blocks(source, /@media \(forced-colors: active\)/);
    expect(blocks(forced, /&__ghost\b/)).toMatch(/border-color:\s*CanvasText;/);
    expect(blocks(forced, /&__tip\b/)).toMatch(/background-color:\s*Canvas;/);
    expect(blocks(forced, /&__tip\b/)).toMatch(/color:\s*CanvasText;/);
    expect(blocks(forced, /\[data-preview\]/)).toMatch(
      /outline-color:\s*Highlight;/,
    );
  });

  it("resizing: handle hit area from tokens, touch-action on bars and handles only, invalid outline", () => {
    const source = scss();
    const handle = blocks(source, /&__handle\b/);
    expect(handle).toMatch(
      /--gantt-handle-width:\s*min\(\s*var\(--c--components--gantt--handle-hit-size\),\s*calc\(var\(--gantt-span\) \* var\(--gantt-day-width\) \/ 3\)\s*\);/,
    );
    expect(handle).toMatch(/inline-size:\s*var\(--gantt-handle-width\);/);
    expect(handle).toMatch(/--c--components--gantt--row-height/);
    expect(blocks(source, /&\[data-editable\] &__handle\b/)).toMatch(
      /cursor:\s*ew-resize;/,
    );
    expect(blocks(source, /&\[data-editing\^="resize"\]/)).toMatch(
      /cursor:\s*ew-resize;/,
    );
    // Fingers on the track or the task column still scroll the box.
    const touch = (text: string) => text.match(/touch-action:/g)?.length ?? 0;
    const surfaces = blocks(
      source,
      /&\[data-editable\] &__bar,\s*&\[data-editable\] &__handle/,
    );
    expect(surfaces).toMatch(/touch-action:\s*none;/);
    expect(touch(surfaces)).toBe(touch(source));
    expect(blocks(source, /&__handle::after/)).toMatch(
      /background-color:\s*var\(--c--components--gantt--handle-grip-color\);/,
    );
    expect(blocks(source, /&__bar\[data-clamped\]/)).toMatch(
      /outline-color:\s*var\(--c--components--gantt--invalid-color\);/,
    );
    const forced = blocks(source, /@media \(forced-colors: active\)/);
    expect(blocks(forced, /&__handle::after/)).toMatch(
      /background-color:\s*CanvasText;/,
    );
    expect(blocks(forced, /\[data-clamped\]/)).toMatch(
      /outline-color:\s*Highlight;/,
    );
  });
});

// Contrast, technique of `button/focus-ring.spec.tsx` (helpers copied: known
// duplication, kept local to each spec). Reads the emitted component
// variables, so a token change is caught here.
describe("Gantt contrast", () => {
  const css = read("../../cunningham-tokens.css");
  // Theme blocks hold flat declarations only: the first `}` closes the block.
  const declarations = (selector: string) => {
    const body = css.split(`${selector}{`)[1]?.split("}")[0];
    if (!body) throw new Error(`No ${selector} block in cunningham-tokens.css`);
    return Object.fromEntries(
      [...body.matchAll(/(--c--[\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [
        k,
        v.trim(),
      ]),
    );
  };
  const root = declarations(":root ");
  const resolveVar = (theme: Record<string, string>, name: string): string => {
    const value = theme[name] ?? root[name];
    if (value === undefined) throw new Error(`Undefined ${name}`);
    const ref = value.match(/^var\((--[\w-]+)\)$/);
    return ref ? resolveVar(theme, ref[1]) : value;
  };
  const luminance = (hex: string) => {
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a: string, b: string) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const gantt = (key: string) => `--c--components--gantt--${key}`;

  it.each([
    "default",
    "dark",
    "dsfr-light",
    "dsfr-dark",
    "anct-light",
    "anct-dark",
  ])(
    "%s: bar and ring >= 3:1 on the surface and the hover, today on the axis",
    (theme) => {
      const vars =
        theme === "default"
          ? root
          : declarations(`.cunningham-theme--${theme}`);
      for (const foreground of [
        "bar-background-color",
        "bar-border-color",
        "focus-ring-color",
      ]) {
        for (const background of [
          "background-color",
          "row-background-color--hover",
        ]) {
          expect(
            contrast(
              resolveVar(vars, gantt(foreground)),
              resolveVar(vars, gantt(background)),
            ),
            `${foreground} on ${background}`,
          ).toBeGreaterThanOrEqual(3);
        }
      }
      expect(
        contrast(
          resolveVar(vars, gantt("today-color")),
          resolveVar(vars, gantt("header-background-color")),
        ),
      ).toBeGreaterThanOrEqual(3);
      // Pressed zoom cue (underline drawn with the ring colour, see the
      // stylesheet test) on the page and on the pressed button's fill.
      for (const background of [
        "--c--contextuals--background--surface--primary",
        "--c--contextuals--background--semantic--brand--secondary",
      ]) {
        expect(
          contrast(
            resolveVar(vars, gantt("focus-ring-color")),
            resolveVar(vars, background),
          ),
          `pressed cue on ${background}`,
        ).toBeGreaterThanOrEqual(3);
      }
      // Editing (s23): ghost on the row and its hover, outline on the row,
      // tooltip text on its chip.
      const pairs: [string, string, number][] = [
        ["ghost-border-color", "background-color", 3],
        ["ghost-border-color", "row-background-color--hover", 3],
        ["drag-outline-color", "background-color", 3],
        ["tooltip-color", "tooltip-background-color", 4.5],
        // Resizing: grips on the bar fill, invalid outline on the row.
        ["handle-grip-color", "bar-background-color", 3],
        ["invalid-color", "background-color", 3],
        ["invalid-color", "row-background-color--hover", 3],
      ];
      for (const [foreground, background, min] of pairs) {
        expect(
          contrast(
            resolveVar(vars, gantt(foreground)),
            resolveVar(vars, gantt(background)),
          ),
          `${foreground} on ${background}`,
        ).toBeGreaterThanOrEqual(min);
      }
    },
  );
});
