import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen } from "@testing-library/react";
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
    const panel = document.getElementById(
      alpha.getAttribute("aria-controls")!,
    );
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
