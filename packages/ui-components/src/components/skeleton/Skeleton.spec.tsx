import { readFileSync } from "fs";
import { resolve } from "path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./Skeleton";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const skeleton = (props = {}) =>
  render(<Skeleton {...props} />).container.firstElementChild as HTMLElement;

describe("Skeleton", () => {
  it("renders a line by default", () => {
    expect(skeleton()).toHaveClass("c__skeleton", "c__skeleton--line");
  });

  it.each(["line", "block", "circle"] as const)(
    "supports the %s shape",
    (shape) => {
      expect(skeleton({ shape })).toHaveClass(`c__skeleton--${shape}`);
    },
  );

  it("applies a width and a height, a number meaning pixels", () => {
    const el = skeleton({ width: 120, height: "2rem" });
    expect(el.style.width).toBe("120px");
    expect(el.style.height).toBe("2rem");
  });

  it("leaves the size to the stylesheet when none is given", () => {
    const el = skeleton();
    expect(el.style.width).toBe("");
    expect(el.style.height).toBe("");
  });

  it("makes a circle square when only one side is given", () => {
    const el = skeleton({ shape: "circle", width: 40 });
    expect(el.style.width).toBe("40px");
    expect(el.style.height).toBe("40px");
  });

  it("is hidden from assistive technology and not focusable", () => {
    const el = skeleton();
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).not.toHaveAttribute("tabindex");
  });

  it("keeps a custom className", () => {
    expect(skeleton({ className: "mine" })).toHaveClass("c__skeleton", "mine");
  });

  it("stops animating when the user prefers reduced motion", () => {
    expect(scss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*{[^}]*animation:\s*none/,
    );
  });

  it("holds no literal colour or length", () => {
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
