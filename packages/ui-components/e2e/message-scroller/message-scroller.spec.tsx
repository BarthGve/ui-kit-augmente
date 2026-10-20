import { test, expect } from "@playwright/experimental-ct-react";
import { TestMessageScroller } from "../helpers/mount-message-scroller";

const region = (page: import("@playwright/test").Page) =>
  page.getByRole("region", { name: "Conversation" });
const top = (page: import("@playwright/test").Page) =>
  region(page).evaluate((el) => el.scrollTop);
const atEnd = (page: import("@playwright/test").Page) =>
  region(page).evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight);

test.describe("MessageScroller", () => {
  test("starts at the latest message and follows new ones while at the end", async ({ mount, page }) => {
    await mount(<TestMessageScroller />);
    expect(await atEnd(page)).toBeLessThan(2);
    await page.getByRole("button", { name: "Append" }).click();
    await page.getByRole("button", { name: "Append" }).click();
    await expect.poll(() => atEnd(page)).toBeLessThan(2);
    await expect(page.getByText("Message 131")).toBeInViewport();
    await expect(page.getByRole("button", { name: "Jump to latest" })).toHaveCount(0);
  });

  test("stays put when the reader has scrolled up, and offers a jump button", async ({ mount, page }) => {
    await mount(<TestMessageScroller />);
    await region(page).evaluate((el) => (el.scrollTop = 200));
    const before = await top(page);
    await page.getByRole("button", { name: "Append" }).click();
    await page.getByRole("button", { name: "Append" }).click();
    expect(await top(page)).toBe(before);
    const jump = page.getByRole("button", { name: "Jump to latest" });
    await expect(jump).toBeVisible();
    await jump.click();
    await expect.poll(() => atEnd(page)).toBeLessThan(2);
    await expect(jump).toHaveCount(0);
  });

  test("keeps the reader's place when older messages are added above", async ({ mount, page }) => {
    await mount(<TestMessageScroller />);
    await region(page).evaluate((el) => (el.scrollTop = 400));
    const probe = page.getByText("Message 110", { exact: true });
    const yBefore = (await probe.boundingBox())!.y;
    await page.getByRole("button", { name: "Prepend" }).click();
    await expect.poll(async () => Math.abs((await probe.boundingBox())!.y - yBefore)).toBeLessThanOrEqual(2);
  });

  test("jumps to a given message", async ({ mount, page }) => {
    await mount(<TestMessageScroller />);
    await region(page).evaluate((el) => (el.scrollTop = el.scrollHeight));
    await page.getByRole("button", { name: "Jump to 105" }).click();
    await expect(page.getByText("Message 105", { exact: true })).toBeInViewport();
  });

  test("the viewport is a focusable region and scrolls with the keyboard", async ({ mount, page }) => {
    await mount(<TestMessageScroller />);
    await region(page).focus();
    await expect(region(page)).toBeFocused();
    const before = await top(page);
    await page.keyboard.press("PageUp");
    await expect.poll(() => top(page)).toBeLessThan(before);
  });
});
