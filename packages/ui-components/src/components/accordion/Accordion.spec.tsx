import { readFileSync } from "fs";
import { resolve } from "path";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultTokenRefs } from "@gouvfr-lasuite/ui-tokens";
import { describe, expect, it, vi } from "vitest";
import { Accordion, AccordionItem, AccordionProps } from "./index";
import { tokens } from "./tokens";

// Vitest stubs stylesheets, so the sources are read from disk.
const read = (path: string) => readFileSync(resolve(__dirname, path), "utf8");

const Items = (props: Omit<AccordionProps, "children">) => (
  <Accordion {...props}>
    <AccordionItem id="a" title="Alpha">
      <button>Inside A</button>
    </AccordionItem>
    <AccordionItem id="b" title="Bravo">
      <button>Inside B</button>
    </AccordionItem>
  </Accordion>
);

const trigger = (name: string) => screen.getByRole("button", { name });

describe("Accordion structure (AC3)", () => {
  it("puts each trigger in a heading and links it to its panel", () => {
    render(
      <Accordion>
        <AccordionItem id="a" title="Alpha">
          A content
        </AccordionItem>
        <AccordionItem id="b" title="Bravo" headingLevel={2}>
          B content
        </AccordionItem>
      </Accordion>,
    );
    const alpha = trigger("Alpha");
    expect(screen.getByRole("heading", { level: 3 })).toContainElement(alpha);
    expect(screen.getByRole("heading", { level: 2 })).toContainElement(
      trigger("Bravo"),
    );
    expect(alpha).toHaveAttribute("aria-expanded", "false");
    const panel = document.getElementById(alpha.getAttribute("aria-controls")!);
    expect(panel).toHaveTextContent("A content");
    expect(panel).toHaveAttribute("aria-labelledby", alpha.id);
  });
});

describe("Accordion toggling (AC1)", () => {
  it("toggles on click", async () => {
    const user = userEvent.setup();
    render(<Items />);
    await user.click(trigger("Alpha"));
    expect(trigger("Alpha")).toHaveAttribute("aria-expanded", "true");
    await user.click(trigger("Alpha"));
    expect(trigger("Alpha")).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles on Enter", async () => {
    const user = userEvent.setup();
    render(<Items />);
    trigger("Alpha").focus();
    await user.keyboard("{Enter}");
    expect(trigger("Alpha")).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Enter}");
    expect(trigger("Alpha")).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles on Space", async () => {
    const user = userEvent.setup();
    render(<Items />);
    trigger("Alpha").focus();
    await user.keyboard(" ");
    expect(trigger("Alpha")).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(trigger("Alpha")).toHaveAttribute("aria-expanded", "false");
  });

  it("hides a collapsed panel from AT and Tab, and exposes it once expanded", async () => {
    const user = userEvent.setup();
    render(<Items />);
    const alpha = trigger("Alpha");
    const panel = document.getElementById(alpha.getAttribute("aria-controls")!);
    expect(panel).toHaveAttribute("hidden");
    expect(panel).toHaveAttribute("aria-hidden", "true");
    alpha.focus();
    await user.tab();
    expect(trigger("Bravo")).toHaveFocus();

    await user.click(alpha);
    expect(panel).not.toHaveAttribute("hidden");
    expect(panel).not.toHaveAttribute("aria-hidden", "true");
    await user.tab();
    expect(screen.getByRole("button", { name: "Inside A" })).toHaveFocus();
  });
});

describe("Accordion open modes (AC2)", () => {
  it("keeps a single panel open by default", async () => {
    const user = userEvent.setup();
    render(<Items />);
    await user.click(trigger("Alpha"));
    await user.click(trigger("Bravo"));
    expect(trigger("Alpha")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Bravo")).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps several panels open with allowsMultipleExpanded", async () => {
    const user = userEvent.setup();
    render(<Items allowsMultipleExpanded />);
    await user.click(trigger("Alpha"));
    await user.click(trigger("Bravo"));
    expect(trigger("Alpha")).toHaveAttribute("aria-expanded", "true");
    expect(trigger("Bravo")).toHaveAttribute("aria-expanded", "true");
  });
});

describe("Accordion state ownership (AC4)", () => {
  it("uncontrolled: starts from defaultExpandedKeys and reports changes", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <Items defaultExpandedKeys={["b"]} onExpandedChange={onExpandedChange} />,
    );
    expect(trigger("Bravo")).toHaveAttribute("aria-expanded", "true");
    await user.click(trigger("Alpha"));
    expect(trigger("Alpha")).toHaveAttribute("aria-expanded", "true");
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set(["a"]));
  });

  it("controlled: follows expandedKeys only, and reports the requested keys", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <Items expandedKeys={["a"]} onExpandedChange={onExpandedChange} />,
    );
    await user.click(trigger("Bravo"));
    expect(onExpandedChange).toHaveBeenLastCalledWith(new Set(["b"]));
    expect(trigger("Alpha")).toHaveAttribute("aria-expanded", "true");
    expect(trigger("Bravo")).toHaveAttribute("aria-expanded", "false");

    rerender(
      <Items expandedKeys={["b"]} onExpandedChange={onExpandedChange} />,
    );
    expect(trigger("Alpha")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Bravo")).toHaveAttribute("aria-expanded", "true");
  });
});

describe("Accordion disabled", () => {
  it("disables one item: its trigger is disabled and ignores clicks", async () => {
    const user = userEvent.setup();
    render(
      <Accordion>
        <AccordionItem id="a" title="Alpha" isDisabled>
          A
        </AccordionItem>
        <AccordionItem id="b" title="Bravo">
          B
        </AccordionItem>
      </Accordion>,
    );
    expect(trigger("Alpha")).toBeDisabled();
    expect(trigger("Bravo")).toBeEnabled();
    await user.click(trigger("Alpha"));
    expect(trigger("Alpha")).toHaveAttribute("aria-expanded", "false");
  });

  it("disables every item from the group", async () => {
    const user = userEvent.setup();
    render(<Items isDisabled />);
    expect(trigger("Alpha")).toBeDisabled();
    expect(trigger("Bravo")).toBeDisabled();
    await user.click(trigger("Bravo"));
    expect(trigger("Bravo")).toHaveAttribute("aria-expanded", "false");
  });
});

describe("Accordion root", () => {
  it("is a div forwarding className, id and data attributes", () => {
    const { container } = render(
      <Items className="custom" id="faq" data-testid="accordion" />,
    );
    const root = screen.getByTestId("accordion");
    expect(root).toBe(container.firstElementChild);
    expect(root.tagName).toBe("DIV");
    expect(root).toHaveClass("c__accordion", "custom");
    expect(root).toHaveAttribute("id", "faq");
  });
});

describe("Accordion tokens", () => {
  it("emits every token of tokens.ts in the generated :root block", () => {
    const css = read("../../cunningham-tokens.css");
    // `:root` holds flat declarations only: the first `}` closes the block.
    const root = css.split(":root {")[1]?.split("}")[0] ?? "";
    for (const key of Object.keys(tokens(defaultTokenRefs))) {
      expect(root).toContain(`--c--components--accordion--${key}:`);
    }
  });
});

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

describe("Accordion stylesheet", () => {
  const scss = () =>
    read("index.scss")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");

  it("reads colours, padding and borders from tokens, never literals", () => {
    const source = scss();
    for (const property of ["color", "padding", "border-bottom"]) {
      expect(source).toMatch(
        new RegExp(`${property}:\\s*var\\(--c--components--accordion--`),
      );
    }
    expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(source).not.toMatch(/rgba?\(/);
    expect(source).not.toMatch(/\d(px|rem)\b/);
  });

  it("draws the ring from tokens, with forced-colors and reduced-motion rules", () => {
    const source = scss();
    expect(blocks(source, /:focus-visible/)).toMatch(
      /outline:\s*var\(--c--components--accordion--focus-ring-width\)\s+solid\s+var\(--c--components--accordion--focus-ring-color\);[\s\S]*outline-offset:\s*var\(--c--components--accordion--focus-ring-offset\);/,
    );
    expect(blocks(source, /@media \(forced-colors: active\)/)).toMatch(
      /outline-color:\s*Highlight;/,
    );
    expect(blocks(source, /@media \(prefers-reduced-motion: reduce\)/)).toMatch(
      /transition:\s*none;/,
    );
  });
});

describe("Accordion arrow keys (AC3)", () => {
  const Three = ({ disabled }: { disabled?: string }) => (
    <Accordion>
      {["Alpha", "Bravo", "Charlie", "Delta"].map((name) => (
        <AccordionItem
          key={name}
          id={name}
          title={name}
          isDisabled={name === disabled}
        >
          <input aria-label={`${name} field`} />
          <textarea aria-label={`${name} notes`} />
        </AccordionItem>
      ))}
    </Accordion>
  );

  it("moves focus to the next and previous trigger", async () => {
    const user = userEvent.setup();
    render(<Three />);
    trigger("Alpha").focus();
    await user.keyboard("{ArrowDown}");
    expect(trigger("Bravo")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(trigger("Alpha")).toHaveFocus();
    // Handled arrows are cancelled, so the page does not scroll.
    expect(fireEvent.keyDown(trigger("Alpha"), { key: "ArrowDown" })).toBe(
      false,
    );
  });

  it("wraps from the last trigger to the first and back", async () => {
    const user = userEvent.setup();
    render(<Three />);
    trigger("Delta").focus();
    await user.keyboard("{ArrowDown}");
    expect(trigger("Alpha")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(trigger("Delta")).toHaveFocus();
  });

  it("jumps to the first and last enabled trigger with Home and End", async () => {
    const user = userEvent.setup();
    render(
      <Accordion>
        <AccordionItem id="a" title="Alpha" isDisabled>
          A
        </AccordionItem>
        <AccordionItem id="b" title="Bravo">
          B
        </AccordionItem>
        <AccordionItem id="c" title="Charlie">
          C
        </AccordionItem>
        <AccordionItem id="d" title="Delta" isDisabled>
          D
        </AccordionItem>
      </Accordion>,
    );
    trigger("Bravo").focus();
    await user.keyboard("{End}");
    expect(trigger("Charlie")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(trigger("Bravo")).toHaveFocus();
  });

  it("skips a disabled trigger in both directions", async () => {
    const user = userEvent.setup();
    render(<Three disabled="Bravo" />);
    trigger("Alpha").focus();
    await user.keyboard("{ArrowDown}");
    expect(trigger("Charlie")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(trigger("Alpha")).toHaveFocus();
  });

  it("leaves arrow keys alone in an input or a textarea of an open panel", async () => {
    const user = userEvent.setup();
    render(<Three />);
    await user.click(trigger("Bravo"));
    for (const field of [
      screen.getByRole("textbox", { name: "Bravo field" }),
      screen.getByRole("textbox", { name: "Bravo notes" }),
    ]) {
      field.focus();
      for (const key of ["ArrowDown", "ArrowUp", "Home", "End"]) {
        // fireEvent returns false when a handler called preventDefault.
        expect(fireEvent.keyDown(field, { key })).toBe(true);
        expect(field).toHaveFocus();
      }
    }
  });

  it("never crosses into an outer accordion from a nested one", async () => {
    const user = userEvent.setup();
    render(
      <Accordion defaultExpandedKeys={["outer-b"]}>
        <AccordionItem id="outer-a" title="Outer A">
          A
        </AccordionItem>
        <AccordionItem id="outer-b" title="Outer B">
          <Accordion>
            <AccordionItem id="inner-a" title="Inner A">
              IA
            </AccordionItem>
            <AccordionItem id="inner-b" title="Inner B">
              IB
            </AccordionItem>
          </Accordion>
        </AccordionItem>
        <AccordionItem id="outer-c" title="Outer C">
          C
        </AccordionItem>
      </Accordion>,
    );
    trigger("Inner B").focus();
    await user.keyboard("{ArrowDown}");
    expect(trigger("Inner A")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(trigger("Inner B")).toHaveFocus();
    await user.keyboard("{End}");
    expect(trigger("Inner B")).toHaveFocus();

    trigger("Outer B").focus();
    await user.keyboard("{ArrowDown}");
    expect(trigger("Outer C")).toHaveFocus();
  });

  it("moves focus without toggling, then Enter toggles the focused trigger once", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(<Items onExpandedChange={onExpandedChange} />);
    trigger("Alpha").focus();
    await user.keyboard("{ArrowDown}");
    expect(trigger("Alpha")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Bravo")).toHaveAttribute("aria-expanded", "false");
    expect(onExpandedChange).not.toHaveBeenCalled();
    await user.keyboard("{Enter}");
    expect(trigger("Bravo")).toHaveAttribute("aria-expanded", "true");
    expect(trigger("Alpha")).toHaveAttribute("aria-expanded", "false");
    expect(onExpandedChange).toHaveBeenCalledTimes(1);
  });
});

// Focus ring contrast, technique of `button/focus-ring.spec.tsx` (helpers
// copied: known duplication, kept local to each spec).
describe("Accordion focus ring contrast", () => {
  const css = read("../../cunningham-tokens.css");
  // Theme blocks hold flat declarations only: the first `}` closes the block.
  const declarations = (selector: string) => {
    const body = css.split(`${selector}{`)[1]?.split("}")[0];
    if (!body) throw new Error(`No ${selector} block in cunningham-tokens.css`);
    return Object.fromEntries(
      [...body.matchAll(/(--c--[\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [
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

  it.each([
    "default",
    "dark",
    "dsfr-light",
    "dsfr-dark",
    "anct-light",
    "anct-dark",
  ])("%s: ring >= 3:1 on the surface and on the hover background", (theme) => {
    const vars =
      theme === "default" ? root : declarations(`.cunningham-theme--${theme}`);
    const ring = resolveVar(
      vars,
      "--c--components--accordion--focus-ring-color",
    );
    for (const background of [
      "--c--contextuals--background--surface--secondary",
      "--c--contextuals--background--semantic--neutral--tertiary",
    ]) {
      expect(
        contrast(ring, resolveVar(vars, background)),
      ).toBeGreaterThanOrEqual(3);
    }
  });
});
