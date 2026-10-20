import { readFileSync } from "fs";
import { resolve } from "path";
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScrollArea } from "./ScrollArea";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

// jsdom has no layout: give the viewport the box it should measure.
const measure = (size: {
  scrollHeight: number;
  clientHeight: number;
  scrollWidth: number;
  clientWidth: number;
}) => {
  for (const [key, value] of Object.entries(size)) {
    vi.spyOn(
      HTMLElement.prototype,
      key as "scrollHeight",
      "get",
    ).mockReturnValue(value);
  }
};

afterEach(() => vi.restoreAllMocks());

describe("ScrollArea", () => {
  it("wraps its content in a labelled region", () => {
    render(
      <ScrollArea aria-label="Results">
        <p>Inside</p>
      </ScrollArea>,
    );
    const region = screen.getByRole("region", { name: "Results" });
    expect(region).toHaveClass("c__scroll-area");
    expect(region).toHaveTextContent("Inside");
  });

  it("is focusable when its content scrolls", () => {
    measure({
      scrollHeight: 500,
      clientHeight: 100,
      scrollWidth: 100,
      clientWidth: 100,
    });
    render(<ScrollArea aria-label="Results">tall</ScrollArea>);
    expect(screen.getByRole("region", { name: "Results" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });

  it("is not a tab stop when nothing scrolls", () => {
    measure({
      scrollHeight: 100,
      clientHeight: 100,
      scrollWidth: 100,
      clientWidth: 100,
    });
    render(<ScrollArea aria-label="Results">short</ScrollArea>);
    expect(screen.getByRole("region", { name: "Results" })).not.toHaveAttribute(
      "tabindex",
    );
  });

  it("follows its content when it grows", () => {
    measure({
      scrollHeight: 100,
      clientHeight: 100,
      scrollWidth: 100,
      clientWidth: 100,
    });
    const resizes: ResizeObserverCallback[] = [];
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: ResizeObserverCallback) {
          resizes.push(cb);
        }
        observe() {}
        disconnect() {}
      },
    );
    render(<ScrollArea aria-label="Results">content</ScrollArea>);
    const region = screen.getByRole("region", { name: "Results" });
    expect(region).not.toHaveAttribute("tabindex");
    measure({
      scrollHeight: 900,
      clientHeight: 100,
      scrollWidth: 100,
      clientWidth: 100,
    });
    act(() => resizes.forEach((cb) => cb([], {} as ResizeObserver)));
    expect(region).toHaveAttribute("tabindex", "0");
    vi.unstubAllGlobals();
  });

  it.each(["vertical", "horizontal", "both"] as const)(
    "scrolls %s",
    (orientation) => {
      render(
        <ScrollArea aria-label="Results" orientation={orientation}>
          x
        </ScrollArea>,
      );
      expect(screen.getByRole("region")).toHaveClass(
        `c__scroll-area--${orientation}`,
      );
    },
  );

  it("scrolls vertically by default and keeps a custom className", () => {
    render(
      <ScrollArea aria-label="Results" className="mine">
        x
      </ScrollArea>,
    );
    expect(screen.getByRole("region")).toHaveClass(
      "c__scroll-area--vertical",
      "mine",
    );
  });

  it("styles thin scrollbars with CSS only, from tokens, and falls back to native in forced colors", () => {
    expect(scss).toMatch(/scrollbar-width:\s*thin/);
    expect(scss).toMatch(/::-webkit-scrollbar/);
    expect(scss).toMatch(
      /@media \(forced-colors: active\)[\s\S]*?scrollbar-color:\s*auto/,
    );
    for (const token of ["thumb-color", "track-color", "size"]) {
      expect(scss).toContain(`--c--components--scroll-area--${token}`);
    }
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
