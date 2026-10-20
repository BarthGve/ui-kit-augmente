import { readFileSync } from "fs";
import { resolve } from "path";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HoverCard, HoverCardProps } from "./HoverCard";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const setup = (props: Partial<HoverCardProps> = {}) =>
  render(
    <>
      <button>before</button>
      <HoverCard
        trigger={<a href="#ada">@ada</a>}
        content={
          <div>
            <b>Ada Lovelace</b>
            <a href="#profile">Open profile</a>
          </div>
        }
        {...props}
      />
      <button>after</button>
    </>,
  );
const trigger = () => screen.getByRole("link", { name: "@ada" });
const card = () => screen.queryByText("Ada Lovelace");
const wait = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

describe("HoverCard", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: false }));
  afterEach(() => vi.useRealTimers());

  it("is closed until the trigger is hovered", () => {
    setup();
    expect(card()).toBeNull();
  });

  it("opens after a delay on hover", async () => {
    setup({ openDelay: 500 });
    fireEvent.pointerEnter(trigger());
    await wait(400);
    expect(card()).toBeNull();
    await wait(150);
    expect(card()).toBeVisible();
  });

  it("opens after the delay on keyboard focus", async () => {
    setup({ openDelay: 500 });
    act(() => trigger().focus());
    expect(card()).toBeNull();
    await wait(550);
    expect(card()).toBeVisible();
  });

  it("does not open when the pointer leaves before the delay", async () => {
    setup({ openDelay: 500 });
    fireEvent.pointerEnter(trigger());
    await wait(200);
    fireEvent.pointerLeave(trigger());
    await wait(600);
    expect(card()).toBeNull();
  });

  it("closes when the pointer leaves, after a short delay", async () => {
    setup({ openDelay: 100, closeDelay: 200 });
    fireEvent.pointerEnter(trigger());
    await wait(150);
    expect(card()).toBeVisible();
    fireEvent.pointerLeave(trigger());
    await wait(100);
    expect(card()).toBeVisible();
    await wait(150);
    expect(card()).toBeNull();
  });

  it("stays open while the pointer moves onto the card", async () => {
    setup({ openDelay: 100, closeDelay: 200 });
    fireEvent.pointerEnter(trigger());
    await wait(150);
    fireEvent.pointerLeave(trigger());
    fireEvent.pointerEnter(screen.getByText("Ada Lovelace"));
    await wait(500);
    expect(card()).toBeVisible();
    fireEvent.pointerLeave(screen.getByText("Ada Lovelace"));
    await wait(300);
    expect(card()).toBeNull();
  });

  it("closes on Escape", async () => {
    setup({ openDelay: 100 });
    act(() => trigger().focus());
    await wait(150);
    expect(card()).toBeVisible();
    fireEvent.keyDown(trigger(), { key: "Escape" });
    expect(card()).toBeNull();
  });

  it("closes when focus leaves the trigger and the card", async () => {
    setup({ openDelay: 100, closeDelay: 100 });
    act(() => trigger().focus());
    await wait(150);
    expect(card()).toBeVisible();
    act(() => screen.getByRole("button", { name: "after" }).focus());
    await wait(200);
    expect(card()).toBeNull();
  });

  it("is reachable by keyboard, in the page order, and is not a dialog", async () => {
    vi.useRealTimers();
    setup({ openDelay: 0 });
    await userEvent.tab(); // before
    await userEvent.tab(); // trigger
    expect(trigger()).toHaveFocus();
    const link = await screen.findByRole("link", { name: "Open profile" });
    await userEvent.tab();
    expect(link).toHaveFocus();
    expect(screen.queryByRole("dialog")).toBeNull();
    // Focus stays in the card without closing it.
    expect(screen.getByText("Ada Lovelace")).toBeVisible();
  });

  it("placement is passed to the popover", async () => {
    setup({ openDelay: 0, placement: "top" });
    fireEvent.pointerEnter(trigger());
    await wait(10);
    const popover = document.querySelector(".c__hover-card");
    expect(popover).not.toBeNull();
  });

  it("takes elevation and radius from tokens, with no literal", () => {
    for (const token of ["box-shadow", "border-radius"]) {
      expect(scss).toContain(`--c--components--hover-card--${token}`);
    }
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
