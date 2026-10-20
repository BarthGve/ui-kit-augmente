import { test, expect } from "@playwright/experimental-ct-react";
import { TestChart } from "../helpers/mount-chart";

test.describe("Chart", () => {
  test("draws bars with a real height, taller for larger values", async ({ mount, page }) => {
    await mount(<TestChart />);
    const bars = page.locator(".c__chart__bar");
    await expect(bars).toHaveCount(6);
    const heights = await bars.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(Math.min(...heights)).toBeGreaterThan(5);
    // Sales of February (18) is the tallest of all.
    expect(heights[1]).toBe(Math.max(...heights));
  });

  test("fills its container and follows its width", async ({ mount, page }) => {
    const component = await mount(<TestChart width={640} />);
    const svg = page.locator("svg.c__chart__svg");
    const first = (await svg.boundingBox())!.width;
    expect(first).toBeGreaterThan(600);
    await component.update(<TestChart width={320} />);
    await expect.poll(async () => (await svg.boundingBox())!.width).toBeLessThan(330);
    await expect(svg).toHaveAttribute("viewBox", /^0 0 3\d\d /);
  });

  test("shows the tooltip with the keyboard and a table alternative", async ({ mount, page }) => {
    await mount(<TestChart type="line" />);
    await page.locator(".c__chart__plot").focus();
    await expect(page.locator(".c__chart__tooltip")).toContainText("Jan");
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".c__chart__tooltip")).toContainText("Feb");
    await page.getByRole("button", { name: "View data as a table" }).click();
    await expect(page.getByRole("table", { name: "Monthly results" })).toBeVisible();
  });
});
