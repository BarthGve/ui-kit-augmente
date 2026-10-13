import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultTokenRefs } from "@gouvfr-lasuite/ui-tokens";
import { describe, expect, it, vi } from "vitest";
import { Card } from "./index";
import { tokens } from "./tokens";

// Vitest stubs stylesheets, so the sources are read from disk.
const read = (path: string) => readFileSync(resolve(__dirname, path), "utf8");

describe("Card slots", () => {
  it("renders header, body and footer in that order", () => {
    const { container } = render(
      <Card header="Head" footer="Foot">
        Body
      </Card>,
    );
    const root = container.firstElementChild!;
    expect(
      [...root.children].map((section) => [
        section.className,
        section.textContent,
      ]),
    ).toEqual([
      ["c__card__header", "Head"],
      ["c__card__body", "Body"],
      ["c__card__footer", "Foot"],
    ]);
  });

  it("renders no header or footer wrapper when they are omitted", () => {
    const { container } = render(<Card>Body</Card>);
    const root = container.firstElementChild!;
    expect(root.querySelector(".c__card__header")).toBeNull();
    expect(root.querySelector(".c__card__footer")).toBeNull();
    expect(root.children).toHaveLength(1);
  });

  it("is a plain div without role that forwards className and attributes", () => {
    const { container } = render(
      <Card
        className="custom"
        id="card-1"
        data-testid="card"
        aria-label="Summary"
      >
        Body
      </Card>,
    );
    const root = screen.getByTestId("card");
    expect(root).toBe(container.firstElementChild);
    expect(root.tagName).toBe("DIV");
    expect(root).not.toHaveAttribute("role");
    expect(root).toHaveClass("c__card", "custom");
    expect(root).toHaveAttribute("id", "card-1");
    expect(root).toHaveAttribute("aria-label", "Summary");
  });
});

describe("Card tokens (AC3)", () => {
  it("emits every token of tokens.ts in the generated :root block", () => {
    const css = read("../../cunningham-tokens.css");
    // `:root` holds flat declarations only: the first `}` closes the block.
    const root = css.split(":root {")[1]?.split("}")[0] ?? "";
    for (const key of Object.keys(tokens(defaultTokenRefs))) {
      expect(root).toContain(`--c--components--card--${key}:`);
    }
  });

  it("reads padding, radius and elevation from tokens, never literals", () => {
    const scss = read("index.scss")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    for (const property of ["padding", "border-radius", "box-shadow"]) {
      expect(scss).toMatch(
        new RegExp(`${property}:\\s*var\\(--c--components--card--`),
      );
    }
    expect(scss).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(scss).not.toMatch(/rgba?\(/);
    expect(scss).not.toMatch(/\d(px|rem)\b/);
  });
});

describe("Card interactive (AC2)", () => {
  it("with href is a link named by its content that Enter follows", async () => {
    const user = userEvent.setup();
    render(
      <Card href="#card-target" header="Report">
        Open the yearly report
      </Card>,
    );
    const link = screen.getByRole("link", {
      name: "Report Open the yearly report",
    });
    expect(link).toHaveAttribute("href", "#card-target");
    await user.tab();
    expect(link).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(window.location.hash).toBe("#card-target");
    window.location.hash = "";
  });

  it("with onPress is a focusable button pressed once per click, Enter and Space", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<Card onPress={onPress}>Open project</Card>);
    const button = screen.getByRole("button", { name: "Open project" });
    expect(button).toHaveAttribute("tabindex", "0");

    await user.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    await user.tab({ shift: true });
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onPress).toHaveBeenCalledTimes(2);
    await user.keyboard(" ");
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it("without href or onPress is skipped by Tab", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Card>Body</Card>
        <button>After</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it("rejects href and onPress together (checked by tsc in yarn build)", () => {
    // Never called: the directives fail `tsc` if the union accepts both.
    const typeChecks = () => [
      // @ts-expect-error -- href and onPress are mutually exclusive
      <Card href="#a" onPress={() => {}}>
        Body
      </Card>,
    ];
    expect(typeChecks).toBeTypeOf("function");
  });
});

// Theme blocks hold flat declarations only: the first `}` closes the block.
const tokensCss = read("../../cunningham-tokens.css");
const declarations = (selector: string) => {
  const body = tokensCss.split(`${selector}{`)[1]?.split("}")[0];
  if (!body) throw new Error(`No ${selector} block in cunningham-tokens.css`);
  return Object.fromEntries(
    [...body.matchAll(/(--c--[\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [
      k,
      v.trim(),
    ]),
  );
};
const rootVars = declarations(":root ");
// As the browser does inside a theme: its own value first, `:root` otherwise.
const resolveVar = (theme: Record<string, string>, name: string): string => {
  const value = theme[name] ?? rootVars[name];
  if (value === undefined) throw new Error(`Undefined ${name}`);
  const ref = value.match(/^var\((--[\w-]+)\)$/);
  return ref ? resolveVar(theme, ref[1]) : value;
};
// WCAG 2.x relative luminance of an opaque "#RRGGBB" colour.
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

// Bodies (nested blocks included) of every block whose header matches.
const blocks = (scss: string, header: RegExp) => {
  const found: string[] = [];
  const re = new RegExp(`${header.source}[^{;]*\\{`, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(scss))) {
    let depth = 1;
    let end = match.index + match[0].length;
    const start = end;
    while (depth > 0 && end < scss.length) {
      if (scss[end] === "{") depth++;
      if (scss[end] === "}") depth--;
      end++;
    }
    found.push(scss.slice(start, end - 1));
  }
  return found.join("\n");
};

describe("Card focus ring (AC2)", () => {
  it.each([
    "default",
    "dark",
    "dsfr-light",
    "dsfr-dark",
    "anct-light",
    "anct-dark",
  ])("contrasts at least 3:1 with the page surface in theme %s", (theme) => {
    const vars =
      theme === "default"
        ? rootVars
        : declarations(`.cunningham-theme--${theme}`);
    const ring = resolveVar(vars, "--c--components--card--focus-ring-color");
    const surface = resolveVar(
      vars,
      "--c--contextuals--background--surface--primary",
    );
    expect(contrast(ring, surface)).toBeGreaterThanOrEqual(3);
  });

  it("draws the ring, hover, forced-colors and reduced-motion rules from tokens", () => {
    const scss = read("index.scss").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(blocks(scss, /:focus-visible/)).toMatch(
      /outline:\s*var\(--c--components--card--focus-ring-width\)\s+solid\s+var\(--c--components--card--focus-ring-color\);[\s\S]*outline-offset:\s*var\(--c--components--card--focus-ring-offset\);/,
    );
    expect(blocks(scss, /@media \(forced-colors: active\)/)).toMatch(
      /outline-color:\s*Highlight;/,
    );
    expect(blocks(scss, /:hover/)).toMatch(
      /background-color:\s*var\(--c--components--card--background-color--hover\);/,
    );
    expect(blocks(scss, /@media \(prefers-reduced-motion: reduce\)/)).toMatch(
      /transition:\s*none;/,
    );
  });
});
