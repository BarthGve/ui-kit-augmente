import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

// Helpers copied from `users/menu/UserMenu.spec.tsx` (known duplication).
// Vitest stubs stylesheets, so the sources are read from disk. The shipped
// `cunningham-tokens.css` resolves each theme against its own globals (the
// generated TS does not), as in `button/focus-ring.spec.tsx`.
const tokensCss = readFileSync(
  resolve(__dirname, "../../cunningham-tokens.css"),
  "utf8",
);

const THEMES = [
  "default",
  "dark",
  "dsfr-light",
  "dsfr-dark",
  "anct-light",
  "anct-dark",
] as const;

const declarations = (theme: (typeof THEMES)[number]) => {
  const selector =
    theme === "default" ? ":root " : `.cunningham-theme--${theme}`;
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
const rootVars = declarations("default");

// The theme's own value first, `:root` otherwise, following `var()` chains.
const resolveVar = (theme: Record<string, string>, name: string): string => {
  const value = theme[name] ?? rootVars[name];
  if (value === undefined) throw new Error(`Undefined ${name}`);
  const ref = value.match(/^var\((--[\w-]+)\)$/);
  return ref ? resolveVar(theme, ref[1]) : value;
};

// sRGB channels in [0, 1] plus alpha, from "#RRGGBB" or "#RRGGBBAA".
const channels = (hex: string) => {
  expect(hex).toMatch(/^#([0-9a-f]{6}|[0-9a-f]{8})$/i);
  return [1, 3, 5, 7].map(
    (i) => parseInt(hex.slice(i, i + 2) || "ff", 16) / 255,
  );
};
// A translucent colour is composited on the surface beneath it.
const over = (top: string, bottom: number[]) => {
  const [r, g, b, a] = channels(top);
  return [r, g, b].map((c, i) => c * a + bottom[i] * (1 - a));
};
const luminance = (rgb: number[]) => {
  const [r, g, b] = rgb.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const content = (name: string) =>
  `--c--contextuals--content--semantic--${name}`;
const background = (name: string) =>
  `--c--contextuals--background--semantic--${name}`;
const SURFACE = "--c--contextuals--background--surface--primary";

const filter = (name: string) => `--c--components--filter--${name}`;

// Text/background pairs as used by `filter/index.scss` (trigger, shared by
// SearchFilter) and `search-filter/index.scss` (loading and empty rows, on
// the popover's surface). 14px regular text: 4.5:1. The hover/focus label is
// read through its component token (s07 t04), so a token change is red here.
const PAIRS = [
  [
    "trigger at rest",
    content("neutral--tertiary"),
    background("neutral--tertiary"),
  ],
  [
    "trigger hovered or focused",
    filter("button-color--hover"),
    background("neutral--tertiary-hover"),
  ],
  ["active trigger", content("brand--primary"), background("brand--secondary")],
  [
    "active trigger hovered or focused",
    content("brand--primary"),
    background("brand--secondary-hover"),
  ],
  ["loading and empty rows", content("neutral--tertiary"), SURFACE],
] as const;

describe("Filter and SearchFilter text contrast", () => {
  describe.each(THEMES)("theme %s", (theme) => {
    const vars = declarations(theme);
    const surface = over(resolveVar(vars, SURFACE), [1, 1, 1]);

    it.each(PAIRS)("%s reaches 4.5:1", (_, text, bg) => {
      const back = over(resolveVar(vars, bg), surface);
      const fore = over(resolveVar(vars, text), back);
      expect(contrast(fore, back)).toBeGreaterThanOrEqual(4.5);
    });
  });
});

// The trigger's focus ring (s07 t04) is a non-text indicator: 3:1 against
// every background the trigger can show and against the page surface it is
// offset onto.
const RING_BACKGROUNDS = [
  ["page surface", SURFACE],
  ["trigger at rest", background("neutral--tertiary")],
  ["trigger hovered", background("neutral--tertiary-hover")],
  ["active trigger", background("brand--secondary")],
  ["active trigger hovered", background("brand--secondary-hover")],
] as const;

describe("Filter and SearchFilter focus ring contrast", () => {
  describe.each(THEMES)("theme %s", (theme) => {
    const vars = declarations(theme);
    const surface = over(resolveVar(vars, SURFACE), [1, 1, 1]);

    it.each(RING_BACKGROUNDS)("against the %s reaches 3:1", (_, bg) => {
      const back = over(resolveVar(vars, bg), surface);
      const ring = over(resolveVar(vars, filter("focus-ring-color")), back);
      expect(contrast(ring, back)).toBeGreaterThanOrEqual(3);
    });
  });
});
