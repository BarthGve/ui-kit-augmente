import { readFileSync } from "fs";
import { resolve } from "path";
import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { MessageScroller, MessageScrollerHandle } from "./MessageScroller";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

// The behaviour that needs layout (following, anchoring) is covered in a real
// browser by e2e/message-scroller; here are the roles, states and the button.
const setup = (
  props: Partial<React.ComponentProps<typeof MessageScroller>> = {},
) => {
  const ref = createRef<MessageScrollerHandle>();
  render(
    <CunninghamProvider currentLocale="en-US">
      <MessageScroller aria-label="Conversation" ref={ref} {...props}>
        <p data-message-id="a">First</p>
        <p data-message-id="b">Second</p>
      </MessageScroller>
    </CunninghamProvider>,
  );
  const viewport = screen.getByRole("region", { name: "Conversation" });
  return { ref, viewport };
};

const scrollTo = (viewport: HTMLElement, top: number) => {
  Object.defineProperty(viewport, "scrollHeight", {
    configurable: true,
    value: 1000,
  });
  Object.defineProperty(viewport, "clientHeight", {
    configurable: true,
    value: 200,
  });
  Object.defineProperty(viewport, "scrollTop", {
    configurable: true,
    writable: true,
    value: top,
  });
  fireEvent.scroll(viewport);
};

describe("MessageScroller", () => {
  it("is a labelled, focusable region around a log", () => {
    const { viewport } = setup();
    expect(viewport).toHaveAttribute("tabindex", "0");
    const log = screen.getByRole("log");
    expect(viewport).toContainElement(log);
    expect(log).toHaveTextContent("First");
    expect(log).toHaveAttribute("aria-busy", "false");
  });

  it("marks the log busy while streaming", () => {
    setup({ streaming: true });
    expect(screen.getByRole("log")).toHaveAttribute("aria-busy", "true");
  });

  it("has no jump button at the end of the conversation", () => {
    setup();
    expect(screen.queryByRole("button", { name: "Jump to latest" })).toBeNull();
  });

  it("offers a jump-to-latest button once the reader scrolls up, and scrolls back on click", async () => {
    const { viewport } = setup();
    scrollTo(viewport, 100);
    const jump = await screen.findByRole("button", { name: "Jump to latest" });
    await userEvent.click(jump);
    expect(viewport.scrollTop).toBe(1000);
    expect(screen.queryByRole("button", { name: "Jump to latest" })).toBeNull();
  });

  it("hides the button again when the reader scrolls back to the end", async () => {
    const { viewport } = setup();
    scrollTo(viewport, 100);
    await screen.findByRole("button", { name: "Jump to latest" });
    scrollTo(viewport, 790);
    expect(screen.queryByRole("button", { name: "Jump to latest" })).toBeNull();
  });

  it("jumps to a given message", () => {
    const { ref } = setup();
    const target = document.querySelector(
      '[data-message-id="b"]',
    ) as HTMLElement;
    target.scrollIntoView = vi.fn();
    expect(ref.current?.scrollToMessage("b")).toBe(true);
    expect(target.scrollIntoView).toHaveBeenCalledWith({ block: "center" });
    expect(ref.current?.scrollToMessage("zzz")).toBe(false);
  });

  it("takes its gap and padding from tokens, with no literal", () => {
    expect(scss).toContain("--c--components--message-scroller--gap");
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
