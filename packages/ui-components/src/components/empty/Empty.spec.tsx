import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultTokenRefs } from "@gouvfr-lasuite/ui-tokens";
import { describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { Button } from ":/components/button";
import { Empty, EmptyProps } from "./index";
import { tokens } from "./tokens";

// Vitest stubs stylesheets, so the sources are read from disk.
const read = (path: string) => readFileSync(resolve(__dirname, path), "utf8");

const renderEmpty = (props: Partial<EmptyProps> = {}) =>
  render(
    <CunninghamProvider>
      <Empty title="No projects" {...props} />
    </CunninghamProvider>,
  );

const root = () => screen.getByRole("heading").parentElement!;

describe("Empty slots (AC1)", () => {
  it("renders media, title, description and actions in that order", () => {
    renderEmpty({
      media: "M",
      description: "Create one to start.",
      actions: "A",
    });
    expect(screen.getByRole("heading", { name: "No projects" })).toBeVisible();
    expect([...root().children].map((child) => child.textContent)).toEqual([
      "M",
      "No projects",
      "Create one to start.",
      "A",
    ]);
  });

  it("renders no wrapper for an absent media, description or actions", () => {
    renderEmpty();
    expect(root().children).toHaveLength(1);
    expect(root().firstElementChild).toBe(screen.getByRole("heading"));
  });
});

describe("Empty semantics (AC2)", () => {
  it.each([1, 2, 3, 4, 5, 6] as const)(
    "renders the title as h%i for headingLevel %i",
    (level) => {
      renderEmpty({ headingLevel: level });
      expect(screen.getByRole("heading", { level })).toHaveTextContent(
        "No projects",
      );
      expect(screen.getByRole("heading").tagName).toBe(`H${level}`);
    },
  );

  it("defaults to h3", () => {
    renderEmpty();
    expect(screen.getByRole("heading").tagName).toBe("H3");
  });

  it("has no role without a name", () => {
    renderEmpty();
    expect(root()).not.toHaveAttribute("role");
    expect(screen.queryByRole("group")).toBeNull();
  });

  it("is a group named by aria-label", () => {
    renderEmpty({ "aria-label": "Projects" });
    expect(screen.getByRole("group", { name: "Projects" })).toBe(root());
  });

  it("is a group named by aria-labelledby", () => {
    render(
      <CunninghamProvider>
        <span id="label">Search results</span>
        <Empty title="No results" aria-labelledby="label" />
      </CunninghamProvider>,
    );
    expect(
      screen.getByRole("group", { name: "Search results" }),
    ).toContainElement(screen.getByRole("heading", { name: "No results" }));
  });
});

describe("Empty forwarding", () => {
  it("forwards className and other attributes to the root", () => {
    renderEmpty({ className: "custom", id: "empty" });
    expect(root()).toHaveClass("custom");
    expect(root()).toHaveAttribute("id", "empty");
  });

  it("keeps a Button in the actions slot operable by keyboard", async () => {
    const onClick = vi.fn();
    renderEmpty({ actions: <Button onClick={onClick}>Create project</Button> });
    await userEvent.tab();
    expect(
      screen.getByRole("button", { name: "Create project" }),
    ).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

// Theme blocks hold flat declarations only: the first `}` closes the block.
const tokensCss = read("../../cunningham-tokens.css");
const THEMES = [
  "default",
  "dark",
  "dsfr-light",
  "dsfr-dark",
  "anct-light",
  "anct-dark",
] as const;
type Theme = (typeof THEMES)[number];
const declarations = (theme: Theme) => {
  const selector =
    theme === "default" ? ":root " : `.cunningham-theme--${theme}`;
  const body = tokensCss.split(`${selector}{`)[1]?.split("}")[0];
  if (!body) throw new Error(`No ${selector} block in cunningham-tokens.css`);
  return Object.fromEntries(
    [...body.matchAll(/(--c--[\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [
      k,
      v.trim(),
    ]),
  );
};

describe("Empty tokens", () => {
  it.each(THEMES)("emits every token of tokens.ts in theme %s", (theme) => {
    const vars = declarations(theme);
    for (const key of Object.keys(tokens(defaultTokenRefs))) {
      expect(vars).toHaveProperty(`--c--components--empty--${key}`);
    }
  });
});

describe("Empty stylesheet", () => {
  const scss = () =>
    read("index.scss")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");

  it("holds no literal colour, spacing or size", () => {
    // Every `var(--name)` reference blanked out, so names cannot match.
    const values = scss().replace(/var\(--[\w-]+\)/g, "var()");
    expect(values).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(values).not.toMatch(/rgba?\(|hsla?\(/);
    expect(values).not.toMatch(/\d(px|rem|em)\b/);
  });

  it("reads every token of tokens.ts, so none is dead", () => {
    // Prettier may break `var(` across lines.
    const used = scss().replace(/var\(\s*(--[\w-]+)\s*\)/g, "var($1)");
    for (const key of Object.keys(tokens(defaultTokenRefs))) {
      expect(used).toContain(`var(--c--components--empty--${key})`);
    }
  });

  it("gives no var() a literal fallback", () => {
    expect(scss()).not.toMatch(/var\(--[\w-]+\s*,/);
  });

  it("uses logical properties only", () => {
    expect(scss()).not.toMatch(
      /(^|[\s;{-])(left|right|top|bottom|width|height)\s*:/m,
    );
    expect(scss()).not.toMatch(
      /(margin|padding|border)-(left|right|top|bottom)\b/,
    );
  });
});

// The theme's own value first, `:root` otherwise, following `var()` chains.
const rootVars = declarations("default");
const resolveVar = (theme: Record<string, string>, name: string): string => {
  const value = theme[name] ?? rootVars[name];
  if (value === undefined) throw new Error(`Undefined ${name}`);
  const ref = value.match(/^var\((--[\w-]+)\)$/);
  return ref ? resolveVar(theme, ref[1]) : value;
};
// Helpers copied from `timeline/Timeline.spec.tsx` (known duplication).
const channels = (hex: string) => {
  expect(hex).toMatch(/^#([0-9a-f]{6}|[0-9a-f]{8})$/i);
  return [1, 3, 5, 7].map(
    (i) => parseInt(hex.slice(i, i + 2) || "ff", 16) / 255,
  );
};
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

// Read from tokens.ts, so a changed reference is measured without a rebuild:
// `ref(a.b.c)` is the variable `--c--a--b--c`.
const emptyTokens: Record<string, string | number> = tokens(defaultTokenRefs);
const tokenVar = (key: string) => {
  const ref = String(emptyTokens[key]).match(/^ref\(([\w.-]+)\)$/);
  if (!ref) throw new Error(`${key} is not a token reference`);
  return `--c--${ref[1].replace(/\./g, "--")}`;
};
const SURFACE = "--c--contextuals--background--surface--primary";

// Text needs 4.5:1, decorative media 3:1, all on `surface.primary`.
const PAIRS = [
  ["title", "title-color", 4.5],
  ["description", "description-color", 4.5],
  ["media", "media-color", 3],
] as const;

describe("Empty contrast", () => {
  describe.each(THEMES)("theme %s", (theme) => {
    const vars = declarations(theme);
    const surface = over(resolveVar(vars, SURFACE), [1, 1, 1]);

    it.each(PAIRS)("%s reaches the minimum ratio", (_, key, minimum) => {
      const fore = over(resolveVar(vars, tokenVar(key)), surface);
      expect(contrast(fore, surface)).toBeGreaterThanOrEqual(minimum);
    });
  });
});
