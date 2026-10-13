import { readFileSync } from "fs";
import { resolve } from "path";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultTokenRefs } from "@gouvfr-lasuite/ui-tokens";
import { parseDate } from "@internationalized/date";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { Gantt, GanttDependency, GanttProps, GanttTask } from "./index";
import { MAX_LINKS, routeOf } from "./links";
import { buildScale, MAX_DAYS } from "./scale";
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

// Pointer events, capture and a track of `pxPerDay()` pixels per day; with
// `rowTop`, task rows 40px tall on a 41px pitch from `rowTop()` and a large
// scroll box (link targets). Returns the restore.
const stubPointer = (pxPerDay: () => number, rowTop?: () => number) => {
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
      return new DOMRect(0, 0, days * pxPerDay(), 40);
    }
    if (rowTop && this.matches(".c__gantt__row")) {
      const i = Number(this.getAttribute("aria-rowindex")) - 2;
      return new DOMRect(0, rowTop() + i * 41, 4000, 40);
    }
    if (rowTop && this.matches(".c__gantt__scroller")) {
      return new DOMRect(0, 0, 4000, 2000);
    }
    return getBoundingClientRect.call(this);
  };
  return () => {
    proto.getBoundingClientRect = getBoundingClientRect;
    win.PointerEvent = pointer;
  };
};

describe("Gantt pointer move (s23)", () => {
  let px = 40;
  beforeEach(() => {
    px = 40;
    return stubPointer(() => px);
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

// Dependencies (s24). en-US weeks start on Sunday: the axis starts on
// 2026-03-01; Release starts the day after Build ends (no conflict).
const DEP_TASKS = deepFreeze([
  { id: "a", name: "Brief", start: "2026-03-02", end: "2026-03-06" },
  { id: "b", name: "Build", start: "2026-03-16", end: "2026-03-27" },
  { id: "c", name: "Review", start: "2026-03-09", end: "2026-03-10" },
  { id: "d", name: "Plan" },
  { id: "e", name: "Release", start: "2026-03-28", end: "2026-04-03" },
]);
const freezeLinks = (links: GanttDependency[]) =>
  Object.freeze(links.map((link) => Object.freeze({ ...link })));
// Valid: a>b, a>c, b>c (conflict: Review starts before Build ends), b>e,
// a>d (Plan has no dates: listed, not drawn). The rest is ignored.
const DEPS = freezeLinks([
  { from: "a", to: "b" },
  { from: "a", to: "zz" },
  { from: "a", to: "c" },
  { from: "a", to: "a" },
  { from: "b", to: "c" },
  { from: "a", to: "b" },
  { from: "b", to: "e" },
  { from: "a", to: "d" },
]) as GanttDependency[];

describe("Gantt dependencies (s24)", () => {
  let px = 40;
  beforeEach(() => {
    px = 40;
    return stubPointer(() => px);
  });

  const depGantt = (props: Partial<GanttProps> = {}, locale = "en-US") =>
    renderGantt(
      { tasks: DEP_TASKS, dependencies: DEPS, zoom: "day", ...props },
      locale,
    );
  const overlay = () => document.querySelector<HTMLElement>(".c__gantt__links");
  const linkEl = (from: string, to: string) =>
    document.querySelector<HTMLElement>(
      `.c__gantt__link[data-from="${from}"][data-to="${to}"]`,
    );
  const segmentsOf = (from: string, to: string) =>
    Array.from(
      linkEl(from, to)?.querySelectorAll<HTMLElement>(
        ".c__gantt__link-segment",
      ) ?? [],
    );
  // A segment's two corners as written in its custom properties.
  const corners = (segment: HTMLElement) =>
    [1, 2].map((n) => ({
      day: Number(cssVar(segment, `--gantt-x${n}`)),
      gutters: Number(cssVar(segment, `--gantt-g${n}`)),
      leads: Number(cssVar(segment, `--gantt-l${n}`)),
      row: Number(cssVar(segment, `--gantt-y${n}`)),
      centre: cssVar(segment, `--gantt-c${n}`) === "1",
    }));
  const scroller = () =>
    document.querySelector<HTMLElement>(".c__gantt__scroller")!;
  const list = () => screen.queryByRole("list", { name: "Dependencies" });
  const description = (name: string) =>
    taskRow(name)
      .getAttribute("aria-describedby")
      ?.split(" ")
      .map((id) => document.getElementById(id)?.textContent)
      .join(" ");
  const barOf = (name: string) => bar(taskRow(name))!;
  const drag = (name: string, dx: number) => {
    const el = barOf(name);
    fireEvent.pointerDown(el, { clientX: 100, button: 0, pointerId: 1 });
    fireEvent.pointerMove(el, { clientX: 100 + dx, pointerId: 1 });
    return el;
  };
  const drop = (el: HTMLElement, dx: number) =>
    fireEvent.pointerUp(el, { clientX: 100 + dx, pointerId: 1 });

  it("without dependencies the DOM is s23's: no overlay, no list, no description, no scroll listener", () => {
    const add = vi.spyOn(HTMLElement.prototype, "addEventListener");
    try {
      for (const dependencies of [undefined, []]) {
        const { unmount } = renderGantt({
          tasks: DEP_TASKS,
          zoom: "day",
          dependencies,
        });
        expect(overlay()).toBeNull();
        expect(screen.queryByRole("list")).toBeNull();
        for (const row of screen.getAllByRole("row").slice(1)) {
          expect(row).not.toHaveAttribute("aria-describedby");
        }
        const grid = screen.getByRole("grid");
        expect(grid.querySelectorAll(":scope > .c__gantt__row")).toHaveLength(
          5,
        );
        expect(
          add.mock.contexts.some(
            (el, i) => el === scroller() && add.mock.calls[i][0] === "scroll",
          ),
        ).toBe(false);
        unmount();
      }
    } finally {
      add.mockRestore();
    }
  });

  it("draws valid links from the end of one bar to the start of the other, in an inert overlay (AC1)", () => {
    depGantt();
    const layer = overlay()!;
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer).not.toHaveAttribute("role");
    expect(layer).not.toHaveClass("c__gantt__row");
    expect(
      layer.querySelectorAll("[tabindex], button, a, input, [role]"),
    ).toHaveLength(0);
    // The roving tab stop still sees the task rows only.
    const grid = screen.getByRole("grid");
    expect(grid.querySelectorAll(":scope > .c__gantt__row")).toHaveLength(5);
    expect(screen.getAllByRole("row")).toHaveLength(6);

    const scale = buildScale({
      tasks: DEP_TASKS,
      zoom: "day",
      locale: "en-US",
      today: parseDate("2026-03-23"),
    });
    const place = (id: string) => ({
      row: DEP_TASKS.findIndex((task) => task.id === id),
      ...scale.positionOf(DEP_TASKS.find((task) => task.id === id)!)!,
    });
    const drawn = [
      ["a", "b"],
      ["a", "c"],
      ["b", "c"],
      ["b", "e"],
    ];
    expect(layer.querySelectorAll(".c__gantt__link")).toHaveLength(
      drawn.length,
    );
    for (const [from, to] of drawn) {
      const route = routeOf(place(from), place(to), scale);
      expect(segmentsOf(from, to).map(corners)).toEqual(route);
      // From the predecessor's end to the successor's start.
      const first = route[0][0];
      const last = route[route.length - 1][1];
      expect(first.day).toBe(place(from).start + place(from).span);
      expect([last.day, last.leads, last.gutters]).toEqual([
        place(to).start,
        0,
        0,
      ]);
    }
    // Unknown, self, duplicate and dateless links draw nothing.
    expect(linkEl("a", "zz")).toBeNull();
    expect(linkEl("a", "a")).toBeNull();
    expect(linkEl("a", "d")).toBeNull();
  });

  it("keeps each link's DOM across re-renders with equal data", () => {
    const { rerender } = depGantt();
    const before = segmentsOf("b", "e");
    expect(before.length).toBeGreaterThan(0);
    rerender(
      <CunninghamProvider currentLocale="en-US">
        <Gantt
          aria-label="Project schedule"
          tasks={[...DEP_TASKS]}
          dependencies={DEPS.map((link) => ({ ...link }))}
          zoom="day"
          today="2026-03-23"
        />
      </CunninghamProvider>,
    );
    const after = segmentsOf("b", "e");
    expect(after).toHaveLength(before.length);
    after.forEach((segment, i) => expect(segment).toBe(before[i]));
  });

  it("a link to a task outside the window is listed, not drawn", () => {
    renderGantt({
      zoom: "month",
      tasks: [
        { id: "x", name: "Archive", start: "2000-01-03", end: "2000-01-07" },
        { id: "y", name: "Brief", start: "2026-03-02", end: "2026-03-06" },
        { id: "z", name: "Build", start: "2026-03-16", end: "2026-03-27" },
      ],
      dependencies: [
        { from: "x", to: "y" },
        { from: "y", to: "z" },
      ],
    });
    expect(bar(taskRow("Archive"))).toBeNull();
    expect(document.querySelectorAll(".c__gantt__link")).toHaveLength(1);
    expect(linkEl("y", "z")).not.toBeNull();
    expect(within(list()!).getAllByRole("listitem")).toHaveLength(2);
  });

  it("flags a conflict from the data with a shape and a marker, none the day after (AC4)", () => {
    depGantt();
    expect(linkEl("b", "c")).toHaveAttribute("data-conflict");
    expect(
      linkEl("b", "c")!.querySelector(".c__gantt__link-flag"),
    ).toHaveTextContent("!");
    for (const [from, to] of [
      ["a", "b"],
      ["a", "c"],
      ["b", "e"],
    ]) {
      expect(linkEl(from, to)).not.toHaveAttribute("data-conflict");
      expect(
        linkEl(from, to)!.querySelector(".c__gantt__link-flag"),
      ).toBeNull();
    }
  });

  it("shows a conflict live while a predecessor moves, follows the preview, and Escape clears it (AC4)", () => {
    const onTaskChange = vi.fn();
    depGantt({ editable: true, onTaskChange });
    const status = () => screen.getByRole("status");
    const firstX = () => cssVar(segmentsOf("a", "b")[0], "--gantt-x1");
    const unrelated = segmentsOf("b", "e");
    expect(firstX()).toBe("6");
    // Brief moved 3 days: it ends on Review's first day.
    drag("Brief", 3 * 40);
    expect(linkEl("a", "c")).toHaveAttribute("data-conflict");
    expect(firstX()).toBe("9");
    expect(status()).toHaveTextContent(
      "Conflict: Review starts before Brief ends",
    );
    // Same conflicts one more day on: not announced again.
    fireEvent.pointerMove(barOf("Brief"), { clientX: 100 + 4 * 40 });
    expect(firstX()).toBe("10");
    expect(status()).toHaveTextContent("Brief:");
    expect(status()).not.toHaveTextContent("Conflict");
    // The row keeps its name.
    expect(taskRow("Review")).toHaveAttribute(
      "aria-label",
      "Review, from March 9, 2026 to March 10, 2026",
    );
    segmentsOf("b", "e").forEach((segment, i) =>
      expect(segment).toBe(unrelated[i]),
    );
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(linkEl("a", "c")).not.toHaveAttribute("data-conflict");
    expect(firstX()).toBe("6");
    expect(onTaskChange).not.toHaveBeenCalled();
  });

  it("never announces a conflict already in the data, only one a session creates, once", () => {
    const { rerender } = depGantt({ editable: true, onTaskChange: vi.fn() });
    const status = () => screen.getByRole("status");
    // Build > Review is in conflict from the start: shown, not spoken.
    expect(linkEl("b", "c")).toHaveAttribute("data-conflict");
    expect(status()).toHaveTextContent("");
    rerender(
      <CunninghamProvider currentLocale="en-US">
        <Gantt
          aria-label="Project schedule"
          tasks={[...DEP_TASKS]}
          dependencies={[...DEPS]}
          zoom="day"
          today="2026-03-23"
          editable
          onTaskChange={vi.fn()}
        />
      </CunninghamProvider>,
    );
    expect(status()).not.toHaveTextContent("Conflict");
    drag("Brief", 3 * 40);
    expect(status().textContent).toBe(
      "Brief: March 5, 2026 to March 9, 2026 Conflict: Review starts before Brief ends",
    );
  });

  it("moving a successor earlier shows the conflict too", () => {
    depGantt({ editable: true, onTaskChange: vi.fn() });
    expect(linkEl("a", "c")).not.toHaveAttribute("data-conflict");
    drag("Review", -3 * 40);
    expect(linkEl("a", "c")).toHaveAttribute("data-conflict");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Conflict: Review starts before Brief ends",
    );
  });

  it("a committed move keeps the conflict once the parent applies it; onTaskChange is s23's", () => {
    const onTaskChange = vi.fn();
    const Parent = () => {
      const [tasks, setTasks] = useState(DEP_TASKS);
      return (
        <CunninghamProvider>
          <Gantt
            aria-label="Plan"
            tasks={tasks}
            dependencies={DEPS}
            zoom="day"
            today="2026-03-23"
            editable
            onTaskChange={(id, change) => {
              onTaskChange(id, change);
              setTasks((all) =>
                all.map((task) =>
                  task.id === id ? { ...task, ...change } : task,
                ),
              );
            }}
          />
        </CunninghamProvider>
      );
    };
    render(<Parent />);
    drop(drag("Brief", 3 * 40), 3 * 40);
    expect(onTaskChange).toHaveBeenCalledTimes(1);
    expect(onTaskChange).toHaveBeenCalledWith("a", {
      start: "2026-03-05",
      end: "2026-03-09",
    });
    expect(linkEl("a", "c")).toHaveAttribute("data-conflict");
    expect(cssVar(segmentsOf("a", "b")[0], "--gantt-x1")).toBe("9");
  });

  it("describes each row's dependencies, read-only too, and lists every valid link outside the grid (AC5)", () => {
    depGantt();
    expect(description("Brief")).toBe("Required by: Build, Review, Plan.");
    expect(description("Build")).toBe(
      "Starts after: Brief. Required by: Review, Release. Conflict with: Review.",
    );
    expect(description("Review")).toBe(
      "Starts after: Brief, Build. Conflict with: Build.",
    );
    expect(description("Plan")).toBe("Starts after: Brief.");
    expect(taskRow("Build")).toHaveAttribute(
      "aria-label",
      "Build, from March 16, 2026 to March 27, 2026",
    );
    const dependencies = list()!;
    expect(dependencies.closest('[role="grid"]')).toBeNull();
    expect(
      within(dependencies)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual([
      "Brief must finish before Build starts",
      "Brief must finish before Review starts",
      "Build must finish before Review starts. Conflict: Review starts on March 9, 2026, Build ends on March 27, 2026",
      "Build must finish before Release starts",
      "Brief must finish before Plan starts",
    ]);
  });

  it("speaks French with the provider locale", () => {
    depGantt({}, "fr-FR");
    expect(description("Review")).toBe(
      "Commence après : Brief et Build. Conflit avec : Build.",
    );
    expect(
      screen.getByRole("list", { name: "Dépendances" }).firstElementChild,
    ).toHaveTextContent("Brief doit se terminer avant le début de Build");
  });

  it("appends the description to the editing instructions; more than five names end with +N", () => {
    const hub = {
      id: "h",
      name: "Hub",
      start: "2026-04-20",
      end: "2026-04-24",
    };
    const preds = Array.from({ length: 7 }, (_, i) => ({
      id: `p${i}`,
      name: `P${i + 1}`,
      start: "2026-03-02",
      end: "2026-03-06",
    }));
    renderGantt({
      tasks: [...preds, hub],
      zoom: "day",
      editable: true,
      dependencies: preds.map((p) => ({ from: p.id, to: "h" })),
    });
    const ids = taskRow("Hub").getAttribute("aria-describedby")!.split(" ");
    expect(ids).toHaveLength(2);
    expect(document.getElementById(ids[0])).toHaveTextContent(
      "Alt plus Left or Right arrow",
    );
    expect(document.getElementById(ids[1])).toHaveTextContent(
      "Starts after: P1, P2, P3, P4, P5, +2.",
    );
  });

  it("draws and lists at most MAX_LINKS links", () => {
    const tasks = Array.from({ length: 40 }, (_, i) => ({
      id: `t${i}`,
      name: `T${i}`,
      start: "2026-03-02",
      end: "2026-03-06",
    }));
    const dependencies: GanttDependency[] = [];
    for (const from of tasks)
      for (const to of tasks)
        if (from !== to && dependencies.length < 1500)
          dependencies.push({ from: from.id, to: to.id });
    renderGantt({ tasks, dependencies, zoom: "week" });
    expect(document.querySelectorAll(".c__gantt__link")).toHaveLength(
      MAX_LINKS,
    );
    expect(within(list()!).getAllByRole("listitem")).toHaveLength(MAX_LINKS);
  });

  it("right to left: no overlay, the list stays", () => {
    render(
      <CunninghamProvider>
        <div dir="rtl">
          <Gantt
            aria-label="Plan"
            tasks={DEP_TASKS}
            dependencies={DEPS}
            today="2026-03-23"
          />
        </div>
      </CunninghamProvider>,
    );
    expect(overlay()).toBeNull();
    expect(within(list()!).getAllByRole("listitem")).toHaveLength(5);
  });

  it("clips the overlay to the scroll offset on the next frame, one listener removed on unmount", () => {
    const frames = new Map<number, FrameRequestCallback>();
    let next = 0;
    const raf = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb) => (frames.set(++next, cb), next));
    const caf = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation((id) => void frames.delete(id));
    const add = vi.spyOn(HTMLElement.prototype, "addEventListener");
    const remove = vi.spyOn(HTMLElement.prototype, "removeEventListener");
    try {
      const { unmount } = depGantt();
      const box = scroller();
      const added = add.mock.calls.filter(
        (call, i) => add.mock.contexts[i] === box && call[0] === "scroll",
      );
      expect(added).toHaveLength(1);
      box.scrollLeft = 300;
      fireEvent.scroll(box);
      fireEvent.scroll(box);
      expect(frames.size).toBe(1);
      const [frame] = frames.values();
      frames.clear();
      frame(0);
      expect(cssVar(overlay(), "--gantt-scroll")).toBe("300px");
      // A pending frame is cancelled with the listener.
      fireEvent.scroll(box);
      expect(frames.size).toBe(1);
      unmount();
      expect(frames.size).toBe(0);
      expect(
        remove.mock.calls.some(
          (call, i) =>
            remove.mock.contexts[i] === box &&
            call[0] === "scroll" &&
            call[1] === added[0][1],
        ),
      ).toBe(true);
    } finally {
      raf.mockRestore();
      caf.mockRestore();
      add.mockRestore();
      remove.mockRestore();
    }
  });
});

// Link editing with the pointer (s24 t03). Rows: Brief 0, Build 1, Review 2,
// Plan 3 (no dates), Release 4; existing links of DEPS: a>b, a>c, b>c, b>e,
// a>d. Review to Release is a free pair.
describe("Gantt link editing (s24)", () => {
  let px = 40;
  let top = 42;
  beforeEach(() => {
    px = 40;
    top = 42;
    return stubPointer(
      () => px,
      () => top,
    );
  });

  const NAMES = ["Brief", "Build", "Review", "Plan", "Release"];
  const rowY = (name: string) => top + NAMES.indexOf(name) * 41 + 20;
  const linkGantt = (props: Partial<GanttProps> = {}) =>
    renderGantt({
      tasks: DEP_TASKS,
      dependencies: DEPS,
      zoom: "day",
      editable: true,
      onDependencyChange: vi.fn(),
      ...props,
    });
  const connector = (name: string) =>
    taskRow(name).querySelector<HTMLElement>(".c__gantt__connector");
  // On the name of a row without a bar; beside a bar, in the link overlay
  // (above the lines).
  const tipOf = (name: string) => {
    const id = bar(taskRow(name))?.dataset.taskId;
    return id
      ? document.querySelector<HTMLElement>(
          `.c__gantt__links > .c__gantt__tip[data-task-id="${id}"]`,
        )
      : taskRow(name).querySelector<HTMLElement>(".c__gantt__tip");
  };
  const linkEl = (from: string, to: string) =>
    document.querySelector<HTMLElement>(
      `.c__gantt__link[data-from="${from}"][data-to="${to}"]`,
    );
  const creating = () =>
    document.querySelector<HTMLElement>(
      '.c__gantt__link[data-state="creating"]',
    );
  const status = () => screen.getByRole("status");
  const root = () =>
    screen.getByRole("grid").closest<HTMLElement>(".c__gantt")!;
  // Press a row's connector, then move over the row `to` (a name) or a
  // point `y`; returns the connector (it holds the pointer capture).
  const press = (from: string, pointerId = 1) => {
    const el = connector(from)!;
    fireEvent.pointerDown(el, {
      clientX: 500,
      clientY: rowY(from),
      button: 0,
      pointerId,
    });
    return el;
  };
  const over = (el: HTMLElement, to: string | number) =>
    fireEvent.pointerMove(el, {
      clientX: 300,
      clientY: typeof to === "number" ? to : rowY(to),
      pointerId: 1,
    });
  const release = (el: HTMLElement, to: string | number) =>
    fireEvent.pointerUp(el, {
      clientX: 300,
      clientY: typeof to === "number" ? to : rowY(to),
      pointerId: 1,
    });
  const link = (from: string, to: string | number) => {
    const el = press(from);
    over(el, to);
    release(el, to);
  };
  const hits = (from: string, to: string) =>
    Array.from(
      linkEl(from, to)!.querySelectorAll<HTMLElement>(".c__gantt__link-hit"),
    );

  it("offers a connector on dated rows only when editable with onDependencyChange, never inside a bar", () => {
    linkGantt();
    for (const name of ["Brief", "Build", "Review", "Release"]) {
      const el = connector(name);
      expect(el).not.toBeNull();
      expect(el!.closest(".c__gantt__bar")).toBeNull();
      expect(el!.closest('[role="gridcell"]')).not.toBeNull();
    }
    expect(connector("Plan")).toBeNull();
    // The overlay stays inert for the keyboard: rows keep the focus.
    expect(
      document
        .querySelector(".c__gantt__links")!
        .querySelectorAll("[tabindex], button, a, input, [role]"),
    ).toHaveLength(0);
  });

  it("gating: editable without the callback is t02's chart, and s23 editing is unchanged", () => {
    const onTaskChange = vi.fn();
    const { unmount } = linkGantt({
      onDependencyChange: undefined,
      onTaskChange,
    });
    expect(document.querySelector(".c__gantt__connector")).toBeNull();
    expect(document.querySelector(".c__gantt__link-hit")).toBeNull();
    fireEvent.click(
      linkEl("a", "b")!.querySelectorAll(".c__gantt__link-segment")[1],
    );
    expect(linkEl("a", "b")).not.toHaveAttribute("data-selected");
    expect(screen.queryByRole("button", { name: /Remove link/ })).toBeNull();
    // A move from the bar, then a resize from a handle, as in s23.
    const el = bar(taskRow("Build"))!;
    fireEvent.pointerDown(el, { clientX: 100, button: 0, pointerId: 1 });
    fireEvent.pointerMove(el, { clientX: 180, pointerId: 1 });
    fireEvent.pointerUp(el, { clientX: 180, pointerId: 1 });
    const handle = el.querySelector<HTMLElement>('[data-edge="end"]')!;
    fireEvent.pointerDown(handle, { clientX: 100, button: 0, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 140, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientX: 140, pointerId: 1 });
    expect(onTaskChange.mock.calls).toEqual([
      ["b", { start: "2026-03-18", end: "2026-03-29" }],
      ["b", { start: "2026-03-16", end: "2026-03-28" }],
    ]);
    unmount();
    // The callback without editable, or right to left: no connector either.
    const { unmount: second } = linkGantt({ editable: false });
    expect(document.querySelector(".c__gantt__connector")).toBeNull();
    second();
    render(
      <CunninghamProvider>
        <div dir="rtl">
          <Gantt
            aria-label="Plan"
            tasks={DEP_TASKS}
            dependencies={DEPS}
            today="2026-03-23"
            editable
            onDependencyChange={vi.fn()}
          />
        </div>
      </CunninghamProvider>,
    );
    expect(document.querySelector(".c__gantt__connector")).toBeNull();
  });

  it("dragging a connector onto another row reports the link once, with a prospective link and a tip (AC2)", () => {
    const onDependencyChange = vi.fn();
    linkGantt({ onDependencyChange });
    const el = press("Review");
    expect(root()).toHaveAttribute("data-editing", "link");
    // Over nothing: the source row says where to drop.
    over(el, 1500);
    expect(tipOf("Review")).toHaveTextContent("Drop on a task");
    expect(creating()).toBeNull();
    over(el, "Release");
    expect(tipOf("Release")).toHaveTextContent("Start Release after Review");
    expect(tipOf("Review")).toBeNull();
    expect(creating()).toHaveAttribute("data-from", "c");
    expect(creating()).toHaveAttribute("data-to", "e");
    release(el, "Release");
    expect(onDependencyChange).toHaveBeenCalledTimes(1);
    expect(onDependencyChange).toHaveBeenCalledWith({
      kind: "add",
      dependency: { from: "c", to: "e" },
    });
    expect(status()).toHaveTextContent("Release now starts after Review");
    expect(creating()).toBeNull();
    expect(tipOf("Release")).toBeNull();
    expect(root()).not.toHaveAttribute("data-editing");
  });

  it("the task name cell is a target too, and a scroll re-targets a still pointer", () => {
    const onDependencyChange = vi.fn();
    linkGantt({ onDependencyChange });
    const el = press("Review");
    over(el, "Plan");
    expect(tipOf("Plan")).toHaveTextContent("Not linked: Plan has no dates");
    // The box scrolls one row under the still pointer: Release is there.
    const y = rowY("Plan");
    top -= 41;
    fireEvent.scroll(
      document.querySelector<HTMLElement>(".c__gantt__scroller")!,
    );
    expect(tipOf("Release")).toHaveTextContent("Start Release after Review");
    release(el, y);
    expect(onDependencyChange).toHaveBeenCalledWith({
      kind: "add",
      dependency: { from: "c", to: "e" },
    });
  });

  it.each([
    ["a loop", "Review", "Brief", "Not linked: this would create a loop"],
    ["itself", "Review", "Review", "A task cannot depend on itself"],
    ["no dates", "Review", "Plan", "Not linked: Plan has no dates"],
    [
      "an existing pair",
      "Brief",
      "Build",
      "Not linked: Build already starts after Brief",
    ],
  ])(
    "refuses %s with a sentence in the row and the live region, and reports nothing (AC3)",
    (_, from, to, sentence) => {
      vi.useFakeTimers();
      try {
        const onDependencyChange = vi.fn();
        linkGantt({ onDependencyChange });
        link(from, to);
        expect(onDependencyChange).not.toHaveBeenCalled();
        expect(tipOf(to)).toHaveTextContent(sentence);
        expect(tipOf(to)).toHaveAttribute("data-refused");
        const target = bar(taskRow(to));
        if (target) expect(target).toHaveAttribute("data-refused");
        expect(status()).toHaveTextContent(sentence);
        expect(creating()).toBeNull();
        expect(root()).not.toHaveAttribute("data-editing");
        // No timer: it stays until the user does something.
        act(() => vi.advanceTimersByTime(10_000));
        expect(tipOf(to)).toHaveTextContent(sentence);
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it("refuses a link past MAX_LINKS", () => {
    const tasks = Array.from({ length: 50 }, (_, i) => ({
      id: `t${i}`,
      name: `T${i}`,
      start: "2026-03-02",
      end: "2026-03-06",
    }));
    const dependencies: GanttDependency[] = [];
    for (let i = 0; i < 50 && dependencies.length < MAX_LINKS; i++)
      for (let j = i + 1; j < 50 && dependencies.length < MAX_LINKS; j++)
        dependencies.push({ from: `t${i}`, to: `t${j}` });
    // Full, and t38 > t39 is not among the first 1000 forward pairs.
    expect(dependencies).toHaveLength(MAX_LINKS);
    expect(dependencies.some((d) => d.from === "t38")).toBe(false);
    const onDependencyChange = vi.fn();
    linkGantt({ tasks, dependencies, onDependencyChange });
    const el = connector("T38")!;
    const y = (i: number) => top + i * 41 + 20;
    fireEvent.pointerDown(el, { clientX: 500, clientY: y(38), button: 0 });
    fireEvent.pointerMove(el, { clientX: 300, clientY: y(39) });
    fireEvent.pointerUp(el, { clientX: 300, clientY: y(39) });
    expect(onDependencyChange).not.toHaveBeenCalled();
    expect(status()).toHaveTextContent(
      `Not linked: a chart holds at most ${MAX_LINKS} links`,
    );
  });

  it.each([
    ["a pointer down", () => fireEvent.pointerDown(document.body)],
    ["a key press", () => fireEvent.keyDown(document.body, { key: "Shift" })],
    ["a focus change", () => taskRow("Build").focus()],
  ])("the refusal sentence goes with %s", (_, action) => {
    linkGantt();
    link("Review", "Brief");
    expect(tipOf("Brief")).not.toBeNull();
    act(action);
    expect(tipOf("Brief")).toBeNull();
    expect(bar(taskRow("Brief"))).not.toHaveAttribute("data-refused");
  });

  it.each([
    ["Escape", () => fireEvent.keyDown(document.body, { key: "Escape" })],
    ["pointercancel", (el: HTMLElement) => fireEvent.pointerCancel(el)],
    [
      "lost capture",
      (el: HTMLElement) => fireEvent.lostPointerCapture(el, { pointerId: 1 }),
    ],
    ["window blur", () => fireEvent.blur(window)],
    ["a release over nothing", (el: HTMLElement) => release(el, 1500)],
  ])("%s cancels: nothing reported, announced, ghost gone", (_, cancel) => {
    const onDependencyChange = vi.fn();
    linkGantt({ onDependencyChange });
    const el = press("Review");
    over(el, "Release");
    expect(creating()).not.toBeNull();
    cancel(el);
    expect(creating()).toBeNull();
    expect(tipOf("Release")).toBeNull();
    expect(root()).not.toHaveAttribute("data-editing");
    expect(status()).toHaveTextContent("Link cancelled");
    release(el, "Release");
    expect(onDependencyChange).not.toHaveBeenCalled();
  });

  it("Escape is stopped while a link session runs, and only then", () => {
    const outer = vi.fn();
    document.addEventListener("keydown", outer);
    try {
      linkGantt();
      over(press("Review"), "Release");
      fireEvent.keyDown(document.body, { key: "Escape" });
      expect(outer).not.toHaveBeenCalled();
      fireEvent.keyDown(document.body, { key: "Escape" });
      expect(outer).toHaveBeenCalledTimes(1);
    } finally {
      document.removeEventListener("keydown", outer);
    }
  });

  it("unmounted mid link-creation, it leaves Escape, blur and scroll to the page", () => {
    const outer = vi.fn();
    document.addEventListener("keydown", outer);
    const blur = vi.spyOn(window, "removeEventListener");
    const add = vi.spyOn(HTMLElement.prototype, "addEventListener");
    const remove = vi.spyOn(HTMLElement.prototype, "removeEventListener");
    try {
      const { unmount } = linkGantt({ dependencies: [] });
      const box = document.querySelector<HTMLElement>(".c__gantt__scroller")!;
      over(press("Review"), "Release");
      const scrolls = add.mock.calls.filter(
        (call, i) => add.mock.contexts[i] === box && call[0] === "scroll",
      );
      unmount();
      fireEvent.keyDown(document.body, { key: "Escape" });
      expect(outer).toHaveBeenCalledTimes(1);
      expect(blur).toHaveBeenCalledWith("blur", expect.any(Function));
      for (const [, handler] of scrolls) {
        expect(
          remove.mock.calls.some(
            (call, i) =>
              remove.mock.contexts[i] === box &&
              call[0] === "scroll" &&
              call[1] === handler,
          ),
        ).toBe(true);
      }
      expect(scrolls.length).toBeGreaterThan(0);
    } finally {
      document.removeEventListener("keydown", outer);
      blur.mockRestore();
      add.mockRestore();
      remove.mockRestore();
    }
  });

  it.each([
    ["a refusal sentence shown", () => link("Review", "Brief")],
    ["a link selected", () => fireEvent.click(hits("a", "b")[0])],
  ])("unmounted with %s, it leaves the document listeners", (_, setUp) => {
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    try {
      const { unmount } = linkGantt();
      setUp();
      const types = ["pointerdown", "keydown", "focusin"];
      const added = add.mock.calls.filter(([type]) => types.includes(type));
      expect(added.length).toBeGreaterThan(0);
      unmount();
      for (const [type, handler] of added) {
        expect(
          remove.mock.calls.some(([t, h]) => t === type && h === handler),
          type,
        ).toBe(true);
      }
    } finally {
      add.mockRestore();
      remove.mockRestore();
    }
  });

  it("one session at a time: a connector during a move, a bar during a link", () => {
    const onTaskChange = vi.fn();
    const onDependencyChange = vi.fn();
    linkGantt({ onTaskChange, onDependencyChange });
    const build = bar(taskRow("Build"))!;
    fireEvent.pointerDown(build, { clientX: 100, button: 0, pointerId: 1 });
    fireEvent.pointerMove(build, { clientX: 180, pointerId: 1 });
    const el = press("Review", 2);
    expect(root()).toHaveAttribute("data-editing", "move");
    fireEvent.pointerMove(el, {
      clientX: 300,
      clientY: rowY("Release"),
      pointerId: 2,
    });
    fireEvent.pointerUp(el, {
      clientX: 300,
      clientY: rowY("Release"),
      pointerId: 2,
    });
    fireEvent.pointerUp(build, { clientX: 180, pointerId: 1 });
    expect(onDependencyChange).not.toHaveBeenCalled();
    expect(onTaskChange).toHaveBeenCalledTimes(1);

    const linking = press("Review");
    over(linking, "Release");
    const brief = bar(taskRow("Brief"))!;
    fireEvent.pointerDown(brief, { clientX: 100, button: 0, pointerId: 3 });
    expect(root()).toHaveAttribute("data-editing", "link");
    fireEvent.pointerUp(brief, { clientX: 140, pointerId: 3 });
    release(linking, "Release");
    expect(onTaskChange).toHaveBeenCalledTimes(1);
    expect(onDependencyChange).toHaveBeenCalledTimes(1);
  });

  it("controlled: an ignored add shows nothing; an applied one draws the first link; data never mutated", () => {
    const before = [JSON.stringify(DEP_TASKS), JSON.stringify(DEPS)];
    const { unmount } = linkGantt();
    link("Review", "Release");
    expect(linkEl("c", "e")).toBeNull();
    expect(creating()).toBeNull();
    unmount();

    const Parent = () => {
      const [dependencies, setDependencies] = useState<GanttDependency[]>([]);
      return (
        <CunninghamProvider>
          <Gantt
            aria-label="Plan"
            tasks={DEP_TASKS}
            dependencies={dependencies}
            zoom="day"
            today="2026-03-23"
            editable
            onDependencyChange={({ kind, dependency }) =>
              setDependencies((all) =>
                kind === "add"
                  ? [...all, dependency]
                  : all.filter(
                      (d) =>
                        d.from !== dependency.from || d.to !== dependency.to,
                    ),
              )
            }
          />
        </CunninghamProvider>
      );
    };
    render(<Parent />);
    link("Review", "Release");
    expect(linkEl("c", "e")).not.toBeNull();
    expect(linkEl("c", "e")).not.toHaveAttribute("data-state");
    expect(creating()).toBeNull();
    expect([JSON.stringify(DEP_TASKS), JSON.stringify(DEPS)]).toEqual(before);
  });

  it("a click on a link's middle selects it and focuses Remove in the successor row; the ends are not targets", () => {
    linkGantt();
    // Strips on the middle vertical segments only (forward a>b, U b>e).
    for (const [from, to] of [
      ["a", "b"],
      ["b", "e"],
    ]) {
      const segments = Array.from(
        linkEl(from, to)!.querySelectorAll<HTMLElement>(
          ".c__gantt__link-segment",
        ),
      );
      expect(
        hits(from, to).map((hit) => segments.indexOf(hit.parentElement!)),
      ).toEqual(
        segments.flatMap((segment, i) =>
          i > 0 && i < segments.length - 1 && segment.dataset.axis === "y"
            ? [i]
            : [],
        ),
      );
    }
    expect(hits("a", "b")).toHaveLength(1);
    expect(hits("b", "e")).toHaveLength(2);
    fireEvent.click(hits("a", "b")[0]);
    expect(linkEl("a", "b")).toHaveAttribute("data-selected");
    const remove = screen.getByRole("button", {
      name: "Remove link from Brief to Build",
    });
    expect(remove).toHaveFocus();
    expect(remove.closest('[role="gridcell"]')).not.toBeNull();
    expect(remove.closest('[role="row"]')).toBe(taskRow("Build"));
  });

  it.each(["{Enter}", " ", "{Delete}", "{Backspace}"])(
    "%s on Remove reports the removal once",
    async (key) => {
      const onDependencyChange = vi.fn();
      linkGantt({ onDependencyChange });
      fireEvent.click(hits("a", "b")[0]);
      await userEvent.keyboard(key);
      expect(onDependencyChange).toHaveBeenCalledTimes(1);
      expect(onDependencyChange).toHaveBeenCalledWith({
        kind: "remove",
        dependency: { from: "a", to: "b" },
      });
      expect(status()).toHaveTextContent(
        "Link removed: Build no longer depends on Brief",
      );
      expect(taskRow("Brief")).toHaveFocus();
    },
  );

  it("Escape deselects and gives the focus back to the predecessor row, kept from an enclosing handler", () => {
    const outer = vi.fn();
    const onDependencyChange = vi.fn();
    render(
      <CunninghamProvider>
        <div onKeyDown={outer}>
          <Gantt
            aria-label="Plan"
            tasks={DEP_TASKS}
            dependencies={DEPS}
            zoom="day"
            today="2026-03-23"
            editable
            onDependencyChange={onDependencyChange}
          />
        </div>
      </CunninghamProvider>,
    );
    fireEvent.click(hits("b", "e")[0]);
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(outer).not.toHaveBeenCalled();
    expect(linkEl("b", "e")).not.toHaveAttribute("data-selected");
    expect(screen.queryByRole("button", { name: /Remove link/ })).toBeNull();
    expect(taskRow("Build")).toHaveFocus();
    expect(taskRow("Build").tabIndex).toBe(0);
    expect(onDependencyChange).not.toHaveBeenCalled();
  });

  it("a click elsewhere deselects; the selection goes with its link", () => {
    const { rerender } = linkGantt();
    fireEvent.click(hits("a", "b")[0]);
    fireEvent.pointerDown(document.body);
    expect(linkEl("a", "b")).not.toHaveAttribute("data-selected");
    fireEvent.click(hits("a", "b")[0]);
    const props = {
      "aria-label": "Project schedule",
      tasks: DEP_TASKS,
      zoom: "day" as const,
      today: "2026-03-23",
      editable: true,
      onDependencyChange: vi.fn(),
    };
    rerender(
      <CunninghamProvider currentLocale="en-US">
        <Gantt
          {...props}
          dependencies={DEPS.filter((d) => d.from !== "a" || d.to !== "b")}
        />
      </CunninghamProvider>,
    );
    expect(screen.queryByRole("button", { name: /Remove link/ })).toBeNull();
    rerender(
      <CunninghamProvider currentLocale="en-US">
        <Gantt {...props} dependencies={DEPS} />
      </CunninghamProvider>,
    );
    expect(linkEl("a", "b")).not.toHaveAttribute("data-selected");
    expect(screen.queryByRole("button", { name: /Remove link/ })).toBeNull();
  });

  it("focusing Remove, inside a row, leaves the roving tab stop alone (s22 onFocus guard)", () => {
    linkGantt();
    const stops = () =>
      screen
        .getAllByRole("row")
        .slice(1)
        .filter((row) => row.tabIndex === 0);
    expect(stops()).toEqual([taskRow("Brief")]);
    expect(() => fireEvent.click(hits("b", "e")[0])).not.toThrow();
    expect(
      screen.getByRole("button", { name: "Remove link from Build to Release" }),
    ).toHaveFocus();
    expect(stops()).toEqual([taskRow("Brief")]);
  });

  // The keyboard path (t04): Alt+Shift+Right (this task first) or Left
  // (this task after another) on a focused row, then the arrows pick.
  describe("keyboard", () => {
    beforeEach(() => {
      Element.prototype.scrollIntoView = vi.fn();
    });

    // fireEvent returns false when the key was kept from the browser.
    const key = (
      row: HTMLElement,
      name: string,
      modifiers: Record<string, boolean> = {},
    ) => fireEvent.keyDown(row, { key: name, ...modifiers });
    const chord = (row: HTMLElement, name: "ArrowRight" | "ArrowLeft") =>
      key(row, name, { altKey: true, shiftKey: true });
    const focused = (name: string) => {
      const row = taskRow(name);
      row.focus();
      return row;
    };
    const LINK_SHORTCUTS = "Alt+Shift+ArrowLeft Alt+Shift+ArrowRight";

    it("Alt+Shift+Right: the next dated row is the successor; the arrows pick, skipping the source; Enter links once (AC2)", () => {
      const onDependencyChange = vi.fn();
      linkGantt({ onDependencyChange });
      const row = focused("Review");
      expect(chord(row, "ArrowRight")).toBe(false);
      expect(root()).toHaveAttribute("data-editing", "link");
      expect(bar(row)).toHaveAttribute("data-link-source");
      // Plan has no dates: Release is the first candidate.
      expect(creating()).toHaveAttribute("data-from", "c");
      expect(creating()).toHaveAttribute("data-to", "e");
      expect(tipOf("Release")).toHaveTextContent("Start Release after Review");
      expect(status()).toHaveTextContent(
        "Link Review to Release: Release would start after Review ends. Enter to link.",
      );
      const heard = () => status().textContent;
      expect(key(row, "ArrowUp")).toBe(false);
      expect(tipOf("Plan")).toHaveTextContent("Not linked: Plan has no dates");
      expect(creating()).toBeNull();
      expect(key(row, "ArrowUp")).toBe(false);
      // The source is skipped; two loops in a row are told apart.
      expect(tipOf("Build")).toHaveTextContent(
        "Not linked: this would create a loop",
      );
      expect(bar(taskRow("Build"))).toHaveAttribute("data-refused");
      const build = heard();
      expect(build).toBe(
        "Start Build after Review. Not linked: this would create a loop",
      );
      key(row, "ArrowUp");
      expect(tipOf("Brief")).toHaveTextContent(
        "Not linked: this would create a loop",
      );
      expect(heard()).toBe(
        "Start Brief after Review. Not linked: this would create a loop",
      );
      // Clamped at the first row: kept in the row, nothing new said.
      expect(key(row, "ArrowUp")).toBe(false);
      expect(tipOf("Brief")).not.toBeNull();
      expect(row).toHaveFocus();
      expect(key(row, "End")).toBe(false);
      expect(creating()).toHaveAttribute("data-to", "e");
      key(row, "Home");
      expect(tipOf("Brief")).not.toBeNull();
      key(row, "ArrowDown");
      key(row, "ArrowDown");
      expect(tipOf("Plan")).not.toBeNull();
      key(row, "ArrowDown");
      expect(key(row, "ArrowDown")).toBe(false);
      expect(creating()).toHaveAttribute("data-to", "e");
      expect(row).toHaveFocus();
      expect(onDependencyChange).not.toHaveBeenCalled();
      expect(key(row, "Enter")).toBe(false);
      expect(onDependencyChange).toHaveBeenCalledTimes(1);
      expect(onDependencyChange).toHaveBeenCalledWith({
        kind: "add",
        dependency: { from: "c", to: "e" },
      });
      expect(status()).toHaveTextContent("Release now starts after Review");
      expect(root()).not.toHaveAttribute("data-editing");
      expect(creating()).toBeNull();
      expect(tipOf("Release")).toBeNull();
      expect(row).toHaveFocus();
      // No session: Enter is the page's again.
      expect(key(row, "Enter")).toBe(true);
      expect(onDependencyChange).toHaveBeenCalledTimes(1);
    });

    it("Alt+Shift+Left: the focused task starts after the previous dated row; at the first row, the nearest other", () => {
      const onDependencyChange = vi.fn();
      const { unmount } = linkGantt({ onDependencyChange });
      let row = focused("Release");
      expect(chord(row, "ArrowLeft")).toBe(false);
      expect(creating()).toHaveAttribute("data-from", "c");
      expect(creating()).toHaveAttribute("data-to", "e");
      expect(tipOf("Review")).toHaveTextContent("Start Release after Review");
      key(row, "Enter");
      expect(onDependencyChange).toHaveBeenCalledWith({
        kind: "add",
        dependency: { from: "c", to: "e" },
      });
      unmount();

      linkGantt({ onDependencyChange, dependencies: [] });
      row = focused("Brief");
      expect(chord(row, "ArrowLeft")).toBe(false);
      expect(creating()).toHaveAttribute("data-from", "b");
      expect(creating()).toHaveAttribute("data-to", "a");
      key(row, "Enter");
      expect(onDependencyChange).toHaveBeenLastCalledWith({
        kind: "add",
        dependency: { from: "b", to: "a" },
      });
    });

    it("an existing pair is announced as such and Enter removes it (AC2)", () => {
      const onDependencyChange = vi.fn();
      linkGantt({ onDependencyChange });
      const row = focused("Brief");
      chord(row, "ArrowRight");
      const sentence =
        "Build already starts after Brief. Enter to remove the link.";
      expect(status()).toHaveTextContent(sentence);
      expect(tipOf("Build")).toHaveTextContent(sentence);
      expect(tipOf("Build")).not.toHaveAttribute("data-refused");
      expect(creating()).toBeNull();
      expect(key(row, "Enter")).toBe(false);
      expect(onDependencyChange).toHaveBeenCalledTimes(1);
      expect(onDependencyChange).toHaveBeenCalledWith({
        kind: "remove",
        dependency: { from: "a", to: "b" },
      });
      expect(status()).toHaveTextContent(
        "Link removed: Build no longer depends on Brief",
      );
      expect(root()).not.toHaveAttribute("data-editing");
      expect(row).toHaveFocus();
    });

    it("Enter on a refused candidate reports nothing and the session stays open (AC3)", () => {
      const onDependencyChange = vi.fn();
      linkGantt({ onDependencyChange });
      const row = focused("Review");
      chord(row, "ArrowRight");
      key(row, "Home");
      expect(key(row, "Enter")).toBe(false);
      expect(onDependencyChange).not.toHaveBeenCalled();
      expect(root()).toHaveAttribute("data-editing", "link");
      expect(tipOf("Brief")).toHaveTextContent(
        "Not linked: this would create a loop",
      );
      expect(status()).toHaveTextContent(
        "Not linked: this would create a loop",
      );
      key(row, "End");
      key(row, "Enter");
      expect(onDependencyChange).toHaveBeenCalledTimes(1);
      expect(onDependencyChange).toHaveBeenCalledWith({
        kind: "add",
        dependency: { from: "c", to: "e" },
      });
    });

    it("Escape cancels, the row keeps the focus, and only a running session stops it", () => {
      const outer = vi.fn();
      const onDependencyChange = vi.fn();
      document.addEventListener("keydown", outer);
      try {
        linkGantt({ onDependencyChange });
        const row = focused("Review");
        chord(row, "ArrowRight");
        outer.mockClear();
        expect(key(row, "Escape")).toBe(false);
        expect(outer).not.toHaveBeenCalled();
        expect(status()).toHaveTextContent("Link cancelled");
        expect(root()).not.toHaveAttribute("data-editing");
        expect(creating()).toBeNull();
        expect(tipOf("Release")).toBeNull();
        expect(row).toHaveFocus();
        key(row, "Enter");
        expect(onDependencyChange).not.toHaveBeenCalled();
        outer.mockClear();
        expect(key(row, "Escape")).toBe(true);
        expect(outer).toHaveBeenCalledTimes(1);
      } finally {
        document.removeEventListener("keydown", outer);
      }
    });

    it.each([
      ["focus leaving the row", () => taskRow("Build").focus()],
      ["leaving the window", () => fireEvent.blur(window)],
    ])("%s cancels with nothing reported", (_, leave) => {
      const onDependencyChange = vi.fn();
      linkGantt({ onDependencyChange });
      const row = focused("Review");
      chord(row, "ArrowRight");
      act(leave);
      expect(root()).not.toHaveAttribute("data-editing");
      expect(creating()).toBeNull();
      expect(status()).toHaveTextContent("Link cancelled");
      key(row, "Enter");
      expect(onDependencyChange).not.toHaveBeenCalled();
    });

    it("unmounted mid-session, it leaves Escape and blur to the page", () => {
      const outer = vi.fn();
      const blur = vi.spyOn(window, "removeEventListener");
      try {
        const { unmount } = linkGantt();
        chord(focused("Review"), "ArrowRight");
        expect(root()).toHaveAttribute("data-editing", "link");
        unmount();
        document.addEventListener("keydown", outer);
        fireEvent.keyDown(document.body, { key: "Escape" });
        expect(outer).toHaveBeenCalledTimes(1);
        expect(blur).toHaveBeenCalledWith("blur", expect.any(Function));
      } finally {
        document.removeEventListener("keydown", outer);
        blur.mockRestore();
      }
    });

    it("no regression: arrows navigate without a session; other chords never mix with a link session", () => {
      const onTaskChange = vi.fn();
      const onDependencyChange = vi.fn();
      linkGantt({ onTaskChange, onDependencyChange });
      const brief = focused("Brief");
      expect(key(brief, "ArrowDown")).toBe(false);
      expect(taskRow("Build")).toHaveFocus();
      const row = focused("Review");
      chord(row, "ArrowRight");
      // s23 chords and modified arrows during a link session: left alone.
      for (const modifiers of [
        { altKey: true },
        { shiftKey: true },
        { ctrlKey: true },
      ] as Record<string, boolean>[]) {
        expect(key(row, "ArrowRight", modifiers)).toBe(true);
        expect(key(row, "ArrowDown", modifiers)).toBe(true);
      }
      expect(chord(row, "ArrowLeft")).toBe(true);
      expect(root()).toHaveAttribute("data-editing", "link");
      expect(creating()).toHaveAttribute("data-to", "e");
      expect(row).toHaveFocus();
      key(row, "Escape");

      // Alt+Shift during an s23 edit session or a pointer drag: ignored.
      key(row, "ArrowRight", { altKey: true });
      expect(root()).toHaveAttribute("data-editing", "move");
      expect(chord(row, "ArrowRight")).toBe(true);
      expect(root()).toHaveAttribute("data-editing", "move");
      key(row, "Escape");
      const el = bar(taskRow("Build"))!;
      fireEvent.pointerDown(el, { clientX: 100, button: 0, pointerId: 1 });
      expect(chord(row, "ArrowRight")).toBe(true);
      expect(root()).toHaveAttribute("data-editing", "move");
      fireEvent.pointerUp(el, { clientX: 100, pointerId: 1 });
      // Ctrl or Meta with Alt+Shift: the browser's.
      for (const extra of [{ ctrlKey: true }, { metaKey: true }] as Record<
        string,
        boolean
      >[]) {
        expect(
          key(row, "ArrowRight", { altKey: true, shiftKey: true, ...extra }),
        ).toBe(true);
      }
      expect(root()).not.toHaveAttribute("data-editing");
      expect(onTaskChange).not.toHaveBeenCalled();
      expect(onDependencyChange).not.toHaveBeenCalled();
    });

    it("gating: the chord is the browser's without link editing or on a row without a bar; shortcuts and instructions follow", () => {
      const s23 =
        "Alt+ArrowLeft Alt+ArrowRight Shift+ArrowLeft Shift+ArrowRight Enter Escape";
      const linkInstructions =
        "Alt plus Shift plus Right arrow makes another task start after this one";
      const { unmount } = linkGantt({ onDependencyChange: undefined });
      let row = focused("Review");
      expect(row).toHaveAttribute("aria-keyshortcuts", s23);
      expect(row).not.toHaveAccessibleDescription(
        expect.stringContaining(linkInstructions),
      );
      expect(chord(row, "ArrowRight")).toBe(true);
      expect(root()).not.toHaveAttribute("data-editing");
      unmount();

      const { unmount: second } = linkGantt({ editable: false });
      row = focused("Review");
      expect(row).not.toHaveAttribute("aria-keyshortcuts");
      expect(chord(row, "ArrowRight")).toBe(true);
      second();

      linkGantt();
      row = focused("Review");
      expect(row).toHaveAttribute(
        "aria-keyshortcuts",
        `Alt+ArrowLeft Alt+ArrowRight Shift+ArrowLeft Shift+ArrowRight ${LINK_SHORTCUTS} Enter Escape`,
      );
      expect(row).toHaveAccessibleDescription(
        expect.stringContaining(linkInstructions),
      );
      const plan = focused("Plan");
      expect(plan).not.toHaveAttribute("aria-keyshortcuts");
      expect(plan).not.toHaveAccessibleDescription(
        expect.stringContaining(linkInstructions),
      );
      expect(chord(plan, "ArrowRight")).toBe(true);
      expect(root()).not.toHaveAttribute("data-editing");
      const label = row.getAttribute("aria-label");
      row.focus();
      chord(row, "ArrowRight");
      key(row, "ArrowUp");
      expect(row).toHaveAttribute("aria-label", label!);
    });

    it("controlled: an applied add is drawn, data never mutated, the row keeps the focus", () => {
      const before = [JSON.stringify(DEP_TASKS), JSON.stringify(DEPS)];
      const Parent = () => {
        const [dependencies, setDependencies] =
          useState<GanttDependency[]>(DEPS);
        return (
          <CunninghamProvider>
            <Gantt
              aria-label="Plan"
              tasks={DEP_TASKS}
              dependencies={dependencies}
              zoom="day"
              today="2026-03-23"
              editable
              onDependencyChange={({ kind, dependency }) =>
                setDependencies((all) =>
                  kind === "add"
                    ? [...all, dependency]
                    : all.filter(
                        (d) =>
                          d.from !== dependency.from || d.to !== dependency.to,
                      ),
                )
              }
            />
          </CunninghamProvider>
        );
      };
      render(<Parent />);
      const row = focused("Review");
      chord(row, "ArrowRight");
      key(row, "Enter");
      expect(linkEl("c", "e")).not.toBeNull();
      expect(linkEl("c", "e")).not.toHaveAttribute("data-state");
      expect(row).toHaveFocus();
      // The same chord on the new pair removes it.
      chord(row, "ArrowRight");
      key(row, "Enter");
      expect(linkEl("c", "e")).toBeNull();
      expect([JSON.stringify(DEP_TASKS), JSON.stringify(DEPS)]).toEqual(before);
    });

    it.each([
      [
        "en-US",
        [
          "Link Review to Release: Release would start after Review ends. Enter to link.",
          "Start Plan after Review. Not linked: Plan has no dates",
          "Link cancelled",
          "Build already starts after Brief. Enter to remove the link.",
        ],
      ],
      [
        "fr-FR",
        [
          "Lier Review à Release : Release commencerait après la fin de Review. Entrée pour lier.",
          "Faire commencer Plan après Review. Lien refusé : Plan n'a pas de dates",
          "Lien annulé",
          "Build commence déjà après Brief. Entrée pour supprimer le lien.",
        ],
      ],
    ])("%s: names the pair and the action before Enter", (locale, said) => {
      renderGantt(
        {
          tasks: DEP_TASKS,
          dependencies: DEPS,
          zoom: "day",
          editable: true,
          onDependencyChange: vi.fn(),
        },
        locale,
      );
      const heard: (string | null)[] = [];
      const row = focused("Review");
      chord(row, "ArrowRight");
      heard.push(status().textContent);
      key(row, "ArrowUp");
      heard.push(status().textContent);
      key(row, "Escape");
      heard.push(status().textContent);
      chord(focused("Brief"), "ArrowRight");
      heard.push(status().textContent);
      expect(heard).toEqual(said);
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

  it("links: inert overlay above the rows, under the axis, clipped by the scroll offset", () => {
    const source = scss();
    const layer = blocks(source, /&__links\b/);
    expect(layer).toMatch(/z-index:\s*1;/);
    // Clipped on the left by the scroll offset, open on the right by one
    // gutter and a line (a U route out of the axis' last day).
    expect(layer).toMatch(
      /clip-path:\s*inset\(\s*0\s+calc\(\s*-1 \*\s*\(\s*var\(--c--components--gantt--link-gutter\)\s*\+\s*var\(--c--components--gantt--link-width\)\s*\)\s*\)\s+0\s+var\(--gantt-scroll\)\s*\);/,
    );
    expect(layer).toMatch(/pointer-events:\s*none;/);
    expect(blocks(source, /&__axis\b/)).toMatch(/z-index:\s*2;/);
    // Row pitch from the tokens (border-width is px, row-height rem).
    expect(layer).toMatch(
      /var\(--c--components--gantt--row-height\)\s*\+\s*var\(--c--components--gantt--border-width\)/,
    );
    const link = blocks(source, /&__link\b/);
    expect(link).toMatch(/var\(--c--components--gantt--link-color\)/);
    expect(blocks(source, /&__link\[data-conflict\]/)).toMatch(
      /var\(--c--components--gantt--link-conflict-color\)[\s\S]*dashed|dashed[\s\S]*var\(--c--components--gantt--link-conflict-color\)/,
    );
    expect(blocks(source, /&__link-segment::before/)).toMatch(
      /background-color:\s*var\(--c--components--gantt--link-casing-color\);/,
    );
    const flag = blocks(source, /&__link-flag\b/);
    expect(flag).toMatch(
      /background-color:\s*var\(--c--components--gantt--link-flag-background-color\);/,
    );
    expect(flag).toMatch(
      /color:\s*var\(--c--components--gantt--link-flag-color\);/,
    );
    const forced = blocks(source, /@media \(forced-colors: active\)/);
    expect(forced).toMatch(/&__links[^{]*\{\s*forced-color-adjust:\s*none;/);
    expect(blocks(forced, /&__link\b/)).toMatch(/CanvasText/);
    expect(blocks(forced, /&__link-segment::before/)).toMatch(
      /background-color:\s*Canvas;/,
    );
    expect(blocks(forced, /&__link-flag\b/)).toMatch(
      /background-color:\s*Canvas;/,
    );
    expect(
      blocks(
        blocks(source, /@media \(prefers-reduced-motion: reduce\)/),
        /&__link-segment\b/,
      ),
    ).toMatch(/transition:\s*none;/);
  });

  it("link editing: 24px connector and Remove, crosshair, touch-action on the connector, forced colors", () => {
    const source = scss();
    const hit = "var\\(--c--components--gantt--link-hit-size\\)";
    const connector = blocks(source, /&__connector\b/);
    expect(connector).toMatch(new RegExp(`inline-size:\\s*${hit};`));
    expect(connector).toMatch(new RegExp(`block-size:\\s*${hit};`));
    const remove = blocks(source, /&__remove\b/);
    expect(remove).toMatch(new RegExp(`min-inline-size:\\s*${hit};`));
    expect(remove).toMatch(new RegExp(`min-block-size:\\s*${hit};`));
    expect(blocks(source, /&\[data-editable\] &__connector\b/)).toMatch(
      /cursor:\s*crosshair;/,
    );
    // The connector joins the bar and the handles; the track keeps scrolling.
    expect(
      blocks(
        source,
        /&\[data-editable\] &__bar,\s*&\[data-editable\] &__handle,\s*&__connector/,
      ),
    ).toMatch(/touch-action:\s*none;/);
    expect(blocks(source, /&__track\b/)).not.toMatch(/touch-action/);
    // The dot shows on hover and focus of its row, like the grips.
    expect(source).toMatch(/&__row:hover &__connector::after/);
    expect(source).toMatch(/&__row:focus-within &__connector::after/);
    expect(blocks(source, /&__connector::after/)).toMatch(
      /border:[^;]*var\(--c--components--gantt--connector-border-color\);[\s\S]*background-color:\s*var\(--c--components--gantt--connector-background-color\);/,
    );
    expect(blocks(source, /&__link\[data-selected\]/)).toMatch(
      /var\(--c--components--gantt--link-selected-color\)[\s\S]*var\(--c--components--gantt--link-width--selected\)/,
    );
    expect(blocks(source, /&__bar\[data-refused\]/)).toMatch(
      /var\(--c--components--gantt--invalid-color\)/,
    );
    const forced = blocks(source, /@media \(forced-colors: active\)/);
    expect(blocks(forced, /&__connector::after/)).toMatch(/CanvasText/);
    expect(blocks(forced, /&__link\[data-selected\]/)).toMatch(/Highlight/);
    expect(blocks(forced, /&__remove\b/)).toMatch(/CanvasText/);
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
        // Links (s24): lines on the row and its hover, the casing against
        // the bar fill, the line on its casing, the "!" on its chip.
        ["link-color", "background-color", 3],
        ["link-color", "row-background-color--hover", 3],
        ["link-selected-color", "background-color", 3],
        ["link-selected-color", "row-background-color--hover", 3],
        ["link-conflict-color", "background-color", 3],
        ["link-conflict-color", "row-background-color--hover", 3],
        ["link-casing-color", "bar-background-color", 3],
        ["link-color", "link-casing-color", 3],
        ["link-conflict-color", "link-casing-color", 3],
        ["link-flag-color", "link-flag-background-color", 4.5],
        // Link editing (s24 t03): the connector ring on the row and its hover.
        ["connector-border-color", "background-color", 3],
        ["connector-border-color", "row-background-color--hover", 3],
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
