import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultTokenRefs } from "@gouvfr-lasuite/ui-tokens";
import { describe, expect, it, vi } from "vitest";
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
    },
  );
});
