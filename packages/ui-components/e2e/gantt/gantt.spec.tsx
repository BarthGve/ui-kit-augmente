import { test, expect } from "@playwright/experimental-ct-react";
import type { Locator, Page } from "@playwright/test";
import type {
  GanttDependencyChange,
  GanttTaskChange,
} from "../../src/components/gantt/types";
import { DEMO_TASKS } from "../../src/components/gantt/demo";
import {
  ControlledGantt,
  DemoGantt,
  EditableGantt,
  GanttInModal,
  TestGantt,
} from "../helpers/mount-gantt";

// What jsdom cannot measure: sticky layout, scrolling, media queries.

const scroller = (page: Page) =>
  page.getByTestId("gantt").locator(".c__gantt__scroller");
const taskCells = (page: Page) =>
  page.locator('[role="row"][aria-rowindex] [role="rowheader"]');
const bar = (page: Page, id: string) =>
  page.locator(`.c__gantt__bar[data-task-id="${id}"]`);
const box = async (locator: Locator) => (await locator.boundingBox())!;
const scrollBy = (locator: Locator, left: number, top: number) =>
  locator.evaluate(
    (el, [x, y]) => {
      el.scrollLeft += x;
      el.scrollTop += y;
    },
    [left, top],
  );

// Leftmost visible day, measured: pixels per day from a bar's width and span
// (never the implementation's constant). The sticky column cancels out.
const leftDay = async (page: Page) => {
  const first = bar(page, "t0");
  const span = Number(
    await first.evaluate((el) =>
      (el as HTMLElement).style.getPropertyValue("--gantt-span"),
    ),
  );
  const perDay = (await box(first)).width / span;
  const scrollLeft = await scroller(page).evaluate((el) => el.scrollLeft);
  return Math.floor(scrollLeft / perDay + 0.01);
};

// Colours of the scroller as rendered, at points relative to its box: the
// ring is a pseudo-element, only the bitmap shows where it is drawn.
const colorsAt = async (
  page: Page,
  locator: Locator,
  points: [number, number][],
) => {
  // CSS pixels: the points are CSS offsets, and Desktop Safari is a 2x device.
  const png = (await locator.screenshot({ scale: "css" })).toString("base64");
  return page.evaluate(
    async ([data, at]) => {
      const img = new Image();
      img.src = `data:image/png;base64,${data}`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const context = canvas.getContext("2d")!;
      context.drawImage(img, 0, 0);
      return at.map(([x, y]) =>
        Array.from(context.getImageData(x, y, 1, 1).data.slice(0, 3)),
      );
    },
    [png, points] as const,
  );
};
const rgb = (css: string) => css.match(/\d+/g)!.slice(0, 3).map(Number);
const row = (page: Page, index: number) =>
  page.locator(`[role="row"][aria-rowindex="${index}"]`);
// Pixels along a line through the box where the target is the hit target:
// what a pointer can really reach, not the box (sticky column, clipping).
const hittable = (target: Locator, axis: "x" | "y") =>
  target.evaluate((el, along) => {
    const r = el.getBoundingClientRect();
    let hits = 0;
    const [from, to] = along === "x" ? [r.left, r.right] : [r.top, r.bottom];
    for (let p = Math.floor(from) - 4; p <= to + 4; p++) {
      const x = along === "x" ? p + 0.5 : r.left + r.width / 2;
      const y = along === "y" ? p + 0.5 : r.top + r.height / 2;
      if (document.elementFromPoint(x, y) === el) hits++;
    }
    return hits;
  }, axis);
const ring = (locator: Locator) =>
  locator.evaluate((el) => {
    const style = getComputedStyle(el, "::after");
    return {
      style: style.outlineStyle,
      width: style.outlineWidth,
      color: style.outlineColor,
    };
  });

test.describe("Gantt", () => {
  test("the task list stays fixed while the timeline scrolls horizontally", async ({
    mount,
    page,
  }) => {
    await mount(<TestGantt />);
    const cells = taskCells(page);
    const before = await Promise.all((await cells.all()).slice(0, 3).map(box));
    const barBefore = await box(bar(page, "t0"));
    await scrollBy(scroller(page), 400, 0);
    const after = await Promise.all((await cells.all()).slice(0, 3).map(box));
    after.forEach((cell, i) => expect(cell.x).toBe(before[i].x));
    expect((await box(bar(page, "t0"))).x).toBeCloseTo(barBefore.x - 400, 0);
  });

  test("the axis stays on top while the rows scroll vertically", async ({
    mount,
    page,
  }) => {
    await mount(<TestGantt />);
    const axis = page.locator('[role="row"][aria-rowindex="1"]');
    const row = page.locator('[role="row"][aria-rowindex="3"]');
    const [axisBefore, rowBefore] = [await box(axis), await box(row)];
    await scrollBy(scroller(page), 0, 120);
    expect((await box(axis)).y).toBe(axisBefore.y);
    expect((await box(row)).y).toBeCloseTo(rowBefore.y - 120, 0);
  });

  test("the page itself never scrolls horizontally", async ({
    mount,
    page,
  }) => {
    await mount(<TestGantt />);
    const overflow = await page.evaluate(() => {
      const root = document.scrollingElement!;
      return root.scrollWidth - root.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("a zoom change keeps the leftmost visible day", async ({
    mount,
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mount(<TestGantt />);
    await scrollBy(scroller(page), 400, 0);
    const week = await leftDay(page);
    expect(week).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Day" }).click();
    expect(await leftDay(page)).toBe(week);

    // Narrowing: day 200 is 8000px in day zoom, more than the week zoom can
    // scroll (about 4200px), yet 2400px there: the anchor must be taken
    // before the change, not read back from a clamped offset after it.
    await scroller(page).evaluate((el) => (el.scrollLeft = 8000));
    const day = await leftDay(page);
    expect(day).toBe(200);
    await page.getByRole("button", { name: "Week" }).click();
    expect(await leftDay(page)).toBe(day);
  });

  test("bars animate a zoom change, unless motion is reduced", async ({
    mount,
    page,
  }) => {
    await mount(<TestGantt />);
    const duration = () =>
      bar(page, "t0").evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(await duration()).not.toMatch(/^0s(, 0s)*$/);
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await duration()).toMatch(/^0s(, 0s)*$/);
  });

  test("on a narrow screen the task column takes at most 40% and bars stay reachable", async ({
    mount,
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await mount(<TestGantt />);
    const box_ = await box(scroller(page));
    const cell = await box(taskCells(page).first());
    expect(cell.width).toBeLessThanOrEqual(box_.width * 0.4 + 0.5);

    const last = bar(page, "t29");
    await scroller(page).evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
      el.scrollTop = el.scrollHeight;
    });
    const target = await box(last);
    // Visible right of the sticky column, inside the box.
    expect(target.x + target.width).toBeGreaterThan(cell.x + cell.width);
    expect(target.x).toBeLessThan(box_.x + box_.width);
  });
  test("only the pressed zoom button is underlined, in forced colors too", async ({
    mount,
    page,
  }) => {
    await mount(<TestGantt />);
    const lines = () =>
      Promise.all(
        ["Day", "Week", "Month"].map((name) =>
          page
            .getByRole("button", { name })
            .evaluate((el) => getComputedStyle(el).textDecorationLine),
        ),
      );
    expect(await lines()).toEqual(["none", "underline", "none"]);
    await page.getByRole("button", { name: "Day" }).click();
    expect(await lines()).toEqual(["underline", "none", "none"]);
    await page.emulateMedia({ forcedColors: "active" });
    expect(await lines()).toEqual(["underline", "none", "none"]);
  });

  test("Tab enters on the first row after the zoom buttons; arrows, Home and End move focus", async ({
    mount,
    page,
  }) => {
    await mount(<TestGantt />);
    for (const name of ["Day", "Week", "Month"]) {
      await page.keyboard.press("Tab");
      await expect(page.getByRole("button", { name })).toBeFocused();
    }
    await page.keyboard.press("Tab");
    await expect(row(page, 2)).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(row(page, 3)).toBeFocused();
    await page.keyboard.press("End");
    await expect(row(page, 31)).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(row(page, 30)).toBeFocused();
    await page.keyboard.press("Home");
    await expect(row(page, 2)).toBeFocused();
  });

  test("the keyboard ring is drawn whole inside the box, over the task column, even scrolled", async ({
    mount,
    page,
  }) => {
    await mount(<TestGantt />);
    await page.getByRole("button", { name: "Month" }).focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("ArrowDown");
    const focused = row(page, 3);
    await expect(focused).toBeFocused();
    const { style, width, color } = await ring(focused);
    expect([style, width]).toEqual(["solid", "2px"]);

    const box_ = await box(scroller(page));
    const inner = await scroller(page).evaluate((el) => ({
      left: el.clientLeft,
      right: el.clientLeft + el.clientWidth,
    }));
    const edges = async () => {
      const r = await box(focused);
      const [top, bottom, middle] = [
        r.y - box_.y + 1,
        r.y - box_.y + r.height - 2,
        r.y - box_.y + r.height / 2,
      ].map(Math.round);
      return colorsAt(page, scroller(page), [
        [inner.left + 1, middle], // start, over the sticky task column
        [inner.right - 2, middle], // end, before the scrollbar
        [inner.left + 40, top], // top, over the task column
        [inner.right - 40, bottom], // bottom, over the track
      ]);
    };
    const expected = rgb(color);
    const near = (pixel: number[]) =>
      pixel.every((c, i) => Math.abs(c - expected[i]) <= 8);
    expect((await edges()).map(near)).toEqual([true, true, true, true]);
    await scrollBy(scroller(page), 600, 0);
    expect((await edges()).map(near)).toEqual([true, true, true, true]);
  });

  test("no ring after a mouse click", async ({ mount, page }) => {
    await mount(<TestGantt />);
    await row(page, 3).locator('[role="rowheader"]').click();
    await expect(row(page, 3)).toBeFocused();
    expect((await ring(row(page, 3))).style).toBe("none");
  });

  test("moving to a row scrolls its bar into view, the task column stays put", async ({
    mount,
    page,
  }) => {
    await mount(<TestGantt />);
    const cell = taskCells(page).first();
    const column = await box(cell);
    await row(page, 2).focus();
    await page.keyboard.press("End");
    const box_ = await box(scroller(page));
    const axis = await box(row(page, 1));
    const last = await box(bar(page, "t29"));
    expect(last.x).toBeGreaterThanOrEqual(column.x + column.width - 1);
    expect(last.x + last.width).toBeLessThanOrEqual(box_.x + box_.width);
    expect(last.y).toBeGreaterThanOrEqual(axis.y + axis.height - 1);
    expect(last.y + last.height).toBeLessThanOrEqual(box_.y + box_.height);
    expect((await box(cell)).x).toBe(column.x);
    await page.keyboard.press("Home");
    const first = await box(bar(page, "t0"));
    expect(first.x).toBeGreaterThanOrEqual(column.x + column.width - 1);
    expect(first.y).toBeGreaterThanOrEqual(axis.y + axis.height - 1);
  });

  test("a zoom the controlled parent accepts keeps the leftmost visible day", async ({
    mount,
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mount(<ControlledGantt />);
    await scrollBy(scroller(page), 400, 0);
    const week = await leftDay(page);
    expect(week).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Day" }).click();
    await expect(page.getByRole("button", { name: "Day" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(await leftDay(page)).toBe(week);
  });

  test("a zoom request the parent refuses does not anchor a later zoom change", async ({
    mount,
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const refuse = () => {};
    const component = await mount(
      <TestGantt zoom="week" onZoomChange={refuse} />,
    );
    await scrollBy(scroller(page), 400, 0);
    await page.getByRole("button", { name: "Day" }).click();
    await scroller(page).evaluate((el) => (el.scrollLeft = 0));
    await component.update(<TestGantt zoom="day" onZoomChange={refuse} />);
    expect(await leftDay(page)).toBe(0);
  });
});

// Editing (s23): real mouse, capture, scroll and Escape.
test.describe("Gantt pointer move", () => {
  type Call = [string, GanttTaskChange];
  const recorder = () => {
    const calls: Call[] = [];
    return {
      calls,
      onTaskChange: (id: string, c: GanttTaskChange) => calls.push([id, c]),
    };
  };
  // Pixels per day of the rendered chart, measured from a bar.
  const perDay = async (page: Page, id = "t0") => {
    const b = bar(page, id);
    const span = Number(
      await b.evaluate((el) =>
        (el as HTMLElement).style.getPropertyValue("--gantt-span"),
      ),
    );
    return (await box(b)).width / span;
  };
  const grab = async (page: Page, id: string) => {
    const b = await box(bar(page, id));
    const at = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    await page.mouse.move(at.x, at.y);
    await page.mouse.down();
    return at;
  };
  const editing = (page: Page) =>
    page.getByTestId("gantt").getAttribute("data-editing");

  test("a real drag moves the bar by whole weeks and reports both dates", async ({
    mount,
    page,
  }) => {
    // Motion on: an applied change must not tween from the old dates.
    const { calls, onTaskChange } = recorder();
    await mount(<EditableGantt onTaskChange={onTaskChange} />);
    const px = await perDay(page);
    const before = await box(bar(page, "t1"));
    const at = await grab(page, "t1");
    // 2.4 weeks: snaps to 2 weeks.
    await page.mouse.move(at.x + 2.4 * 7 * px, at.y, { steps: 8 });
    expect(await editing(page)).toBe("move");
    await page.mouse.up();
    expect((await box(bar(page, "t1"))).x).toBeCloseTo(before.x + 14 * px, 0);
    await expect.poll(() => calls.length).toBe(1);
    // t1: 2026-01-17 to 2026-01-26.
    expect(calls[0]).toEqual([
      "t1",
      { start: "2026-01-31", end: "2026-02-09" },
    ]);
    expect((await box(bar(page, "t1"))).x).toBeCloseTo(before.x + 14 * px, 0);
    expect(await editing(page)).toBeNull();
  });

  test("Escape with the button still down puts the bar back and commits nothing", async ({
    mount,
    page,
  }) => {
    const { calls, onTaskChange } = recorder();
    await mount(<EditableGantt onTaskChange={onTaskChange} />);
    const px = await perDay(page);
    const before = await box(bar(page, "t1"));
    const at = await grab(page, "t1");
    await page.mouse.move(at.x + 3 * 7 * px, at.y, { steps: 6 });
    expect((await box(bar(page, "t1"))).x).toBeGreaterThan(before.x + 10);
    await page.keyboard.press("Escape");
    expect((await box(bar(page, "t1"))).x).toBeCloseTo(before.x, 0);
    await page.mouse.move(at.x + 5 * 7 * px, at.y, { steps: 3 });
    await page.mouse.up();
    expect((await box(bar(page, "t1"))).x).toBeCloseTo(before.x, 0);
    await page.waitForTimeout(100);
    expect(calls).toEqual([]);
  });

  test("after scrolling the box, the drag still maps the pointer to the right dates", async ({
    mount,
    page,
  }) => {
    const { calls, onTaskChange } = recorder();
    await mount(<EditableGantt onTaskChange={onTaskChange} />);
    await scrollBy(scroller(page), 400, 0);
    const px = await perDay(page);
    const at = await grab(page, "t4");
    await page.mouse.move(at.x + 7 * px, at.y, { steps: 4 });
    await page.mouse.up();
    await expect.poll(() => calls.length).toBe(1);
    // t4: 2026-02-22 to 2026-03-03, one week later.
    expect(calls[0]).toEqual([
      "t4",
      { start: "2026-03-01", end: "2026-03-10" },
    ]);
  });

  test("released outside the chart, the captured pointer still ends the drag", async ({
    mount,
    page,
  }) => {
    const { calls, onTaskChange } = recorder();
    await mount(<EditableGantt onTaskChange={onTaskChange} />);
    const px = await perDay(page);
    const chart = await box(page.getByTestId("gantt"));
    const at = await grab(page, "t1");
    await page.mouse.move(at.x + 7 * px, at.y, { steps: 3 });
    await page.mouse.move(at.x + 7 * px, chart.y + chart.height + 200, {
      steps: 3,
    });
    await page.mouse.up();
    await expect.poll(() => calls.length).toBe(1);
    expect(calls[0]).toEqual([
      "t1",
      { start: "2026-01-24", end: "2026-02-02" },
    ]);
    expect(await editing(page)).toBeNull();
  });

  test("dragging across the task names selects no text", async ({
    mount,
    page,
  }) => {
    await mount(<EditableGantt />);
    const cell = await box(taskCells(page).first());
    await grab(page, "t1");
    await page.mouse.move(cell.x + 4, cell.y + cell.height * 3, { steps: 10 });
    expect(await page.evaluate(() => getSelection()?.toString())).toBe("");
    await page.mouse.up();
    expect(await page.evaluate(() => getSelection()?.toString())).toBe("");
  });

  test("in a dialog, Escape cancels a running drag and only then closes the dialog", async ({
    mount,
    page,
  }) => {
    await mount(<GanttInModal />);
    const dialog = page.getByRole("dialog", { name: "Plan" });
    await expect(dialog).toBeVisible();
    const px = await perDay(page);
    const at = await grab(page, "t1");
    await page.mouse.move(at.x + 7 * px, at.y, { steps: 3 });
    await page.keyboard.press("Escape");
    await page.mouse.up();
    await expect(dialog).toBeVisible();
    expect(await editing(page)).toBeNull();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Closed")).toBeVisible();
  });
});

// Resizing (s23): handles, hit area, auto-scroll, touch, narrow bars.
test.describe("Gantt pointer resize", () => {
  type Call = [string, GanttTaskChange];
  const recorder = () => {
    const calls: Call[] = [];
    return {
      calls,
      onTaskChange: (id: string, c: GanttTaskChange) => calls.push([id, c]),
    };
  };
  const span = (locator: Locator) =>
    locator.evaluate((el) =>
      Number((el as HTMLElement).style.getPropertyValue("--gantt-span")),
    );
  const perDay = async (page: Page, id = "t0") =>
    (await box(bar(page, id))).width / (await span(bar(page, id)));
  const handle = (page: Page, id: string, edge: "start" | "end") =>
    bar(page, id).locator(`.c__gantt__handle[data-edge="${edge}"]`);
  const center = (b: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });
  const scrollLeft = (page: Page) =>
    scroller(page).evaluate((el) => el.scrollLeft);
  const editing = (page: Page) =>
    page.getByTestId("gantt").getAttribute("data-editing");

  test("a real drag of the end handle resizes by whole weeks; the target is 24px by the row height", async ({
    mount,
    page,
  }) => {
    const { calls, onTaskChange } = recorder();
    await mount(<EditableGantt onTaskChange={onTaskChange} />);
    const px = await perDay(page);
    const end = handle(page, "t1", "end");
    const rowHeight = (await box(row(page, 3).locator(".c__gantt__track")))
      .height;
    expect(await hittable(end, "x")).toBeGreaterThanOrEqual(24);
    expect(await hittable(end, "y")).toBeGreaterThanOrEqual(rowHeight - 1);
    expect(
      await hittable(handle(page, "t1", "start"), "x"),
    ).toBeGreaterThanOrEqual(24);
    const before = await box(bar(page, "t1"));
    const at = center(await box(end));
    await page.mouse.move(at.x, at.y);
    await page.mouse.down();
    // 2.4 weeks: snaps to 2 weeks.
    await page.mouse.move(at.x + 2.4 * 7 * px, at.y, { steps: 8 });
    expect(await editing(page)).toBe("resize-end");
    await page.mouse.up();
    await expect.poll(() => calls.length).toBe(1);
    // t1: 2026-01-17 to 2026-01-26.
    expect(calls[0]).toEqual([
      "t1",
      { start: "2026-01-17", end: "2026-02-09" },
    ]);
    const after = await box(bar(page, "t1"));
    expect(after.x).toBeCloseTo(before.x, 0);
    expect(after.width).toBeCloseTo(before.width + 14 * px, 0);
  });

  test("held at the visible track edge, the box scrolls, the dates follow, and it stops with the session", async ({
    mount,
    page,
  }) => {
    const { calls, onTaskChange } = recorder();
    await mount(<EditableGantt onTaskChange={onTaskChange} />);
    const px = await perDay(page);
    const view = await box(scroller(page));
    const column = await box(taskCells(page).first());
    const stable = async () => {
      const left = await scrollLeft(page);
      await page.waitForTimeout(250);
      expect(await scrollLeft(page)).toBe(left);
    };
    const hold = async (x: number) => {
      const at = center(await box(bar(page, "t1")));
      await page.mouse.move(at.x, at.y);
      await page.mouse.down();
      await page.mouse.move(x, at.y, { steps: 4 });
      return at;
    };

    // Release: the drop takes the scrolled distance into account.
    const scroll0 = await scrollLeft(page);
    const at = await hold(view.x + view.width - 20);
    await page.waitForTimeout(400);
    expect(await scrollLeft(page)).toBeGreaterThan(scroll0 + 50);
    await page.mouse.up();
    const scrolled = (await scrollLeft(page)) - scroll0;
    await stable();
    await expect.poll(() => calls.length).toBe(1);
    const weeks = Math.round(
      (view.x + view.width - 20 - at.x + scrolled) / (7 * px),
    );
    expect(weeks).toBeGreaterThan(2);
    const start = new Date(Date.UTC(2026, 0, 17 + 7 * weeks));
    expect(calls[0][1].start).toBe(start.toISOString().slice(0, 10));

    // Escape, then window blur: no scroll after the session ends.
    await hold(column.x + column.width + 10);
    await page.waitForTimeout(150);
    await page.keyboard.press("Escape");
    expect(await editing(page)).toBeNull();
    await stable();
    await page.mouse.up();

    await scroller(page).evaluate((el) => (el.scrollLeft = 0));
    await hold(view.x + view.width - 20);
    await page.waitForTimeout(150);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    expect(await editing(page)).toBeNull();
    await stable();
    await page.mouse.up();
    expect(calls).toHaveLength(1);
  });

  test.describe("touch", () => {
    test.use({ hasTouch: true });

    test("a finger drags a bar, scrolls the box from the track, and a cancelled touch restores", async ({
      mount,
      page,
    }) => {
      const { calls, onTaskChange } = recorder();
      await mount(<EditableGantt onTaskChange={onTaskChange} />);
      const px = await perDay(page);
      // Real touch input (pointerType "touch"), not synthetic events.
      const cdp = await page.context().newCDPSession(page);
      const touch = (
        type: "touchStart" | "touchMove" | "touchEnd" | "touchCancel",
        x?: number,
        y?: number,
      ) =>
        cdp.send("Input.dispatchTouchEvent", {
          type,
          touchPoints: x === undefined ? [] : [{ x, y: y! }],
        });
      await page.evaluate(() => {
        const w = window as unknown as { types: string[] };
        w.types = [];
        document.addEventListener("pointerdown", (e) =>
          w.types.push(e.pointerType),
        );
      });

      const at = center(await box(bar(page, "t1")));
      await touch("touchStart", at.x, at.y);
      for (let i = 1; i <= 6; i++) {
        await touch("touchMove", at.x + (i * 7 * px) / 6, at.y);
      }
      expect(await editing(page)).toBe("move");
      await touch("touchEnd");
      await expect.poll(() => calls.length).toBe(1);
      expect(calls[0]).toEqual([
        "t1",
        { start: "2026-01-24", end: "2026-02-02" },
      ]);
      expect(
        await page.evaluate(
          () => (window as unknown as { types: string[] }).types,
        ),
      ).toEqual(["touch"]);

      // On the track, away from any bar: the box scrolls, nothing is edited.
      const view = await box(scroller(page));
      const t0 = await box(bar(page, "t0"));
      const from = { x: view.x + view.width - 60, y: t0.y + t0.height / 2 };
      const left = await scrollLeft(page);
      await touch("touchStart", from.x, from.y);
      for (let i = 1; i <= 8; i++) {
        await touch("touchMove", from.x - i * 30, from.y);
      }
      await touch("touchEnd");
      await expect.poll(() => scrollLeft(page)).toBeGreaterThan(left + 50);
      expect(await editing(page)).toBeNull();
      expect(calls).toHaveLength(1);
      // Let the fling settle before measuring a bar.
      let settled = -1;
      await expect
        .poll(
          async () => {
            const now = await scrollLeft(page);
            const done = now === settled;
            settled = now;
            return done;
          },
          { intervals: [200] },
        )
        .toBe(true);

      // A cancelled touch (the browser takes the gesture) restores the bar.
      await scroller(page).evaluate((el) => (el.scrollLeft = 0));
      const b = await box(bar(page, "t2"));
      const c = center(b);
      await touch("touchStart", c.x, c.y);
      await touch("touchMove", c.x + 7 * px, c.y);
      expect((await box(bar(page, "t2"))).x).toBeGreaterThan(b.x + 10);
      await touch("touchCancel");
      expect((await box(bar(page, "t2"))).x).toBeCloseTo(b.x, 0);
      expect(await editing(page)).toBeNull();
      expect(calls).toHaveLength(1);
    });
  });

  test("month zoom: a short task has no handles and still moves; a narrow one gets thirds", async ({
    mount,
    page,
  }) => {
    const { calls, onTaskChange } = recorder();
    await mount(
      <TestGantt
        editable
        defaultZoom="month"
        onTaskChange={onTaskChange}
        tasks={[
          { id: "s", name: "Short", start: "2026-03-10", end: "2026-03-13" },
          { id: "n", name: "Narrow", start: "2026-03-01", end: "2026-03-10" },
          { id: "l", name: "Long", start: "2026-01-05", end: "2026-09-30" },
        ]}
      />,
    );
    const px = await perDay(page, "l");
    await expect(bar(page, "s").locator(".c__gantt__handle")).toHaveCount(0);
    const narrow = await box(bar(page, "n"));
    expect((await box(handle(page, "n", "end"))).width).toBeCloseTo(
      narrow.width / 3,
      0,
    );
    const at = center(await box(bar(page, "s")));
    await page.mouse.move(at.x, at.y);
    await page.mouse.down();
    await page.mouse.move(at.x + 31 * px, at.y, { steps: 4 });
    await page.mouse.up();
    await expect.poll(() => calls.length).toBe(1);
    expect(calls[0]).toEqual(["s", { start: "2026-04-10", end: "2026-04-13" }]);
  });
});

// Keyboard editing (s23): real keys on a focused row.
test.describe("Gantt keyboard edit", () => {
  type Call = [string, GanttTaskChange];
  const recorder = () => {
    const calls: Call[] = [];
    return {
      calls,
      onTaskChange: (id: string, c: GanttTaskChange) => calls.push([id, c]),
    };
  };
  const perDay = async (page: Page, id: string) => {
    const b = bar(page, id);
    const span = Number(
      await b.evaluate((el) =>
        (el as HTMLElement).style.getPropertyValue("--gantt-span"),
      ),
    );
    return (await box(b)).width / span;
  };

  test("Alt+ArrowRight then Enter moves the bar one week; Escape puts it back; no history move", async ({
    mount,
    page,
  }) => {
    const { calls, onTaskChange } = recorder();
    await mount(<EditableGantt onTaskChange={onTaskChange} />);
    const url = page.url();
    const px = await perDay(page, "t1");
    const before = await box(bar(page, "t1"));
    await row(page, 3).focus();
    await page.keyboard.press("Alt+ArrowRight");
    expect((await box(bar(page, "t1"))).x).toBeCloseTo(before.x + 7 * px, 0);
    expect(calls).toEqual([]);
    await page.keyboard.press("Enter");
    await expect.poll(() => calls.length).toBe(1);
    // t1: 2026-01-17 to 2026-01-26.
    expect(calls[0]).toEqual([
      "t1",
      { start: "2026-01-24", end: "2026-02-02" },
    ]);
    const moved = await box(bar(page, "t1"));
    expect(moved.x).toBeCloseTo(before.x + 7 * px, 0);

    await page.keyboard.press("Alt+ArrowLeft");
    await page.keyboard.press("Alt+ArrowLeft");
    expect((await box(bar(page, "t1"))).x).toBeCloseTo(moved.x - 14 * px, 0);
    await page.keyboard.press("Escape");
    expect((await box(bar(page, "t1"))).x).toBeCloseTo(moved.x, 0);
    await page.waitForTimeout(100);
    expect(calls).toHaveLength(1);
    expect(page.url()).toBe(url);
    await expect(row(page, 3)).toBeFocused();
  });

  test("after Enter the row keeps the focus and the tab stop, and its bar is in view", async ({
    mount,
    page,
  }) => {
    await mount(<EditableGantt />);
    await scrollBy(scroller(page), 3000, 0);
    // Focused without scrolling: the bar of t0 is out of view.
    await row(page, 2).evaluate((el) =>
      (el as HTMLElement).focus({ preventScroll: true }),
    );
    const column = await box(taskCells(page).first());
    const box_ = await box(scroller(page));
    expect((await box(bar(page, "t0"))).x).toBeLessThan(column.x);
    await page.keyboard.press("Alt+ArrowRight");
    await page.keyboard.press("Enter");
    await expect(row(page, 2)).toBeFocused();
    await expect(row(page, 2)).toHaveAttribute("tabindex", "0");
    const after = await box(bar(page, "t0"));
    expect(after.x).toBeGreaterThanOrEqual(column.x + column.width - 1);
    expect(after.x + after.width).toBeLessThanOrEqual(box_.x + box_.width);
  });
});

// Dependencies (s24): what jsdom cannot see, the overlay's paint over the
// sticky column and the rows, and the link ends on the real bar edges.
test.describe("Gantt dependencies", () => {
  const link = (page: Page, from: string, to: string) =>
    page.locator(`.c__gantt__link[data-from="${from}"][data-to="${to}"]`);
  const segments = (page: Page, from: string, to: string) =>
    link(page, from, to).locator(".c__gantt__link-segment");
  // The overlay ignores the pointer (t02): hit testing shows what is painted
  // once the segments take it back; clip-path clips hit testing too.
  const hitTestable = (page: Page) =>
    page.addStyleTag({
      content: ".c__gantt__link-segment { pointer-events: auto; }",
    });
  const linkAt = (page: Page, x: number, y: number) =>
    page.evaluate(
      ([px, py]) =>
        document.elementFromPoint(px, py)?.closest(".c__gantt__link") !== null,
      [x, y],
    );
  // Rightmost point of the link on a horizontal line: the arrowhead tip.
  const tipX = (
    page: Page,
    from: string,
    to: string,
    y: number,
    near: number,
  ) =>
    page.evaluate(
      ([selector, py, around]) => {
        let tip = Number.NaN;
        for (let x = around - 16; x <= around + 8; x += 0.25) {
          if (document.elementFromPoint(x, py)?.closest(selector)) tip = x;
        }
        return tip;
      },
      [
        `.c__gantt__link[data-from="${from}"][data-to="${to}"]`,
        y,
        near,
      ] as const,
    );
  const settle = async (locator: Locator) => {
    let last = "";
    await expect
      .poll(
        async () => {
          const now = JSON.stringify(await box(locator));
          const done = now === last;
          last = now;
          return done;
        },
        { intervals: [100] },
      )
      .toBe(true);
  };
  // Both ends of a link against the real bars, within 1px.
  const expectOnEdges = async (page: Page, from: string, to: string) => {
    const pred = await box(bar(page, from));
    const succ = await box(bar(page, to));
    const first = await box(segments(page, from, to).first());
    expect(Math.abs(first.x - (pred.x + pred.width))).toBeLessThanOrEqual(1);
    expect(
      Math.abs(first.y + first.height / 2 - (pred.y + pred.height / 2)),
    ).toBeLessThanOrEqual(1);
    const y = succ.y + succ.height / 2;
    const last = await box(segments(page, from, to).last());
    expect(Math.abs(last.y + last.height / 2 - y)).toBeLessThanOrEqual(1);
    const tip = await tipX(page, from, to, y, succ.x);
    expect(Math.abs(tip - succ.x)).toBeLessThanOrEqual(1);
    // Wider than the 2px line just before the tip: the arrowhead.
    expect(await linkAt(page, succ.x - 3, y - 3)).toBe(true);
  };

  test("scrolled, the links never paint over the task column, and do right of it", async ({
    mount,
    page,
  }) => {
    // t0 to t5: a long forward stub on the first row.
    await mount(<TestGantt dependencies={[{ from: "t0", to: "t5" }]} />);
    await hitTestable(page);
    await scrollBy(scroller(page), 300, 0);
    await page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => done(null))),
    );
    const column = await box(taskCells(page).first());
    const stub = await box(segments(page, "t0", "t5").first());
    const right = column.x + column.width;
    // The stub really runs under the column and past it.
    expect(stub.x).toBeLessThan(right - 20);
    expect(stub.x + stub.width).toBeGreaterThan(right + 20);
    const y = stub.y + stub.height / 2;
    expect(await linkAt(page, right - 10, y)).toBe(false);
    expect(
      await page.evaluate(
        ([x, py]) =>
          document.elementFromPoint(x, py)?.closest('[role="rowheader"]') !==
          null,
        [right - 10, y],
      ),
    ).toBe(true);
    expect(await linkAt(page, right + 10, y)).toBe(true);
  });

  // t0 to t3 spans three rows (off screen in day zoom).
  for (const zoom of ["day", "week", "month"] as const) {
    test(`${zoom} zoom: the link leaves the predecessor's end and its tip meets the successor's start`, async ({
      mount,
      page,
    }) => {
      await mount(
        <TestGantt
          defaultZoom={zoom}
          dependencies={[
            { from: "t0", to: "t1" },
            { from: "t0", to: "t3" },
          ]}
        />,
      );
      await hitTestable(page);
      await expectOnEdges(page, "t0", "t1");
      if (zoom !== "day") await expectOnEdges(page, "t0", "t3");
    });
  }

  test("at a 20px root font the ends, the row pitch and the overlay still match", async ({
    mount,
    page,
  }) => {
    await page.addStyleTag({ content: "html { font-size: 20px; }" });
    await mount(
      <TestGantt
        dependencies={[
          { from: "t0", to: "t1" },
          { from: "t0", to: "t3" },
        ]}
      />,
    );
    await hitTestable(page);
    await expectOnEdges(page, "t0", "t1");
    await expectOnEdges(page, "t0", "t3");
    const pitch = (await box(row(page, 3))).y - (await box(row(page, 2))).y;
    expect(pitch).toBeCloseTo(20 * 2.5 + 1, 1);
  });

  test("a U route leaving the last day of the axis stays painted, at most one gutter past it", async ({
    mount,
    page,
  }) => {
    // Long ends on the axis' last day; Short starts before: a conflict.
    await mount(
      <TestGantt
        tasks={[
          { id: "a", name: "Long", start: "2026-01-05", end: "2026-12-26" },
          { id: "b", name: "Short", start: "2026-12-14", end: "2026-12-15" },
        ]}
        dependencies={[{ from: "a", to: "b" }]}
      />,
    );
    await hitTestable(page);
    await scroller(page).evaluate((el) => (el.scrollLeft = el.scrollWidth));
    await page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => done(null))),
    );
    const stub = await box(segments(page, "a", "b").first());
    expect(
      await linkAt(page, stub.x + stub.width / 2, stub.y + stub.height / 2),
    ).toBe(true);
    const { overflow, room } = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>(".c__gantt__scroller")!;
      const grid = el.querySelector<HTMLElement>(".c__gantt__grid")!;
      const style = getComputedStyle(grid);
      const rem = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      return {
        overflow: el.scrollWidth - grid.getBoundingClientRect().width,
        room:
          parseFloat(
            style.getPropertyValue("--c--components--gantt--link-gutter"),
          ) *
            rem +
          parseFloat(
            style.getPropertyValue("--c--components--gantt--link-width"),
          ),
      };
    });
    expect(overflow).toBeLessThanOrEqual(room + 1);
  });

  test("rows step by row-height plus border-width; the overlay starts under the axis and spans the rows", async ({
    mount,
    page,
  }) => {
    await mount(<TestGantt dependencies={[{ from: "t0", to: "t1" }]} />);
    const tokens = await page.evaluate(() => {
      const style = getComputedStyle(document.querySelector(".c__gantt")!);
      const rem = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      const length = (name: string) => {
        const value = style.getPropertyValue(name).trim();
        return value.endsWith("rem")
          ? parseFloat(value) * rem
          : parseFloat(value);
      };
      return {
        row: length("--c--components--gantt--row-height"),
        border: length("--c--components--gantt--border-width"),
      };
    });
    const tops = await Promise.all(
      [2, 3, 4, 5].map(async (i) => (await box(row(page, i))).y),
    );
    for (let i = 1; i < tops.length; i++) {
      expect(tops[i] - tops[i - 1]).toBeCloseTo(tokens.row + tokens.border, 1);
    }
    const axis = await box(row(page, 1));
    const layer = await box(page.locator(".c__gantt__links"));
    expect(layer.y).toBeCloseTo(axis.y + axis.height, 1);
    expect(layer.height).toBeCloseTo(30 * (tokens.row + tokens.border), 1);
  });

  test("a link stays painted on a hovered row and keeps its casing across a bar", async ({
    mount,
    page,
  }) => {
    // Brief to Test runs down through the long Build bar.
    await mount(
      <TestGantt
        today="2026-03-01"
        tasks={[
          { id: "a", name: "Brief", start: "2026-03-02", end: "2026-03-04" },
          { id: "b", name: "Build", start: "2026-03-01", end: "2026-04-30" },
          { id: "c", name: "Test", start: "2026-03-23", end: "2026-03-27" },
        ]}
        dependencies={[{ from: "a", to: "c" }]}
      />,
    );
    const colours = await page.evaluate(() => {
      const probe = document.createElement("div");
      document.body.append(probe);
      const resolve = (name: string) => {
        probe.style.color = `var(${name})`;
        return getComputedStyle(probe).color;
      };
      const out = {
        line: resolve("--c--components--gantt--link-color"),
        casing: resolve("--c--components--gantt--link-casing-color"),
        fill: resolve("--c--components--gantt--bar-background-color"),
        hover: resolve("--c--components--gantt--row-background-color--hover"),
      };
      probe.remove();
      return out;
    });
    const view = await box(scroller(page));
    const vertical = await box(
      segments(page, "a", "c").and(page.locator('[data-axis="y"]')),
    );
    const build = await box(bar(page, "b"));
    const rowB = await box(row(page, 3));
    // Hovered row: the line over the track's hover colour, above the bar.
    await page.mouse.move(rowB.x + 20, rowB.y + 4);
    const x = vertical.x + vertical.width / 2 - view.x;
    const [onTrack, onBar, casing, fill] = await colorsAt(
      page,
      scroller(page),
      [
        [Math.floor(x), Math.floor(rowB.y + 3 - view.y)],
        [Math.floor(x), Math.floor(build.y + build.height / 2 - view.y)],
        [
          Math.floor(vertical.x + vertical.width - view.x),
          Math.floor(build.y + build.height / 2 - view.y),
        ],
        [
          Math.floor(vertical.x + vertical.width + 4 - view.x),
          Math.floor(build.y + build.height / 2 - view.y),
        ],
      ],
    );
    expect(onTrack).toEqual(rgb(colours.line));
    expect(onBar).toEqual(rgb(colours.line));
    expect(casing).toEqual(rgb(colours.casing));
    expect(fill).toEqual(rgb(colours.fill));
    expect(rgb(colours.hover)).not.toEqual(rgb(colours.line));
  });

  test("a real drag of a predecessor past its successor shows the conflict; Escape clears it", async ({
    mount,
    page,
  }) => {
    await mount(<EditableGantt dependencies={[{ from: "t0", to: "t1" }]} />);
    const conflict = () => link(page, "t0", "t1").getAttribute("data-conflict");
    expect(await conflict()).toBeNull();
    const t0 = await box(bar(page, "t0"));
    const px = t0.width / 10;
    const at = { x: t0.x + t0.width / 2, y: t0.y + t0.height / 2 };
    await page.mouse.move(at.x, at.y);
    await page.mouse.down();
    // One week on: t0 ends after t1 starts.
    await page.mouse.move(at.x + 7 * px, at.y, { steps: 6 });
    await expect.poll(conflict).not.toBeNull();
    await expect(
      link(page, "t0", "t1").locator(".c__gantt__link-flag"),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect.poll(conflict).toBeNull();
    // Motion on: the link snaps back with the bar, no tween.
    const first = await box(segments(page, "t0", "t1").first());
    expect(Math.abs(first.x - (t0.x + t0.width))).toBeLessThanOrEqual(1);
    await page.mouse.up();
  });

  test("after a zoom change the link ends sit on the bar edges at rest", async ({
    mount,
    page,
  }) => {
    await mount(<TestGantt dependencies={[{ from: "t0", to: "t1" }]} />);
    await hitTestable(page);
    await page.getByRole("button", { name: "Day" }).click();
    await settle(bar(page, "t1"));
    await settle(segments(page, "t0", "t1").last());
    await expectOnEdges(page, "t0", "t1");
  });
});

// Link editing with the pointer (s24 t03): real drags, clicks and touches on
// the connector and the links; hit areas measured by hit testing.
test.describe("Gantt link editing", () => {
  const recorder = () => {
    const calls: GanttDependencyChange[] = [];
    return {
      calls,
      onDependencyChange: (change: GanttDependencyChange) => calls.push(change),
    };
  };
  const connector = (page: Page, index: number) =>
    row(page, index).locator(".c__gantt__connector");
  const link = (page: Page, from: string, to: string) =>
    page.locator(`.c__gantt__link[data-from="${from}"][data-to="${to}"]`);
  const centre = async (locator: Locator) => {
    const b = await box(locator);
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };
  // Press a connector and move straight onto another row (a vertical drag).
  const dragLink = async (page: Page, from: number, to: number) => {
    const start = await centre(connector(page, from));
    const target = await box(row(page, to));
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x, target.y + target.height / 2, {
      steps: 6,
    });
  };

  test("a real drag from a connector to another row reports the link; it is drawn once applied", async ({
    mount,
    page,
  }) => {
    const { calls, onDependencyChange } = recorder();
    const component = await mount(
      <TestGantt editable onDependencyChange={onDependencyChange} />,
    );
    // Rows 4 and 6 hold t2 and t4.
    await dragLink(page, 4, 6);
    await expect(
      page.locator('.c__gantt__link[data-state="creating"]'),
    ).toHaveAttribute("data-to", "t4");
    await expect(page.locator('.c__gantt__tip[data-task-id="t4"]')).toHaveText(
      "Start Task 5 after Task 3",
    );
    await page.mouse.up();
    await expect.poll(() => calls.length).toBe(1);
    expect(calls[0]).toEqual({
      kind: "add",
      dependency: { from: "t2", to: "t4" },
    });
    await expect(page.locator('[data-state="creating"]')).toHaveCount(0);
    await component.update(
      <TestGantt
        editable
        onDependencyChange={onDependencyChange}
        dependencies={[{ from: "t2", to: "t4" }]}
      />,
    );
    await expect(link(page, "t2", "t4")).toHaveCount(1);
    await expect(link(page, "t2", "t4")).not.toHaveAttribute("data-state");
  });

  test("over a target that would make a loop the refusal shows, and the release reports nothing", async ({
    mount,
    page,
  }) => {
    const { calls, onDependencyChange } = recorder();
    await mount(
      <TestGantt
        editable
        onDependencyChange={onDependencyChange}
        dependencies={[
          { from: "t0", to: "t1" },
          { from: "t1", to: "t2" },
        ]}
      />,
    );
    await dragLink(page, 4, 2);
    const tip = page.locator('.c__gantt__tip[data-task-id="t0"]');
    await expect(tip).toHaveText("Not linked: this would create a loop");
    await expect(tip).toBeVisible();
    await expect(page.getByRole("status")).toHaveText(
      "Not linked: this would create a loop",
    );
    await page.mouse.up();
    await expect(tip).toBeVisible();
    expect(await bar(page, "t0").getAttribute("data-refused")).not.toBeNull();
    await page.waitForTimeout(200);
    expect(calls).toHaveLength(0);
  });

  test("hit areas: the connector is 24px, the end handle keeps its pixels, a U route's strip stays off the connector", async ({
    mount,
    page,
  }) => {
    // t0 ends two days before t1 starts: a U route out of t0's end.
    await mount(
      <TestGantt
        editable
        onDependencyChange={() => {}}
        dependencies={[{ from: "t0", to: "t1" }]}
      />,
    );
    const dot = connector(page, 2);
    // Polled: under load the first hit test can run before the rows
    // (content-visibility) are laid out.
    await expect.poll(() => hittable(dot, "x")).toBeGreaterThanOrEqual(24);
    expect(await hittable(dot, "y")).toBeGreaterThanOrEqual(24);
    const end = bar(page, "t0").locator('.c__gantt__handle[data-edge="end"]');
    expect(await hittable(end, "x")).toBeGreaterThanOrEqual(24);
    // Every pixel of the connector is the connector's, but the column it
    // shares with the strip (the boxes touch; hit testing gives the shared
    // edge to the overlay, painted later: the box check below is exact).
    const stolen = await dot.evaluate((el) => {
      const r = el.getBoundingClientRect();
      let other = 0;
      for (let x = Math.ceil(r.left); x < r.right - 1; x++)
        for (let y = Math.ceil(r.top); y < r.bottom; y++)
          if (document.elementFromPoint(x + 0.5, y + 0.5) !== el) other++;
      return other;
    });
    expect(stolen).toBe(0);
    // Just right of it, below the row centre: the route's vertical strip,
    // which starts where the connector ends.
    const b = await box(dot);
    const strip = await box(
      link(page, "t0", "t1").locator(".c__gantt__link-hit").first(),
    );
    expect(strip.x).toBeGreaterThanOrEqual(b.x + b.width - 0.01);
    expect(
      await page.evaluate(
        ([x, y]) =>
          document
            .elementFromPoint(x, y)
            ?.classList.contains("c__gantt__link-hit") ?? false,
        [b.x + b.width + 12, b.y + b.height / 2 + 8],
      ),
    ).toBe(true);
  });

  test("a real click selects a link, Delete removes it, Escape deselects", async ({
    mount,
    page,
  }) => {
    const { calls, onDependencyChange } = recorder();
    await mount(
      <TestGantt
        editable
        onDependencyChange={onDependencyChange}
        dependencies={[{ from: "t0", to: "t1" }]}
      />,
    );
    // The middle of the route's first vertical strip (the strips of one
    // link overlap at the corners: the pointer, not the locator, decides).
    const at = await centre(
      link(page, "t0", "t1").locator(".c__gantt__link-hit").first(),
    );
    const strip = { click: () => page.mouse.click(at.x, at.y) };
    await strip.click();
    await expect(link(page, "t0", "t1")).toHaveAttribute("data-selected");
    const remove = page.getByRole("button", {
      name: "Remove link from Task 1 to Task 2",
    });
    await expect(remove).toBeFocused();
    await page.keyboard.press("Delete");
    await expect.poll(() => calls.length).toBe(1);
    expect(calls[0]).toEqual({
      kind: "remove",
      dependency: { from: "t0", to: "t1" },
    });
    await expect(row(page, 2)).toBeFocused();

    await strip.click();
    await expect(remove).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(link(page, "t0", "t1")).not.toHaveAttribute("data-selected");
    await expect(remove).toHaveCount(0);
    await expect(row(page, 2)).toBeFocused();
    expect(calls).toHaveLength(1);
  });

  test("the refusal sentence paints above a link that crosses it", async ({
    mount,
    page,
  }) => {
    // A > C runs down through B's row, right where B's refusal sentence
    // (A > B exists) stands after B's bar.
    await mount(
      <TestGantt
        editable
        onDependencyChange={() => {}}
        tasks={[
          { id: "a", name: "A", start: "2026-01-05", end: "2026-01-07" },
          { id: "b", name: "B", start: "2026-01-05", end: "2026-01-09" },
          { id: "c", name: "C", start: "2026-01-20", end: "2026-01-23" },
        ]}
        dependencies={[
          { from: "a", to: "b" },
          { from: "a", to: "c" },
        ]}
      />,
    );
    await dragLink(page, 2, 3);
    await page.mouse.up();
    const tip = page.locator(".c__gantt__tip[data-refused]");
    await expect(tip).toHaveText("Not linked: B already starts after A");
    const t = await box(tip);
    const line = await box(link(page, "a", "c").locator('[data-axis="y"]'));
    const x = line.x + line.width / 2;
    // The line really crosses the sentence's box.
    expect(x).toBeGreaterThan(t.x + 4);
    expect(x).toBeLessThan(t.x + t.width - 4);
    const linkColour = rgb(
      await page.evaluate(() => {
        const probe = document.createElement("div");
        document.body.append(probe);
        probe.style.color = "var(--c--components--gantt--link-color)";
        const colour = getComputedStyle(probe).color;
        probe.remove();
        return colour;
      }),
    );
    const view = await box(scroller(page));
    const ys = Array.from({ length: Math.floor(t.height) - 4 }, (_, i) =>
      Math.floor(t.y + 2 + i - view.y),
    );
    const colours = await colorsAt(
      page,
      scroller(page),
      ys.map((y) => [Math.floor(x - view.x), y] as [number, number]),
    );
    expect(colours.filter((c) => c.join() === linkColour.join())).toEqual([]);
  });

  test("a task ending on the axis' last day keeps a reachable connector", async ({
    mount,
    page,
  }) => {
    await mount(
      <TestGantt
        editable
        onDependencyChange={() => {}}
        tasks={[
          { id: "a", name: "Long", start: "2026-01-05", end: "2026-12-26" },
          { id: "b", name: "Short", start: "2026-12-14", end: "2026-12-15" },
        ]}
      />,
    );
    await scroller(page).evaluate((el) => (el.scrollLeft = el.scrollWidth));
    const dot = connector(page, 2);
    await expect.poll(() => hittable(dot, "x")).toBeGreaterThanOrEqual(24);
    expect(await hittable(dot, "y")).toBeGreaterThanOrEqual(24);
    // The track is now wider than the axis: a tip on the start side still
    // ends before its bar (s23 preview, Short pressed near the axis end).
    const short = await box(bar(page, "b"));
    await page.mouse.move(short.x + short.width / 2, short.y + 5);
    await page.mouse.down();
    const tip = row(page, 3).locator(".c__gantt__tip");
    await expect(tip).toHaveAttribute("data-side", "start");
    const t = await box(tip);
    expect(t.x + t.width).toBeLessThanOrEqual(short.x);
    expect(t.x + t.width).toBeGreaterThan(short.x - 12);
    await page.keyboard.press("Escape");
    await page.mouse.up();
  });

  // The keyboard path (t04): Alt+Shift+Right on a focused row, the arrows
  // pick the other task, Enter links or unlinks, Escape cancels.
  test.describe("keyboard", () => {
    test("Alt+Shift+Right, ArrowDown, Enter links; the row keeps the focus, no history move", async ({
      mount,
      page,
    }) => {
      const { calls, onDependencyChange } = recorder();
      const component = await mount(
        <TestGantt editable onDependencyChange={onDependencyChange} />,
      );
      const url = page.url();
      // Row 4 holds t2; t3 is the first candidate, ArrowDown picks t4.
      await row(page, 4).focus();
      await page.keyboard.press("Alt+Shift+ArrowRight");
      await expect(
        page.locator('.c__gantt__link[data-state="creating"]'),
      ).toHaveAttribute("data-to", "t3");
      await page.keyboard.press("ArrowDown");
      await expect(page.getByRole("status")).toHaveText(
        "Link Task 3 to Task 5: Task 5 would start after Task 3 ends. Enter to link.",
      );
      expect(calls).toEqual([]);
      await page.keyboard.press("Enter");
      await expect.poll(() => calls.length).toBe(1);
      expect(calls[0]).toEqual({
        kind: "add",
        dependency: { from: "t2", to: "t4" },
      });
      await expect(row(page, 4)).toBeFocused();
      expect(page.url()).toBe(url);
      await component.update(
        <TestGantt
          editable
          onDependencyChange={onDependencyChange}
          dependencies={[{ from: "t2", to: "t4" }]}
        />,
      );
      await expect(link(page, "t2", "t4")).toHaveCount(1);
      await expect(link(page, "t2", "t4")).not.toHaveAttribute("data-state");
      await expect(row(page, 4)).toBeFocused();
    });

    test("the candidate is brought into view, clear of the sticky column and the axis", async ({
      mount,
      page,
    }) => {
      await mount(<TestGantt editable onDependencyChange={() => {}} />);
      await row(page, 2).focus();
      await page.keyboard.press("Alt+Shift+ArrowRight");
      // t29, the last task: far right and below the 300px box.
      await page.keyboard.press("End");
      await expect(
        page.locator('.c__gantt__link[data-state="creating"]'),
      ).toHaveAttribute("data-to", "t29");
      const column = await box(taskCells(page).first());
      const axis = await box(page.locator(".c__gantt__axis"));
      const view = await box(scroller(page));
      await expect
        .poll(async () => {
          const b = await box(bar(page, "t29"));
          return (
            b.x >= column.x + column.width - 1 &&
            b.x + b.width <= view.x + view.width + 1 &&
            b.y >= axis.y + axis.height - 1 &&
            b.y + b.height <= view.y + view.height + 1
          );
        })
        .toBe(true);
      await expect(row(page, 2)).toBeFocused();
    });

    test("the same chord on an existing pair removes it", async ({
      mount,
      page,
    }) => {
      const { calls, onDependencyChange } = recorder();
      await mount(
        <TestGantt
          editable
          onDependencyChange={onDependencyChange}
          dependencies={[{ from: "t2", to: "t3" }]}
        />,
      );
      await row(page, 4).focus();
      await page.keyboard.press("Alt+Shift+ArrowRight");
      await expect(page.getByRole("status")).toHaveText(
        "Task 4 already starts after Task 3. Enter to remove the link.",
      );
      await page.keyboard.press("Enter");
      await expect.poll(() => calls.length).toBe(1);
      expect(calls[0]).toEqual({
        kind: "remove",
        dependency: { from: "t2", to: "t3" },
      });
      await expect(row(page, 4)).toBeFocused();
    });

    test("Escape returns to the row without a call", async ({
      mount,
      page,
    }) => {
      const { calls, onDependencyChange } = recorder();
      await mount(
        <TestGantt editable onDependencyChange={onDependencyChange} />,
      );
      const url = page.url();
      await row(page, 4).focus();
      await page.keyboard.press("Alt+Shift+ArrowLeft");
      await expect(page.getByTestId("gantt")).toHaveAttribute(
        "data-editing",
        "link",
      );
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("gantt")).not.toHaveAttribute(
        "data-editing",
      );
      await expect(
        page.locator('.c__gantt__link[data-state="creating"]'),
      ).toHaveCount(0);
      await expect(page.getByRole("status")).toHaveText("Link cancelled");
      await expect(row(page, 4)).toBeFocused();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(100);
      expect(calls).toEqual([]);
      expect(page.url()).toBe(url);
    });
  });

  test.describe("touch", () => {
    test.use({ hasTouch: true });

    test("a finger drags a connector to another row; a cancelled touch reports nothing", async ({
      mount,
      page,
    }) => {
      const { calls, onDependencyChange } = recorder();
      await mount(
        <TestGantt editable onDependencyChange={onDependencyChange} />,
      );
      const cdp = await page.context().newCDPSession(page);
      const touch = (
        type: "touchStart" | "touchMove" | "touchEnd" | "touchCancel",
        x?: number,
        y?: number,
      ) =>
        cdp.send("Input.dispatchTouchEvent", {
          type,
          touchPoints: x === undefined ? [] : [{ x, y: y! }],
        });
      const start = await centre(connector(page, 3));
      const target = await box(row(page, 5));
      const to = { x: start.x, y: target.y + target.height / 2 };
      await touch("touchStart", start.x, start.y);
      for (let i = 1; i <= 6; i++) {
        await touch(
          "touchMove",
          start.x + ((to.x - start.x) * i) / 6,
          start.y + ((to.y - start.y) * i) / 6,
        );
      }
      await expect(page.getByTestId("gantt")).toHaveAttribute(
        "data-editing",
        "link",
      );
      await touch("touchEnd");
      await expect.poll(() => calls.length).toBe(1);
      expect(calls[0]).toEqual({
        kind: "add",
        dependency: { from: "t1", to: "t3" },
      });

      await touch("touchStart", start.x, start.y);
      await touch("touchMove", to.x, to.y);
      await expect(
        page.locator('.c__gantt__link[data-state="creating"]'),
      ).toHaveCount(1);
      await touch("touchCancel");
      await expect(page.getByTestId("gantt")).not.toHaveAttribute(
        "data-editing",
      );
      await expect(
        page.locator('.c__gantt__link[data-state="creating"]'),
      ).toHaveCount(0);
      expect(calls).toHaveLength(1);
    });
  });
});

// The demonstration data (s24 t05, AC6), the same module the `Dependencies`
// story loads: move, resize, link, a refused loop and an unlink, end to end,
// with a parent that applies every change.
test.describe("Gantt dependencies demo", () => {
  const rowOf = (page: Page, id: string) =>
    row(page, DEMO_TASKS.findIndex((t) => t.id === id) + 2);
  const link = (page: Page, from: string, to: string) =>
    page.locator(`.c__gantt__link[data-from="${from}"][data-to="${to}"]`);
  const centre = async (locator: Locator) => {
    const b = await box(locator);
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };
  const drag = async (
    page: Page,
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) => {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 8 });
  };

  test("move, resize, link, a refused loop and an unlink, each reported once", async ({
    mount,
    page,
  }) => {
    const tasks: [string, GanttTaskChange][] = [];
    const links: GanttDependencyChange[] = [];
    await mount(
      <DemoGantt
        onTaskChange={(id, change) => tasks.push([id, change])}
        onDependencyChange={(change) => links.push(change)}
      />,
    );
    const design = bar(page, "design");
    await expect.poll(() => hittable(design, "x")).toBeGreaterThan(24);
    const span = Number(
      await design.evaluate((el) =>
        (el as HTMLElement).style.getPropertyValue("--gantt-span"),
      ),
    );
    const px = (await box(design)).width / span;

    // Move: Design one week later now ends after the API starts.
    const conflict = () =>
      link(page, "design", "api").getAttribute("data-conflict");
    expect(await conflict()).toBeNull();
    const at = await centre(design);
    await drag(page, at, { x: at.x + 7 * px, y: at.y });
    await expect.poll(conflict).not.toBeNull();
    await page.mouse.up();
    await expect.poll(() => tasks.length).toBe(1);
    expect(tasks[0]).toEqual([
      "design",
      { start: "2026-03-16", end: "2026-03-27" },
    ]);
    await expect.poll(conflict).not.toBeNull();

    // Resize: the help pages end one week later, the start stays.
    const end = await centre(
      bar(page, "docs").locator('.c__gantt__handle[data-edge="end"]'),
    );
    await drag(page, end, { x: end.x + 7 * px, y: end.y });
    await page.mouse.up();
    await expect.poll(() => tasks.length).toBe(2);
    expect(tasks[1]).toEqual([
      "docs",
      { start: "2026-04-13", end: "2026-05-15" },
    ]);

    // Link: from the API's connector down onto the help pages.
    const dot = await centre(
      rowOf(page, "api").locator(".c__gantt__connector"),
    );
    const docs = await centre(rowOf(page, "docs"));
    await drag(page, dot, { x: dot.x, y: docs.y });
    await page.mouse.up();
    await expect.poll(() => links.length).toBe(1);
    expect(links[0]).toEqual({
      kind: "add",
      dependency: { from: "api", to: "docs" },
    });
    await expect(link(page, "api", "docs")).toHaveCount(1);

    // Refused: Integrate already comes after the brief, through the chain.
    const integrate = await centre(
      rowOf(page, "integrate").locator(".c__gantt__connector"),
    );
    const brief = await centre(rowOf(page, "brief"));
    await drag(page, integrate, { x: integrate.x, y: brief.y });
    const tip = page.locator('.c__gantt__tip[data-task-id="brief"]');
    await expect(tip).toHaveText("Not linked: this would create a loop");
    await expect(page.getByRole("status")).toHaveText(
      "Not linked: this would create a loop",
    );
    await page.mouse.up();
    await page.waitForTimeout(200);
    expect(links).toHaveLength(1);

    // Unlink from the keyboard: the brief's first candidate is the design,
    // already linked, so Enter removes that link.
    await rowOf(page, "brief").focus();
    await page.keyboard.press("Alt+Shift+ArrowRight");
    await expect(page.getByRole("status")).toHaveText(
      "Design the service already starts after Write the brief. Enter to remove the link.",
    );
    await page.keyboard.press("Enter");
    await expect.poll(() => links.length).toBe(2);
    expect(links[1]).toEqual({
      kind: "remove",
      dependency: { from: "brief", to: "design" },
    });
    await expect(link(page, "brief", "design")).toHaveCount(0);
    expect(tasks).toHaveLength(2);
  });
});
