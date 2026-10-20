import { test, expect } from "@playwright/experimental-ct-react";
import { TestResizable } from "../helpers/mount-resizable";

const handle = (page: import("@playwright/test").Page) =>
  page.getByRole("separator", { name: "Resize left panel" });

test.describe("Resizable", () => {
  test("the handle is a separator with a name and its value", async ({ mount, page }) => {
    await mount(<TestResizable />);
    await expect(handle(page)).toHaveAttribute("aria-valuenow", /^\d+(\.\d+)?$/);
    await expect(handle(page)).toHaveAttribute("aria-orientation", "vertical");
  });

  test("arrow keys move the handle, Home and End jump to the limits", async ({ mount, page }) => {
    await mount(<TestResizable />);
    await handle(page).focus();
    const before = Number(await handle(page).getAttribute("aria-valuenow"));
    await page.keyboard.press("ArrowRight");
    await expect.poll(async () => Number(await handle(page).getAttribute("aria-valuenow"))).toBeGreaterThan(before);
    await page.keyboard.press("End");
    await expect.poll(async () => Number(await handle(page).getAttribute("aria-valuenow"))).toBeCloseTo(80, 0);
    await page.keyboard.press("Home");
    await expect.poll(async () => Number(await handle(page).getAttribute("aria-valuenow"))).toBeCloseTo(20, 0);
  });

  test("the sizes stay within minSize and maxSize when dragging", async ({ mount, page }) => {
    await mount(<TestResizable />);
    const box = (await handle(page).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + 500, box.y + 50, { steps: 5 });
    await page.mouse.up();
    const value = Number(await handle(page).getAttribute("aria-valuenow"));
    expect(value).toBeLessThanOrEqual(80.5);
    await page.mouse.move(box.x + 500, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x - 500, box.y + 50, { steps: 5 });
    await page.mouse.up();
    expect(Number(await handle(page).getAttribute("aria-valuenow"))).toBeGreaterThanOrEqual(19.5);
  });

  test("reports the new sizes and follows a controlled layout", async ({ mount, page }) => {
    await mount(<TestResizable />);
    await handle(page).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByLabel("last layout")).not.toHaveText("none");
    await page.getByRole("button", { name: "Set 30/70" }).click();
    await expect.poll(async () => Number(await handle(page).getAttribute("aria-valuenow"))).toBeCloseTo(30, 0);
  });

  test("a double click puts the panels back to their default size", async ({ mount, page }) => {
    await mount(<TestResizable />);
    await handle(page).focus();
    await page.keyboard.press("End");
    await expect.poll(async () => Number(await handle(page).getAttribute("aria-valuenow"))).toBeCloseTo(80, 0);
    await handle(page).dblclick();
    await expect.poll(async () => Number(await handle(page).getAttribute("aria-valuenow"))).toBeCloseTo(50, 0);
  });

  test("vertical groups stack the panels", async ({ mount, page }) => {
    await mount(<TestResizable orientation="vertical" />);
    await expect(handle(page)).toHaveAttribute("aria-orientation", "horizontal");
    const a = await page.getByText("Left", { exact: true }).boundingBox();
    const b = await page.getByText("Right", { exact: true }).boundingBox();
    expect(b!.y).toBeGreaterThan(a!.y);
  });
});
