import { test, expect } from "@playwright/experimental-ct-react";
import type { Locator, Page } from "@playwright/test";
import { TestGantt } from "../helpers/mount-gantt";

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
});
