import { readFileSync } from "fs";
import { resolve } from "path";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tokens } from "../../cunningham-tokens";
import { CunninghamProvider } from ":/components/provider";
import { Chart, ChartProps } from "./Chart";
import { nearestIndex, niceTicks } from "./utils";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const DATA = [
  { month: "Jan", sales: 12, costs: 8 },
  { month: "Feb", sales: 18, costs: 9 },
  { month: "Mar", sales: 9, costs: 11 },
];
const SERIES = [
  { key: "sales", label: "Sales" },
  { key: "costs", label: "Costs" },
];

const setup = (props: Partial<ChartProps> = {}) =>
  render(
    <CunninghamProvider currentLocale="en-US">
      <Chart
        title="Monthly results"
        summary="Sales peak in February at 18; costs stay below sales except in March."
        data={DATA}
        xKey="month"
        series={SERIES}
        {...props}
      />
    </CunninghamProvider>,
  );

describe("Chart", () => {
  it.each([
    ["bar", ".c__chart__bar", 6],
    ["line", ".c__chart__line", 2],
    ["area", ".c__chart__area", 2],
  ] as const)(
    "renders a %s chart from the data array",
    (type, selector, count) => {
      const { container } = setup({ type });
      expect(container.querySelectorAll(selector)).toHaveLength(count);
    },
  );

  it("defaults to bars", () => {
    const { container } = setup();
    expect(container.querySelectorAll(".c__chart__bar")).toHaveLength(6);
  });

  it("draws axes with a title per category and value ticks", () => {
    const { container } = setup();
    ["Jan", "Feb", "Mar"].forEach((m) =>
      expect(container.querySelector(".c__chart__x-axis")).toHaveTextContent(m),
    );
    expect(
      container.querySelectorAll(".c__chart__y-tick").length,
    ).toBeGreaterThan(2);
  });

  it("has a legend naming each series, with the same pattern or marker as the chart", () => {
    const { container } = setup();
    const legend = container.querySelector(".c__chart__legend") as HTMLElement;
    expect(within(legend).getByText("Sales")).toBeVisible();
    expect(within(legend).getByText("Costs")).toBeVisible();
    expect(legend.querySelectorAll("svg")).toHaveLength(2);
  });

  describe("text alternative", () => {
    it("names the graphic and describes it with the summary", () => {
      setup();
      const graphic = screen.getByRole("img", { name: "Monthly results" });
      expect(graphic).toHaveAccessibleDescription(/Sales peak in February/);
    });

    it("offers a data table instead of the chart, and back", async () => {
      const { container } = setup();
      expect(screen.queryByRole("table")).toBeNull();
      const toggle = screen.getByRole("button", {
        name: "View data as a table",
      });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      await userEvent.click(toggle);
      const table = screen.getByRole("table", { name: "Monthly results" });
      expect(
        within(table)
          .getAllByRole("columnheader")
          .map((h) => h.textContent),
      ).toEqual(["month", "Sales", "Costs"]);
      expect(within(table).getAllByRole("row")).toHaveLength(4);
      expect(within(table).getByRole("cell", { name: "18" })).toBeVisible();
      expect(container.querySelector(".c__chart__plot")).toBeNull();
      await userEvent.click(
        screen.getByRole("button", { name: "Back to the chart" }),
      );
      expect(screen.queryByRole("table")).toBeNull();
    });
  });

  describe("tooltip", () => {
    it("shows the values of a category on keyboard focus and arrows, and announces them", async () => {
      const { container } = setup();
      const plot = container.querySelector(".c__chart__plot") as HTMLElement;
      expect(plot).toHaveAttribute("tabindex", "0");
      expect(container.querySelector(".c__chart__tooltip")).toBeNull();
      act(() => plot.focus());
      const tooltip = container.querySelector(
        ".c__chart__tooltip",
      ) as HTMLElement;
      expect(tooltip).toHaveTextContent("Jan");
      expect(tooltip).toHaveTextContent("Sales");
      expect(tooltip).toHaveTextContent("12");
      await userEvent.keyboard("{ArrowRight}");
      expect(container.querySelector(".c__chart__tooltip")).toHaveTextContent(
        "Feb",
      );
      expect(container.querySelector(".c__chart__tooltip")).toHaveTextContent(
        "18",
      );
      await userEvent.keyboard("{End}");
      expect(container.querySelector(".c__chart__tooltip")).toHaveTextContent(
        "Mar",
      );
      await userEvent.keyboard("{Home}");
      expect(container.querySelector(".c__chart__tooltip")).toHaveTextContent(
        "Jan",
      );
      expect(container.querySelector(".c__chart__live")).toHaveAttribute(
        "aria-live",
        "polite",
      );
    });

    it("hides on Escape and on blur", async () => {
      const { container } = setup();
      const plot = container.querySelector(".c__chart__plot") as HTMLElement;
      act(() => plot.focus());
      await userEvent.keyboard("{Escape}");
      expect(container.querySelector(".c__chart__tooltip")).toBeNull();
      act(() => plot.focus());
      act(() => plot.blur());
      expect(container.querySelector(".c__chart__tooltip")).toBeNull();
    });

    it("follows the pointer", () => {
      const { container } = setup();
      const plot = container.querySelector(".c__chart__plot") as HTMLElement;
      vi.spyOn(plot, "getBoundingClientRect").mockReturnValue({
        left: 0,
        top: 0,
        width: 480,
        height: 280,
        right: 480,
        bottom: 280,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });
      // jsdom has no PointerEvent: a mouse event named like it carries the coordinates.
      fireEvent(
        plot,
        new MouseEvent("pointermove", {
          clientX: 440,
          clientY: 100,
          bubbles: true,
        }),
      );
      expect(container.querySelector(".c__chart__tooltip")).toHaveTextContent(
        "Mar",
      );
      // React derives pointerleave from pointerout when the pointer goes elsewhere.
      fireEvent(
        plot,
        new MouseEvent("pointerout", {
          bubbles: true,
          relatedTarget: document.body,
        }),
      );
      expect(container.querySelector(".c__chart__tooltip")).toBeNull();
    });
  });

  it("never relies on colour alone: each series has its own pattern, marker and dash", () => {
    const { container } = setup({ type: "bar" });
    const patterns = Array.from(container.querySelectorAll("pattern")).map(
      (p) => p.id,
    );
    expect(new Set(patterns).size).toBe(2);
    setup({ type: "line" });
    const markers = document.querySelectorAll(".c__chart__marker");
    expect(markers.length).toBeGreaterThan(0);
    const dashes = new Set(
      Array.from(document.querySelectorAll(".c__chart__line")).map((l) =>
        l.getAttribute("stroke-dasharray"),
      ),
    );
    expect(dashes.size).toBe(2);
  });

  it("adapts to the width of its container", () => {
    const callbacks: ResizeObserverCallback[] = [];
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: ResizeObserverCallback) {
          callbacks.push(cb);
        }
        observe() {}
        disconnect() {}
      },
    );
    const { container } = setup();
    const svg = container.querySelector("svg.c__chart__svg") as SVGElement;
    const before = svg.getAttribute("viewBox");
    act(() =>
      callbacks.forEach((cb) =>
        cb(
          [{ contentRect: { width: 900 } } as ResizeObserverEntry],
          {} as ResizeObserver,
        ),
      ),
    );
    expect(svg.getAttribute("viewBox")).not.toBe(before);
    expect(svg.getAttribute("viewBox")).toMatch(/^0 0 900 /);
    vi.unstubAllGlobals();
  });

  it("is themed by tokens, has no literal in its stylesheet, and drops animation under reduced motion", () => {
    for (const n of [1, 2, 3, 4, 5, 6])
      expect(scss).toContain(`--c--components--chart--series-${n}-color`);
    expect(scss).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});

describe("series colours", () => {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a: string, b: string) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  it.each(Object.keys(tokens.themes))(
    "meet 3:1 against the surface in %s",
    (name) => {
      const { contextuals } = tokens.themes[name as keyof typeof tokens.themes];
      const surface = contextuals.background.surface.primary;
      const colours = [
        contextuals.border.semantic.brand.primary,
        contextuals.border.semantic.info.primary,
        contextuals.border.semantic.success.primary,
        contextuals.border.semantic.warning.primary,
        contextuals.border.semantic.error.primary,
        contextuals.content.semantic.neutral.tertiary,
      ];
      colours.forEach((colour) =>
        expect(contrast(colour, surface)).toBeGreaterThanOrEqual(3),
      );
    },
  );
});

describe("utils", () => {
  it("builds readable ticks", () => {
    expect(niceTicks(18)).toEqual([0, 5, 10, 15, 20]);
    expect(niceTicks(0)).toEqual([0, 1]);
    expect(niceTicks(Number.NaN)).toEqual([0, 1]);
    expect(
      niceTicks(950, 4)[niceTicks(950, 4).length - 1],
    ).toBeGreaterThanOrEqual(950);
  });

  it("finds the nearest category", () => {
    expect(nearestIndex(0, 0, 300, 3)).toBe(0);
    expect(nearestIndex(150, 0, 300, 3)).toBe(1);
    expect(nearestIndex(299, 0, 300, 3)).toBe(2);
    expect(nearestIndex(-20, 0, 300, 3)).toBe(0);
    expect(nearestIndex(999, 0, 300, 3)).toBe(2);
    expect(nearestIndex(10, 0, 0, 3)).toBe(0);
  });
});
