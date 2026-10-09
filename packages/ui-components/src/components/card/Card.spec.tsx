import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen } from "@testing-library/react";
import { defaultTokenRefs } from "@gouvfr-lasuite/ui-tokens";
import { describe, expect, it } from "vitest";
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
