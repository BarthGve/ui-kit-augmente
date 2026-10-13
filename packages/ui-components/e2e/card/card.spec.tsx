import { test, expect } from "@playwright/experimental-ct-react";
import { TestCard } from "../helpers/mount-card";

test.describe("Card", () => {
  test("Tab skips the static card and shows a ring on interactive cards only", async ({
    mount,
    page,
  }) => {
    await mount(<TestCard />);
    const link = page.getByRole("link", { name: "Linked card" });
    const button = page.getByRole("button", { name: "Pressable card" });

    await page.getByRole("button", { name: "Before cards" }).focus();
    await page.keyboard.press("Tab");
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS("outline-style", "solid");
    await expect(link).toHaveCSS("outline-width", "2px");

    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    await expect(button).toHaveCSS("outline-style", "solid");
    await expect(button).toHaveCSS("outline-width", "2px");
  });

  test("shows no ring after a mouse click", async ({ mount, page }) => {
    await mount(<TestCard />);
    const button = page.getByRole("button", { name: "Pressable card" });
    await button.click();
    await expect(button).toBeFocused();
    await expect(button).not.toHaveCSS("outline-style", "solid");
  });

  test("Enter and Space press the onPress card once each", async ({
    mount,
    page,
  }) => {
    await mount(<TestCard />);
    const presses = page.getByLabel("Presses");
    await page.getByRole("button", { name: "Pressable card" }).focus();
    await page.keyboard.press("Enter");
    await expect(presses).toHaveText("1");
    await page.keyboard.press("Space");
    await expect(presses).toHaveText("2");
  });

  test("Enter follows the href card", async ({ mount, page }) => {
    await mount(<TestCard />);
    await page.getByRole("link", { name: "Linked card" }).focus();
    await page.keyboard.press("Enter");
    await expect
      .poll(() => page.evaluate(() => location.hash))
      .toBe("#card-target");
  });
});
