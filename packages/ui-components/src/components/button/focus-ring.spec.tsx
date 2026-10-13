import { readFileSync } from "fs";
import { resolve } from "path";

// Vitest stubs stylesheets (even `?raw`), so the sources are read from disk.
const baseScss = readFileSync(resolve(__dirname, "_base.scss"), "utf8");
// The shipped stylesheet, not `cunningham-tokens.ts`: the generated TS computes
// every theme's `contextuals` from the default palette, while the CSS resolves
// them against each theme's own globals. (The tracked `cunningham-tokens.js` is
// stale too: two themes only.)
const tokensCss = readFileSync(
  resolve(__dirname, "../../cunningham-tokens.css"),
  "utf8",
);

const declarations = (selector: string) => {
  // Theme blocks hold flat declarations only: the first `}` closes the block.
  const body = tokensCss.split(`${selector}{`)[1]?.split("}")[0];
  if (!body) throw new Error(`No ${selector} block in cunningham-tokens.css`);
  return Object.fromEntries(
    [...body.matchAll(/(--c--[\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [
      k,
      v.trim(),
    ]),
  );
};
const root = declarations(":root ");

// Resolves a custom property as the browser would inside the theme: the
// theme's own value first, `:root` otherwise, following `var()` chains.
const resolveVar = (theme: Record<string, string>, name: string): string => {
  const value = theme[name] ?? root[name];
  if (value === undefined) throw new Error(`Undefined ${name}`);
  const ref = value.match(/^var\((--[\w-]+)\)$/);
  return ref ? resolveVar(theme, ref[1]) : value;
};

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
    const vars =
      theme === "default" ? root : declarations(`.cunningham-theme--${theme}`);
    const surface = resolveVar(
      vars,
      "--c--contextuals--background--surface--primary",
    );

    it.each(COLORS)(
      "%s ring contrasts at least 3:1 with the surface",
      (color) => {
        const ring = resolveVar(
          vars,
          `--c--contextuals--border--semantic--${color}--primary`,
        );
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
