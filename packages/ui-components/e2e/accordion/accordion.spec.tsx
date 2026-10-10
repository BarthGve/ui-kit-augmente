import { test, expect } from "@playwright/experimental-ct-react";
import type { Locator } from "@playwright/test";
import { TestAccordion } from "../helpers/mount-accordion";

// Only the arrow / Home / End test is new behaviour (t02). The other tests
// already passed with t01: they are kept as real-browser regression guards
// for what jsdom cannot render (outline, layout, media queries).

const panelOf = async (trigger: Locator) =>
  trigger
    .page()
    .locator(`[id="${await trigger.getAttribute("aria-controls")}"]`);

test.describe("Accordion", () => {
  test("arrow keys, Home and End move focus across triggers", async ({
    mount,
    page,
  }) => {
    await mount(<TestAccordion />);
    const [alpha, bravo, charlie] = ["Alpha", "Bravo", "Charlie"].map((name) =>
      page.getByRole("button", { name, exact: true }),
    );
    await page.getByRole("button", { name: "Before accordion" }).focus();
    await page.keyboard.press("Tab");
    await expect(alpha).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(bravo).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(alpha).toBeFocused();
    await page.keyboard.press("End");
    await expect(charlie).toBeFocused();
    await page.keyboard.press("Home");
    await expect(alpha).toBeFocused();
  });

  test("keyboard focus draws a 2px solid ring fully inside the accordion", async ({
    mount,
    page,
  }) => {
    await mount(<TestAccordion />);
    const alpha = page.getByRole("button", { name: "Alpha", exact: true });
    await page.getByRole("button", { name: "Before accordion" }).focus();
    await page.keyboard.press("Tab");
    await expect(alpha).toBeFocused();
    await expect(alpha).toHaveCSS("outline-style", "solid");
    await expect(alpha).toHaveCSS("outline-width", "2px");

    // The ring's outer edge sits at offset + width from the trigger's border
    // box; it must not reach past the trigger, itself inside the accordion.
    const ring = await alpha.evaluate((el) => {
      const style = getComputedStyle(el);
      return parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth);
    });
    expect(ring).toBeLessThanOrEqual(0);
    const box = (await alpha.boundingBox())!;
    const root = (await page.getByTestId("accordion").boundingBox())!;
    expect(box.x - ring).toBeGreaterThanOrEqual(root.x);
    expect(box.y - ring).toBeGreaterThanOrEqual(root.y);
    expect(box.x + box.width + ring).toBeLessThanOrEqual(root.x + root.width);
    expect(box.y + box.height + ring).toBeLessThanOrEqual(root.y + root.height);
  });

  test("shows no ring after a mouse click", async ({ mount, page }) => {
    await mount(<TestAccordion />);
    const alpha = page.getByRole("button", { name: "Alpha", exact: true });
    await alpha.click();
    await expect(alpha).toBeFocused();
    await expect(alpha).not.toHaveCSS("outline-style", "solid");
  });

  test("Enter and Space toggle; collapsed content takes no space and is not tabbable", async ({
    mount,
    page,
  }) => {
    await mount(<TestAccordion />);
    const alpha = page.getByRole("button", { name: "Alpha", exact: true });
    const panel = await panelOf(alpha);
    const height = () =>
      panel.evaluate((el) => el.getBoundingClientRect().height);

    await alpha.focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Bravo" })).toBeFocused();
    expect(await height()).toBe(0);

    await alpha.focus();
    await page.keyboard.press("Enter");
    await expect(alpha).toHaveAttribute("aria-expanded", "true");
    await expect.poll(height).toBeGreaterThan(0);
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Inside Alpha" }),
    ).toBeFocused();

    await alpha.focus();
    await page.keyboard.press("Space");
    await expect(alpha).toHaveAttribute("aria-expanded", "false");
    await expect.poll(height).toBe(0);
  });

  test("removes the panel transition under reduced motion", async ({
    mount,
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mount(<TestAccordion />);
    const panel = await panelOf(
      page.getByRole("button", { name: "Alpha", exact: true }),
    );
    await expect(panel).toHaveCSS("transition-duration", "0s");
  });
});
