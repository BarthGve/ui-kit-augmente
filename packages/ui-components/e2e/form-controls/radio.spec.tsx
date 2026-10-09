import { test, expect } from "@playwright/experimental-ct-react";
import type { Locator } from "@playwright/test";
import { TestRadios } from "../helpers/mount-form-controls";

const box = async (locator: Locator) => {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error("Element is not rendered");
  return rect;
};

const dot = (input: Locator) =>
  input.evaluate((el) => {
    const style = getComputedStyle(el, "::before");
    return { width: parseFloat(style.width), height: parseFloat(style.height) };
  });

test.describe("Radio size", () => {
  test("default radio keeps its 24px box, 16px dot and 34px hit area", async ({
    mount,
    page,
  }) => {
    await mount(<TestRadios />);
    const slot = page.getByTestId("default");
    const radio = slot.getByRole("radio");
    const input = await box(radio);
    const label = await box(slot.locator("label"));
    expect(input.width).toBeCloseTo(24, 1);
    expect(input.height).toBeCloseTo(24, 1);
    expect(label.width).toBeCloseTo(34, 1);
    expect(label.height).toBeCloseTo(34, 1);
    expect(await dot(radio)).toEqual({ width: 16, height: 16 });
  });

  test("small radio has a 16px box inside a hit area of at least 24px", async ({
    mount,
    page,
  }) => {
    await mount(<TestRadios />);
    const slot = page.getByTestId("small-bare");
    const input = await box(slot.getByRole("radio"));
    const label = await box(slot.locator("label"));
    expect(input.width).toBeCloseTo(16, 1);
    expect(input.height).toBeCloseTo(16, 1);
    expect(label.width).toBeGreaterThanOrEqual(24);
    expect(label.height).toBeGreaterThanOrEqual(24);
  });

  test("the checked dot of a small radio is 2/3 of its box", async ({
    mount,
    page,
  }) => {
    await mount(<TestRadios />);
    const radio = page.getByTestId("small-bare").getByRole("radio");
    await radio.check();
    const { width, height } = await dot(radio);
    expect(width).toBeCloseTo((16 * 2) / 3, 1);
    expect(height).toBeCloseTo((16 * 2) / 3, 1);
  });

  test("a click on the label padding, outside the box, selects it", async ({
    mount,
    page,
  }) => {
    await mount(<TestRadios />);
    const slot = page.getByTestId("small-bare");
    await slot.locator("label").click({ position: { x: 2, y: 2 } });
    await expect(slot.getByRole("radio")).toBeChecked();
  });

  test("keyboard enters the group, arrows move the selection, the label shows the focus ring", async ({
    mount,
    page,
  }) => {
    await mount(<TestRadios />);
    const slot = page.getByTestId("small");
    const one = slot.getByRole("radio", { name: "One" });
    const two = slot.getByRole("radio", { name: "Two" });
    const brand = await page
      .getByTestId("brand-probe")
      .evaluate((el) => getComputedStyle(el).color);

    await page.getByRole("button", { name: "Before" }).focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(one).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(two).toBeFocused();
    await expect(two).toBeChecked();
    await expect(one).not.toBeChecked();
    await expect(slot.locator("label").nth(1)).toHaveCSS(
      "border-top-color",
      brand,
    );
  });
});
