import { test, expect } from "@playwright/experimental-ct-react";
import { TestToolbar } from "../helpers/mount-toolbar";

test.describe("Toolbar", () => {
  test("is a single tab stop and arrows move between the controls", async ({
    mount,
    page,
  }) => {
    await mount(<TestToolbar />);
    const button = (name: string) => page.getByRole("button", { name });

    await button("Before").focus();
    await page.keyboard.press("Tab");
    await expect(button("Bold")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(button("Italic")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    // The disabled button is skipped.
    await expect(button("Quote")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(button("Italic")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(button("After")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(button("Italic")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(button("Before")).toBeFocused();
  });

  test("wraps controls that do not fit, none cut off", async ({
    mount,
    page,
  }) => {
    await mount(<TestToolbar width={200} />);
    const toolbar = page.getByRole("toolbar", { name: "Formatting" });
    const box = await toolbar.boundingBox();
    const tops = new Set<number>();
    for (const name of ["Bold", "Italic", "Quote", "Code"]) {
      const b = await page.getByRole("button", { name }).boundingBox();
      expect(b!.x + b!.width).toBeLessThanOrEqual(box!.x + box!.width + 1);
      tops.add(Math.round(b!.y));
    }
    expect(tops.size).toBeGreaterThan(1);
  });
});
