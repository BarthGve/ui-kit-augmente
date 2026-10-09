import { test, expect } from "@playwright/experimental-ct-react";
import type { Locator } from "@playwright/test";
import { TestCheckboxes } from "../helpers/mount-form-controls";

const box = async (locator: Locator) => {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error("Element is not rendered");
  return rect;
};

test.describe("Checkbox size", () => {
  test("default checkbox keeps its 24px box and 34px hit area", async ({
    mount,
    page,
  }) => {
    await mount(<TestCheckboxes />);
    const slot = page.getByTestId("default");
    const input = await box(slot.getByRole("checkbox"));
    const label = await box(slot.locator("label"));
    expect(input.width).toBeCloseTo(24, 1);
    expect(input.height).toBeCloseTo(24, 1);
    expect(label.width).toBeCloseTo(34, 1);
    expect(label.height).toBeCloseTo(34, 1);
  });

  test("small checkbox has a 16px box inside a hit area of at least 24px", async ({
    mount,
    page,
  }) => {
    await mount(<TestCheckboxes />);
    const slot = page.getByTestId("small");
    const input = await box(slot.getByRole("checkbox"));
    const label = await box(slot.locator("label"));
    expect(input.width).toBeCloseTo(16, 1);
    expect(input.height).toBeCloseTo(16, 1);
    expect(label.width).toBeGreaterThanOrEqual(24);
    expect(label.height).toBeGreaterThanOrEqual(24);
  });

  test("a click on the label padding, outside the box, toggles it", async ({
    mount,
    page,
  }) => {
    await mount(<TestCheckboxes />);
    const slot = page.getByTestId("small");
    const input = slot.getByRole("checkbox");
    await slot.locator("label").click({ position: { x: 2, y: 2 } });
    await expect(input).toBeChecked();
  });

  test("keyboard focuses and toggles it, the label shows the focus ring", async ({
    mount,
    page,
  }) => {
    await mount(<TestCheckboxes />);
    const slot = page.getByTestId("small");
    const input = slot.getByRole("checkbox");
    const brand = await page
      .getByTestId("brand-probe")
      .evaluate((el) => getComputedStyle(el).color);

    await page.getByRole("button", { name: "Before" }).focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(input).toBeFocused();
    await expect(slot.locator("label")).toHaveCSS("border-top-color", brand);
    await page.keyboard.press("Space");
    await expect(input).toBeChecked();
  });

  test("check and indeterminate marks fit the 16px box", async ({
    mount,
    page,
  }) => {
    await mount(<TestCheckboxes />);
    const small = page.getByTestId("small");
    const input = await box(small.getByRole("checkbox"));
    const check = await box(small.locator("svg.checkmark"));
    expect(check.width).toBeCloseTo(16, 1);
    expect(check.height).toBeCloseTo(16, 1);
    expect(check.x).toBeCloseTo(input.x, 1);
    expect(check.y).toBeCloseTo(input.y, 1);

    const partial = page.getByTestId("small-indeterminate");
    const partialInput = await box(partial.getByRole("checkbox"));
    const dash = partial.locator("svg.indeterminate");
    const dashBox = await box(dash);
    expect(dashBox.width).toBeCloseTo(16, 1);
    expect(dashBox.x).toBeCloseTo(partialInput.x, 1);
    expect(dashBox.y).toBeCloseTo(partialInput.y, 1);
    await expect(dash).not.toHaveCSS("clip-path", /100%/);
  });

  test("hint text is indented by the box width plus the 8px gap", async ({
    mount,
    page,
  }) => {
    await mount(<TestCheckboxes />);
    const slot = page.getByTestId("small-hint");
    const input = await box(slot.getByRole("checkbox"));
    const hint = await box(slot.getByText("Hint", { exact: true }));
    expect(hint.x - input.x).toBeCloseTo(16 + 8, 1);
  });
});
