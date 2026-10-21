import { test, expect } from "@playwright/experimental-ct-react";
import { TestDropdown } from "../helpers/mount-dropdown-menu";

test.describe("DropdownMenu long labels", () => {
  test("default variant: the menu stops at 300px and the label wraps without overflow", async ({
    mount,
    page,
  }) => {
    await mount(<TestDropdown />);
    const menu = page.locator(".c__dropdown-menu");
    const box = await menu.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(300);

    const items = page.getByRole("menuitemcheckbox");
    const first = await items.nth(0).boundingBox();
    const second = await items.nth(1).boundingBox();
    // The long label wraps onto several lines...
    expect(first!.height).toBeGreaterThan(40);
    // ...inside the menu, and does not cover the next option.
    expect(first!.x + first!.width).toBeLessThanOrEqual(box!.x + box!.width + 1);
    expect(first!.y + first!.height).toBeLessThanOrEqual(second!.y + 1);
    const overflow = await items.nth(0).evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(overflow).toBe(false);
  });

  test("tiny variant: a 16px row, the label cut with an ellipsis, the full text in the name", async ({
    mount,
    page,
  }) => {
    await mount(<TestDropdown variant="tiny" />);
    const item = page.getByRole("menuitemcheckbox", { name: /Les personnes disposant/ });
    // The accessible name keeps the whole label.
    await expect(item).toHaveAccessibleName(/sans se connecter/);
    const label = item.locator(".c__dropdown-menu-item__label").first();
    await expect(label).toHaveCSS("text-overflow", "ellipsis");
    const truncated = await label.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(truncated).toBe(true);
    const row = await item.boundingBox();
    expect(row!.height).toBeLessThanOrEqual(34);
  });

  test("the focused row shows a visible ring", async ({ mount, page }) => {
    await mount(<TestDropdown />);
    const focused = page.locator('[data-focused="true"]').first();
    await expect(focused).toBeVisible();
    const shadow = await focused.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).toContain("inset");
    expect(shadow).not.toBe("none");
  });
});
