import { test, expect } from "@playwright/experimental-ct-react";
import type { Page } from "@playwright/test";
import { TestTimeline } from "../helpers/mount-timeline";

// jsdom has no layout: scroll, focus ring and stacking are checked here.

const pageScrollsSideways = (page: Page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );

test.describe("Timeline", () => {
  test("horizontal: the region scrolls inside a 320px container, not the page", async ({
    mount,
    page,
  }) => {
    await mount(<TestTimeline orientation="horizontal" />);
    const region = page.getByRole("region", { name: "History" });
    await expect(region).toHaveCSS("overflow-x", "auto");
    const { scrollWidth, clientWidth } = await region.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(clientWidth).toBeLessThanOrEqual(320);
    expect(scrollWidth).toBeGreaterThan(clientWidth);
    expect(await pageScrollsSideways(page)).toBe(false);

    // Items sit on one row, in order.
    const items = page.getByRole("listitem");
    const xs = await items.evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect()),
    );
    expect(new Set(xs.map((box) => box.top)).size).toBe(1);
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i].left).toBeGreaterThan(xs[i - 1].left);
    }
  });

  test("horizontal: Tab focuses the region with a 2px ring inside it, ArrowRight scrolls", async ({
    mount,
    page,
  }) => {
    await mount(<TestTimeline orientation="horizontal" />);
    const region = page.getByRole("region", { name: "History" });
    await page.getByRole("button", { name: "Before timeline" }).focus();
    await page.keyboard.press("Tab");
    await expect(region).toBeFocused();
    await expect(region).toHaveCSS("outline-style", "solid");
    await expect(region).toHaveCSS("outline-width", "2px");
    // The ring's outer edge is offset + width from the border box: <= 0
    // keeps it inside the region, so no ancestor can clip it.
    const ring = await region.evaluate((el) => {
      const style = getComputedStyle(el);
      return parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth);
    });
    expect(ring).toBeLessThanOrEqual(0);

    await page.keyboard.press("ArrowRight");
    await expect
      .poll(() => region.evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(0);
  });

  test("horizontal: 24px markers, a 2px connector between them, 192px items", async ({
    mount,
    page,
  }) => {
    await mount(<TestTimeline orientation="horizontal" />);
    const geometry = await page.getByRole("listitem").evaluateAll((els) =>
      els.map((el) => ({
        item: el.getBoundingClientRect(),
        marker: el
          .querySelector(".c__timeline__marker")!
          .getBoundingClientRect(),
        connector: getComputedStyle(el, "::after"),
      })),
    );
    const [first, second] = geometry;
    expect(first.marker.width).toBe(24);
    expect(first.marker.height).toBe(24);
    expect(first.item.width).toBeGreaterThanOrEqual(192);
    // The connector is a 2px line running from the marker to the next one.
    expect(first.connector.height).toBe("2px");
    expect(parseFloat(first.connector.width)).toBeCloseTo(
      second.marker.left - first.marker.right,
      0,
    );
    expect(geometry.at(-1)!.connector.content).toBe("none");
  });

  test("vertical: items stack and nothing overflows sideways", async ({
    mount,
    page,
  }) => {
    await mount(<TestTimeline orientation="vertical" />);
    await expect(page.getByRole("region")).toHaveCount(0);
    const tops = await page
      .getByRole("listitem")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
    for (let i = 1; i < tops.length; i++) {
      expect(tops[i]).toBeGreaterThan(tops[i - 1]);
    }
    const list = page.getByRole("list", { name: "History" });
    expect(await list.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    expect(await pageScrollsSideways(page)).toBe(false);
  });
});
