import { test, expect } from "@playwright/experimental-ct-react";
import type { Locator } from "@playwright/test";
import { TestSwitches } from "../helpers/mount-form-controls";

const box = async (locator: Locator) => {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error("Element is not rendered");
  return rect;
};

// The handle is the rail's `::before`: no box, read from the computed style.
const handle = (rail: Locator) =>
  rail.evaluate((el) => {
    const style = getComputedStyle(el, "::before");
    const translate = new DOMMatrix(style.transform).m41;
    return {
      size: parseFloat(style.width),
      height: parseFloat(style.height),
      left: parseFloat(style.left),
      top: parseFloat(style.top),
      translate,
    };
  });

test.describe("Switch size", () => {
  test("default switch keeps its 45x24 rail, 18px handle and 20px travel", async ({
    mount,
    page,
  }) => {
    await mount(<TestSwitches />);
    const slot = page.getByTestId("default");
    const rail = await box(slot.locator(".c__switch__rail"));
    expect(rail.width).toBeCloseTo(45, 1);
    expect(rail.height).toBeCloseTo(24, 1);
    expect(await handle(slot.locator(".c__switch__rail"))).toEqual({
      size: 18,
      height: 18,
      left: 4,
      top: 3,
      translate: 0,
    });
    const checked = page
      .getByTestId("default-checked")
      .locator(".c__switch__rail");
    expect((await handle(checked)).translate).toBe(20);
  });

  test("small switch has a 32x16 rail, a 12px handle and a hit area of at least 24px", async ({
    mount,
    page,
  }) => {
    await mount(<TestSwitches />);
    const slot = page.getByTestId("small");
    const rail = await box(slot.locator(".c__switch__rail"));
    const label = await box(slot.locator("label"));
    expect(rail.width).toBeCloseTo(32, 1);
    expect(rail.height).toBeCloseTo(16, 1);
    const knob = await handle(slot.locator(".c__switch__rail"));
    expect(knob.size).toBeCloseTo(12, 1);
    expect(knob.height).toBeCloseTo(12, 1);
    expect(knob.left).toBeCloseTo(2, 1);
    expect(knob.top).toBeCloseTo(2, 1);
    expect(label.width).toBeGreaterThanOrEqual(24);
    expect(label.height).toBeGreaterThanOrEqual(24);
  });

  test("checked small handle ends 2px from the rail's right edge", async ({
    mount,
    page,
  }) => {
    await mount(<TestSwitches />);
    const rail = page.getByTestId("small-checked").locator(".c__switch__rail");
    const railBox = await box(rail);
    const knob = await handle(rail);
    expect(knob.translate).toBeCloseTo(16, 1);
    expect(knob.left + knob.translate + knob.size).toBeCloseTo(
      railBox.width - 2,
      1,
    );
  });

  test("label sides: left puts the label first, right puts the rail first and indents the hint", async ({
    mount,
    page,
  }) => {
    await mount(<TestSwitches />);
    const left = page.getByTestId("small-left");
    const leftRail = await box(left.locator(".c__switch__rail"));
    const leftLabel = await box(left.getByText("Left", { exact: true }));
    expect(leftLabel.x).toBeLessThan(leftRail.x);

    const right = page.getByTestId("small-right");
    const rightRail = await box(right.locator(".c__switch__rail"));
    const rightLabel = await box(right.getByText("Right", { exact: true }));
    const hint = await box(right.getByText("Hint", { exact: true }));
    expect(rightRail.x).toBeLessThan(rightLabel.x);
    expect(hint.x - rightRail.x).toBeCloseTo(32 + 8, 1);
  });

  test("keyboard focuses and toggles it, the label shows the focus ring; a click on the label padding toggles it", async ({
    mount,
    page,
  }) => {
    await mount(<TestSwitches />);
    const slot = page.getByTestId("small");
    const input = slot.getByRole("checkbox");
    const brand = await page
      .getByTestId("brand-probe")
      .evaluate((el) => getComputedStyle(el).color);

    await page.getByRole("button", { name: "Before" }).focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(input).toBeFocused();
    await expect(slot.locator("label")).toHaveCSS("border-top-color", brand);
    await page.keyboard.press("Space");
    await expect(input).toBeChecked();

    await slot.locator("label").click({ position: { x: 2, y: 2 } });
    await expect(input).not.toBeChecked();
  });
});
