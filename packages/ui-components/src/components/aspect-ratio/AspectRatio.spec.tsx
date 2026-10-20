import { readFileSync } from "fs";
import { resolve } from "path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AspectRatio } from "./AspectRatio";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const box = (ratio?: number) =>
  render(
    <AspectRatio ratio={ratio}>
      <img src="a.png" alt="" />
    </AspectRatio>,
  ).container.firstElementChild as HTMLElement;

describe("AspectRatio", () => {
  it("renders its child inside a box of the given ratio", () => {
    const el = box(16 / 9);
    expect(el).toHaveClass("c__aspect-ratio");
    expect(el.style.aspectRatio).toBe(String(16 / 9));
    expect(el.querySelector("img")).not.toBeNull();
  });

  it("defaults to a ratio of 1", () => {
    expect(box().style.aspectRatio).toBe("1");
  });

  it.each([0, -2, NaN, Infinity])(
    "falls back to 1 for the invalid ratio %s",
    (ratio) => {
      expect(box(ratio).style.aspectRatio).toBe("1");
    },
  );

  it("adds no role", () => {
    const el = box(2);
    expect(el).not.toHaveAttribute("role");
    expect(el.tagName).toBe("DIV");
  });

  it("makes the child fill the box without distortion", () => {
    expect(scss).toMatch(/width:\s*100%/);
    expect(scss).toMatch(/height:\s*100%/);
    expect(scss).toMatch(/object-fit:\s*cover/);
  });
});
