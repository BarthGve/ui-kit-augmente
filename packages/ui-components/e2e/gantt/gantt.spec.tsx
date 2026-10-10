import { test, expect } from "@playwright/experimental-ct-react";
import type { Locator, Page } from "@playwright/test";
import type { GanttTaskChange } from "../../src/components/gantt/types";
import {
  ControlledGantt,
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
  const png = (await locator.screenshot()).toString("base64");
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
  // Pixels along a line through the box where the handle is the hit target:
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
