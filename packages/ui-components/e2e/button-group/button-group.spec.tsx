import { test, expect } from "@playwright/experimental-ct-react";
import { TestButtonGroup } from "../helpers/mount-button-group";

const radii = (page: import("@playwright/test").Page, name: string) =>
  page.getByRole("button", { name }).evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      tl: parseFloat(s.borderTopLeftRadius),
      tr: parseFloat(s.borderTopRightRadius),
      bl: parseFloat(s.borderBottomLeftRadius),
      br: parseFloat(s.borderBottomRightRadius),
    };
  });

test.describe("ButtonGroup", () => {
  test("horizontal: radius only on the outer edges, borders shared", async ({ mount, page }) => {
    await mount(<TestButtonGroup />);
    const left = await radii(page, "Left");
    const center = await radii(page, "Center");
    const right = await radii(page, "Right");
    expect(left.tl).toBeGreaterThan(0);
    expect(left.bl).toBeGreaterThan(0);
    expect(left.tr).toBe(0);
    expect(left.br).toBe(0);
    expect(center).toEqual({ tl: 0, tr: 0, bl: 0, br: 0 });
    expect(right.tr).toBeGreaterThan(0);
    expect(right.br).toBeGreaterThan(0);
    expect(right.tl).toBe(0);
    expect(right.bl).toBe(0);

    const a = await page.getByRole("button", { name: "Left" }).boundingBox();
    const b = await page.getByRole("button", { name: "Center" }).boundingBox();
    // The buttons overlap by the border width, so one line separates them.
    expect(b!.x).toBeLessThan(a!.x + a!.width);
  });

  test("vertical: stacked, radius on the top and bottom edges", async ({ mount, page }) => {
    await mount(<TestButtonGroup orientation="vertical" />);
    const left = await radii(page, "Left");
    const right = await radii(page, "Right");
    expect(left.tl).toBeGreaterThan(0);
    expect(left.tr).toBeGreaterThan(0);
    expect(left.bl).toBe(0);
    expect(right.bl).toBeGreaterThan(0);
    expect(right.br).toBeGreaterThan(0);
    expect(right.tl).toBe(0);
    const a = await page.getByRole("button", { name: "Left" }).boundingBox();
    const b = await page.getByRole("button", { name: "Center" }).boundingBox();
    expect(b!.y).toBeGreaterThanOrEqual(a!.y + a!.height - 2);
    expect(b!.x).toBeCloseTo(a!.x, 0);
  });
});
