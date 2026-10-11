import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tabs, TabsProps } from "./Tabs";

// Vitest stubs stylesheets, so the sources are read from disk.
const read = (path: string) => readFileSync(resolve(__dirname, path), "utf8");

const TABS = [
  { id: "a", label: "Alpha", content: "A content" },
  { id: "b", label: "Bravo", content: "B content" },
  { id: "c", label: "Charlie", content: "C content" },
];

const renderTabs = (props: Partial<TabsProps> = {}) =>
  render(<Tabs aria-label="Project" tabs={TABS} {...props} />);

const tab = (name: string) => screen.getByRole("tab", { name });

// React Aria generates ids (`react-aria-«r1»`); they are normalised so the
// markup is stable whatever the render order. Its empty collection
// `<template>` carries nothing of the component.
// The exact markup is compared to a literal string rather than with
// `toMatchInlineSnapshot`: the shared setup's `@testing-library/jest-dom/vitest`
// loads a second copy of vitest, which leaves inline snapshots without state.
const markup = (container: HTMLElement) =>
  container.innerHTML
    .replace("<template></template>", "")
    .replace(/react-aria-«r\w+»/g, "ID")
    .replace(/></g, ">\n<");

describe("Tabs variants (AC1)", () => {
  it("renders the default (Classic) variant", () => {
    const { container } = renderTabs({ variant: "default" });
    expect(markup(container))
      .toBe(`<div class="c__tabs c__tabs--default" data-rac="" data-orientation="horizontal">
<div class="c__tabs__list" data-rac="" data-collection="ID" id="ID" aria-label="Project" role="tablist" aria-orientation="horizontal" data-orientation="horizontal">
<div class="c__tabs__tab" data-rac="" tabindex="0" data-collection="ID" data-key="a" data-react-aria-pressable="true" id="ID-tab-a" aria-selected="true" role="tab" aria-controls="ID-tabpanel-a" data-selected="true">
<span class="c__tabs__label">Alpha</span>
</div>
<div class="c__tabs__tab" data-rac="" tabindex="-1" data-collection="ID" data-key="b" data-react-aria-pressable="true" id="ID-tab-b" aria-selected="false" role="tab">
<span class="c__tabs__label">Bravo</span>
</div>
<div class="c__tabs__tab" data-rac="" tabindex="-1" data-collection="ID" data-key="c" data-react-aria-pressable="true" id="ID-tab-c" aria-selected="false" role="tab">
<span class="c__tabs__label">Charlie</span>
</div>
</div>
<div id="ID-tabpanel-a" aria-labelledby="ID-tab-a" tabindex="0" role="tabpanel" class="c__tabs__panel" data-rac="">A content</div>
</div>`);
  });

  it("renders the line variant", () => {
    const { container } = renderTabs({ variant: "line" });
    expect(markup(container))
      .toBe(`<div class="c__tabs c__tabs--line" data-rac="" data-orientation="horizontal">
<div class="c__tabs__list" data-rac="" data-collection="ID" id="ID" aria-label="Project" role="tablist" aria-orientation="horizontal" data-orientation="horizontal">
<div class="c__tabs__tab" data-rac="" tabindex="0" data-collection="ID" data-key="a" data-react-aria-pressable="true" id="ID-tab-a" aria-selected="true" role="tab" aria-controls="ID-tabpanel-a" data-selected="true">
<span class="c__tabs__label">Alpha</span>
<div aria-hidden="true" class="c__tabs__indicator" data-rac="">
</div>
</div>
<div class="c__tabs__tab" data-rac="" tabindex="-1" data-collection="ID" data-key="b" data-react-aria-pressable="true" id="ID-tab-b" aria-selected="false" role="tab">
<span class="c__tabs__label">Bravo</span>
</div>
<div class="c__tabs__tab" data-rac="" tabindex="-1" data-collection="ID" data-key="c" data-react-aria-pressable="true" id="ID-tab-c" aria-selected="false" role="tab">
<span class="c__tabs__label">Charlie</span>
</div>
</div>
<div id="ID-tabpanel-a" aria-labelledby="ID-tab-a" tabindex="0" role="tabpanel" class="c__tabs__panel" data-rac="">A content</div>
</div>`);
  });

  it.each(["default", "line"] as const)(
    "%s: labelled tablist, one selected tab, one panel",
    (variant) => {
      renderTabs({ variant });
      expect(screen.getByRole("tablist", { name: "Project" })).toBeVisible();
      expect(tab("Alpha")).toHaveAttribute("aria-selected", "true");
      expect(tab("Bravo")).toHaveAttribute("aria-selected", "false");
      expect(tab("Charlie")).toHaveAttribute("aria-selected", "false");
      expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
      expect(screen.getByRole("tabpanel", { name: "Alpha" })).toHaveTextContent(
        "A content",
      );
    },
  );

  it("draws one indicator for line only, inside the selected tab", async () => {
    const user = userEvent.setup();
    const { container, unmount } = renderTabs({ variant: "default" });
    expect(container.querySelectorAll(".c__tabs__indicator")).toHaveLength(0);
    unmount();

    renderTabs({ variant: "line" });
    const indicators = () => document.querySelectorAll(".c__tabs__indicator");
    expect(indicators()).toHaveLength(1);
    expect(tab("Alpha")).toContainElement(indicators()[0] as HTMLElement);
    await user.click(tab("Bravo"));
    expect(indicators()).toHaveLength(1);
    expect(tab("Bravo")).toContainElement(indicators()[0] as HTMLElement);
  });

  it("defaults to the default variant", () => {
    const implicit = markup(renderTabs().container);
    const explicit = markup(renderTabs({ variant: "default" }).container);
    expect(implicit).toBe(explicit);
  });

  it("marks the full-width layout", () => {
    const { rerender } = renderTabs();
    const root = () => screen.getByRole("tablist").parentElement;
    expect(root()).not.toHaveClass("c__tabs--full-width");
    rerender(<Tabs aria-label="Project" tabs={TABS} fullWidth />);
    expect(root()).toHaveClass("c__tabs", "c__tabs--full-width");
  });
});

// Whitespace and comments are normalised so declarations compare exactly.
const scss = read("index.scss")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "")
  .replace(/\s+/g, " ")
  .replace(/\(\s+/g, "(")
  .replace(/\s+\)/g, ")");

// Body of the first block opened by exactly `header {` (not a longer selector
// ending with it), nested blocks included.
const body = (source: string, header: string) => {
  const escaped = header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(?:^|[{};] )${escaped} \\{ `).exec(source);
  if (!match) throw new Error(`No block "${header}"`);
  const start = match.index + match[0].length;
  let depth = 1;
  let end = start;
  while (depth > 0 && end < source.length) {
    if (source[end] === "{") depth++;
    if (source[end] === "}") depth--;
    end++;
  }
  return source.slice(start, end - 1).trim();
};

describe("Tabs stylesheet (AC1)", () => {
  const tabBlock = body(scss, "&__tab");
  const forced = body(scss, "@media (forced-colors: active)");

  it("default: neutral text, overlay background on hover and selection", () => {
    expect(tabBlock).toContain(
      "color: var(--c--contextuals--content--semantic--neutral--tertiary);",
    );
    expect(body(tabBlock, "&[data-hovered], &[data-selected]")).toBe(
      "background-color: var(--c--contextuals--background--semantic--overlay--primary);",
    );
    expect(body(tabBlock, "&[data-selected]")).toBe(
      "color: var(--c--contextuals--content--semantic--neutral--primary);",
    );
  });

  it("line: no background, neutral text, its own padding and radius", () => {
    expect(body(scss, "&--line &__tab")).toBe(
      "padding-block: var(--c--globals--spacings--xxs); " +
        "border-radius: var(--c--globals--spacings--xs); " +
        "&[data-hovered], &[data-selected] { " +
        "background-color: transparent; " +
        "color: var(--c--contextuals--content--semantic--neutral--primary); }",
    );
  });

  it("line: a 1.5px current-colour indicator that stops moving with reduced motion", () => {
    const indicator = body(scss, "&__indicator");
    expect(indicator).toContain("height: 1.5px;");
    expect(indicator).toContain("background-color: currentColor;");
    expect(body(indicator, "@media (prefers-reduced-motion: reduce)")).toBe(
      "transition: none;",
    );
  });

  it("draws the focus ring, and Highlight / GrayText in forced colours", () => {
    const ring = "&__tab[data-focus-visible], &__panel[data-focus-visible]";
    expect(body(scss, ring)).toBe(
      "outline: 2px solid var(--c--contextuals--content--semantic--brand--primary); outline-offset: 2px;",
    );
    expect(body(forced, "&__tab[data-selected]")).toBe(
      "outline: 1px solid Highlight; outline-offset: -1px;",
    );
    expect(body(forced, "&__tab[data-disabled]")).toBe("color: GrayText;");
    expect(body(forced, ring)).toBe(
      "outline: 2px solid Highlight; outline-offset: 2px;",
    );
  });

  it("uses no literal colour", () => {
    expect(scss).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(scss).not.toMatch(/rgba?\(/);
  });
});

describe.each(["default", "line"] as const)(
  "Tabs keyboard (%s, AC2)",
  (variant) => {
    it.each([undefined, "automatic"] as const)(
      "activation %s: arrows, Home and End move focus and select, wrapping",
      async (keyboardActivation) => {
        const user = userEvent.setup();
        const onSelectionChange = vi.fn();
        renderTabs({ variant, keyboardActivation, onSelectionChange });
        // React Aria reports the initial selection on mount; only key presses
        // are counted here.
        onSelectionChange.mockClear();
        tab("Alpha").focus();
        const step = async (key: string, name: string, id: string) => {
          await user.keyboard(key);
          expect(tab(name)).toHaveFocus();
          expect(tab(name)).toHaveAttribute("aria-selected", "true");
          expect(screen.getByRole("tabpanel")).toHaveTextContent(
            `${id.toUpperCase()} content`,
          );
          expect(onSelectionChange).toHaveBeenLastCalledWith(id);
        };
        await step("{ArrowRight}", "Bravo", "b");
        await step("{ArrowLeft}", "Alpha", "a");
        await step("{ArrowLeft}", "Charlie", "c");
        await step("{ArrowRight}", "Alpha", "a");
        await step("{End}", "Charlie", "c");
        await step("{Home}", "Alpha", "a");
        expect(onSelectionChange).toHaveBeenCalledTimes(6);
      },
    );

    it("skips a disabled tab and never selects it", async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      render(
        <Tabs
          aria-label="Project"
          variant={variant}
          tabs={TABS.map((t) => ({ ...t, isDisabled: t.id === "b" }))}
          onSelectionChange={onSelectionChange}
        />,
      );
      tab("Alpha").focus();
      await user.keyboard("{ArrowRight}");
      expect(tab("Charlie")).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(tab("Alpha")).toHaveFocus();
      await user.click(tab("Bravo"));
      expect(tab("Bravo")).toHaveAttribute("aria-selected", "false");
      expect(onSelectionChange).not.toHaveBeenCalledWith("b");
    });

    it.each([
      ["Enter", "{Enter}"],
      ["Space", " "],
    ])("manual: arrows only move focus, %s selects once", async (_, key) => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      renderTabs({ variant, keyboardActivation: "manual", onSelectionChange });
      onSelectionChange.mockClear();
      tab("Alpha").focus();
      await user.keyboard("{ArrowRight}");
      expect(tab("Bravo")).toHaveFocus();
      expect(tab("Bravo")).toHaveAttribute("aria-selected", "false");
      expect(tab("Alpha")).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tabpanel")).toHaveTextContent("A content");
      expect(onSelectionChange).not.toHaveBeenCalled();
      await user.keyboard(key);
      expect(tab("Bravo")).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tabpanel")).toHaveTextContent("B content");
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).toHaveBeenCalledWith("b");
    });
  },
);

// Contrast, technique of `button/focus-ring.spec.tsx` (helpers copied: known
// duplication, kept local to each spec). Token names are read from
// `index.scss`, so swapping a token in the stylesheet is checked here too.
// Disabled text (`content.disabled.primary`) is exempt: WCAG 1.4.3 does not
// apply to inactive controls.
describe("Tabs contrast", () => {
  const css = read("../../cunningham-tokens.css");
  // Theme blocks hold flat declarations only: the first `}` closes the block.
  const declarations = (selector: string) => {
    const block = css.split(`${selector}{`)[1]?.split("}")[0];
    if (!block)
      throw new Error(`No ${selector} block in cunningham-tokens.css`);
    return Object.fromEntries(
      [...block.matchAll(/(--c--[\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [
        k,
        v.trim(),
      ]),
    );
  };
  const root = declarations(":root ");
  const resolveVar = (theme: Record<string, string>, name: string): string => {
    const value = theme[name] ?? root[name];
    if (value === undefined) throw new Error(`Undefined ${name}`);
    const ref = value.match(/^var\((--[\w-]+)\)$/);
    return ref ? resolveVar(theme, ref[1]) : value;
  };
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
  // A "#RRGGBBAA" colour painted over an opaque "#RRGGBB" one, in sRGB.
  const over = (top: string, bottom: string) => {
    if (top.length === 7) return top;
    const alpha = parseInt(top.slice(7, 9), 16) / 255;
    return `#${[1, 3, 5]
      .map((i) => {
        const value =
          alpha * parseInt(top.slice(i, i + 2), 16) +
          (1 - alpha) * parseInt(bottom.slice(i, i + 2), 16);
        return Math.round(value).toString(16).padStart(2, "0");
      })
      .join("")}`;
  };

  const tokens = (source: string, pattern: RegExp) => {
    const found = [...source.matchAll(pattern)].map(([, name]) => name);
    expect(found.length).toBeGreaterThan(0);
    return found;
  };
  const color = /(?<![\w-])color: var\((--[\w-]+)\)/g;
  const tabBlock = body(scss, "&__tab");
  const restText = tokens(tabBlock, color)[0];
  const selectedText = tokens(body(tabBlock, "&[data-selected]"), color);
  // The line indicator is `currentColor`: the line text colour.
  const lineText = tokens(body(scss, "&--line &__tab"), color);
  const overlay = tokens(
    body(tabBlock, "&[data-hovered], &[data-selected]"),
    /background-color: var\((--[\w-]+)\)/g,
  )[0];
  const ring = tokens(
    body(scss, "&__tab[data-focus-visible], &__panel[data-focus-visible]"),
    /outline: 2px solid var\((--[\w-]+)\)/g,
  );

  it.each([
    "default",
    "dark",
    "dsfr-light",
    "dsfr-dark",
    "anct-light",
    "anct-dark",
  ])(
    "%s: text >= 4.5:1, indicator and ring >= 3:1, on surface and overlay",
    (theme) => {
      const vars =
        theme === "default"
          ? root
          : declarations(`.cunningham-theme--${theme}`);
      const value = (name: string) => resolveVar(vars, name);
      const surface = value("--c--contextuals--background--surface--primary");
      const hovered = over(value(overlay), surface);
      for (const background of [surface, hovered]) {
        for (const text of [restText, ...selectedText]) {
          expect(contrast(value(text), background)).toBeGreaterThanOrEqual(4.5);
        }
        for (const outline of ring) {
          expect(contrast(value(outline), background)).toBeGreaterThanOrEqual(
            3,
          );
        }
      }
      // Line tabs have no background: text and indicator sit on the surface.
      for (const text of lineText) {
        expect(contrast(value(text), surface)).toBeGreaterThanOrEqual(4.5);
      }
    },
  );
});
