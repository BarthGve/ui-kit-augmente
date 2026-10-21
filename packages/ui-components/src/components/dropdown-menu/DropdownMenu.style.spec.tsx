import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import { tokens } from "../../cunningham-tokens";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("dropdown menu focus indicator", () => {
  // The focused row is drawn with a ring in the brand border colour.
  it.each(Object.keys(tokens.themes))(
    "has at least 3:1 against the menu surfaces in %s",
    (name) => {
      const { contextuals } = tokens.themes[name as keyof typeof tokens.themes];
      const ring = contextuals.border.semantic.brand.primary;
      for (const surface of [
        contextuals.background.surface.primary,
        contextuals.background.surface.secondary,
      ]) {
        expect(contrast(ring, surface)).toBeGreaterThanOrEqual(3);
      }
    },
  );

  it("draws the ring on focused rows and keyboard-focused reset rows", () => {
    expect(scss).toMatch(
      /&\[data-focused\][\s\S]*?box-shadow:\s*inset 0 0 0 [^;]*--c--contextuals--border--semantic--brand--primary/,
    );
    expect(scss).toMatch(
      /&:focus-visible[\s\S]*?box-shadow:\s*inset 0 0 0 [^;]*--c--contextuals--border--semantic--brand--primary/,
    );
  });
});

describe("dropdown menu long labels", () => {
  it("caps the default menu at 300px and lets labels wrap", () => {
    expect(scss).toMatch(/max-width:\s*min\(300px,/);
    expect(scss).toMatch(
      /&__label\s*{[^}]*min-width:\s*0;[^}]*overflow-wrap:\s*anywhere/,
    );
  });

  it("truncates the label of the tiny variant with an ellipsis", () => {
    expect(scss).toMatch(
      /\.c__dropdown-menu--tiny[\s\S]*?&__label[\s\S]*?text-overflow:\s*ellipsis/,
    );
  });
});
