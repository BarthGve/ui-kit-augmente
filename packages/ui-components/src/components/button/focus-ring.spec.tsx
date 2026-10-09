// Explicit `.ts`: the alias alone resolves to the tracked `cunningham-tokens.js`,
// which is stale (two themes only).
import { tokens } from ":/cunningham-tokens.ts";
import { readFileSync } from "fs";
import { resolve } from "path";

// Vitest stubs stylesheets (even `?raw`), so the source is read from disk.
const baseScss = readFileSync(resolve(__dirname, "_base.scss"), "utf8");

const THEMES = [
  "default",
  "dark",
  "dsfr-light",
  "dsfr-dark",
  "anct-light",
  "anct-dark",
] as const;
const COLORS = [
  "brand",
  "neutral",
  "warning",
  "error",
  "success",
  "info",
] as const;

// WCAG 2.x relative luminance of an opaque "#RRGGBB" colour. A token that is
// not 6-digit hex (missing, or carrying alpha) is rejected rather than guessed.
const luminance = (hex: string) => {
  expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Bodies of every block whose selector contains `:focus-visible`.
const focusVisibleBlocks = (scss: string) => {
  const blocks: string[] = [];
  const re = /:focus-visible[^{;]*\{/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(scss))) {
    const start = match.index + match[0].length;
    let depth = 1;
    let end = start;
    while (depth > 0 && end < scss.length) {
      if (scss[end] === "{") depth++;
      if (scss[end] === "}") depth--;
      end++;
    }
    blocks.push(scss.slice(start, end - 1));
  }
  return blocks;
};

describe("Button focus ring", () => {
  describe.each(THEMES)("theme %s", (theme) => {
    const { contextuals } = tokens.themes[theme];

    it.each(COLORS)(
      "%s ring contrasts at least 3:1 with the surface",
      (color) => {
        const ring = contextuals.border.semantic[color].primary;
        const surface = contextuals.background.surface.primary;
        expect(contrast(ring, surface)).toBeGreaterThanOrEqual(3);
      },
    );
  });

  it("paints the inner gap with the surface token, never a literal colour", () => {
    const blocks = focusVisibleBlocks(baseScss);
    for (const block of blocks) {
      expect(block).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    }

    const shadows = blocks.filter((block) => block.includes("box-shadow"));
    // One focus ring per variant: primary, secondary, tertiary, bordered.
    expect(shadows).toHaveLength(4);
    for (const block of shadows) {
      expect(block).toMatch(
        /box-shadow:\s*0 0 0 1px var\(--c--contextuals--background--surface--primary\),/,
      );
    }
  });
});
