import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { Kbd, KbdGroup, ModKbd, isMacPlatform } from "./Kbd";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const wrap = (ui: React.ReactElement) =>
  render(<CunninghamProvider currentLocale="en-US">{ui}</CunninghamProvider>);

afterEach(() => vi.restoreAllMocks());

describe("Kbd", () => {
  it("renders a kbd element with key styling", () => {
    const { container } = wrap(<Kbd>K</Kbd>);
    const key = container.querySelector("kbd");
    expect(key).toHaveTextContent("K");
    expect(key).toHaveClass("c__kbd");
  });

  it("keeps a custom className", () => {
    const { container } = wrap(<Kbd className="mine">K</Kbd>);
    expect(container.querySelector("kbd")).toHaveClass("c__kbd", "mine");
  });
});

describe("KbdGroup", () => {
  it("joins several keys with a decorative separator", () => {
    const { container } = wrap(
      <KbdGroup>
        <Kbd>Shift</Kbd>
        <Kbd>K</Kbd>
        <Kbd>P</Kbd>
      </KbdGroup>,
    );
    expect(container.querySelectorAll("kbd")).toHaveLength(3);
    const separators = container.querySelectorAll(".c__kbd-group__separator");
    expect(separators).toHaveLength(2);
    separators.forEach((s) => expect(s).toHaveAttribute("aria-hidden", "true"));
  });

  it("takes another separator", () => {
    const { container } = wrap(
      <KbdGroup separator="then">
        <Kbd>G</Kbd>
        <Kbd>H</Kbd>
      </KbdGroup>,
    );
    expect(
      container.querySelector(".c__kbd-group__separator"),
    ).toHaveTextContent("then");
  });

  it("is read as the keys in order", () => {
    const { container } = wrap(
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>,
    );
    const visible = Array.from(container.querySelectorAll("kbd")).map(
      (k) => k.textContent,
    );
    expect(visible).toEqual(["Ctrl", "K"]);
  });
});

describe("ModKbd", () => {
  it("shows ⌘ on macOS, named for screen readers", () => {
    wrap(<ModKbd platform="mac" />);
    const key = screen.getByLabelText("Command");
    expect(key).toHaveTextContent("⌘");
    expect(key.tagName).toBe("KBD");
  });

  it("shows Ctrl elsewhere, readable as is", () => {
    const { container } = wrap(<ModKbd platform="other" />);
    expect(container.querySelector("kbd")).toHaveTextContent("Ctrl");
    expect(container.querySelector("kbd")).not.toHaveAttribute("aria-label");
  });

  it("detects the platform by default and can be overridden", () => {
    vi.spyOn(window.navigator, "platform", "get").mockReturnValue("MacIntel");
    expect(isMacPlatform()).toBe(true);
    const { container, unmount } = wrap(<ModKbd />);
    expect(container.querySelector("kbd")).toHaveTextContent("⌘");
    unmount();
    const forced = wrap(<ModKbd platform="other" />);
    expect(forced.container.querySelector("kbd")).toHaveTextContent("Ctrl");
    vi.spyOn(window.navigator, "platform", "get").mockReturnValue("Win32");
    expect(isMacPlatform()).toBe(false);
  });
});

describe("Kbd styles", () => {
  it("takes font, border and background from tokens, with no literal", () => {
    for (const token of ["font-family", "border-color", "background-color"]) {
      expect(scss).toContain(`--c--components--kbd--${token}`);
    }
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
