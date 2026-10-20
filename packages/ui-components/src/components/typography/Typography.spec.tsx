import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Blockquote,
  Heading,
  InlineCode,
  TypographyList,
  Text,
} from "./Typography";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

describe("Heading", () => {
  it.each([1, 2, 3, 4] as const)(
    "renders an h%s with the matching style by default",
    (level) => {
      render(<Heading variant={`h${level}`}>Title</Heading>);
      const heading = screen.getByRole("heading", { level });
      expect(heading).toHaveClass("c__typography", `c__typography--h${level}`);
    },
  );

  it("defaults to a level 2 heading", () => {
    render(<Heading>Title</Heading>);
    expect(screen.getByRole("heading", { level: 2 })).toHaveClass(
      "c__typography--h2",
    );
  });

  it("chooses the level independently of the visual style", () => {
    render(
      <Heading as="h3" variant="h1">
        Small section, big look
      </Heading>,
    );
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveClass("c__typography--h1");
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("can be a non-heading element when the style alone is wanted", () => {
    const { container } = render(
      <Heading as="div" variant="h4">
        Looks like a title
      </Heading>,
    );
    expect(container.querySelector("div")).toHaveClass("c__typography--h4");
    expect(screen.queryByRole("heading")).toBeNull();
  });
});

describe("Text", () => {
  it.each(["body", "lead", "large", "small", "muted"] as const)(
    "renders the %s style in a paragraph",
    (variant) => {
      const { container } = render(<Text variant={variant}>Hello</Text>);
      const p = container.firstElementChild as HTMLElement;
      expect(p.tagName).toBe("P");
      expect(p).toHaveClass(`c__typography--${variant}`);
    },
  );

  it("defaults to the body style and can take another element", () => {
    const { container } = render(<Text as="span">Inline</Text>);
    expect(container.firstElementChild?.tagName).toBe("SPAN");
    expect(container.firstElementChild).toHaveClass("c__typography--body");
  });
});

describe("Blockquote, InlineCode, TypographyList", () => {
  it("renders a blockquote", () => {
    const { container } = render(<Blockquote>Quote</Blockquote>);
    expect(container.querySelector("blockquote")).toHaveClass(
      "c__typography--blockquote",
    );
  });

  it("renders inline code", () => {
    const { container } = render(<InlineCode>yarn build</InlineCode>);
    expect(container.querySelector("code")).toHaveClass("c__typography--code");
  });

  it("renders unordered and ordered lists", () => {
    const { container, rerender } = render(
      <TypographyList>
        <li>One</li>
      </TypographyList>,
    );
    expect(container.querySelector("ul")).toHaveClass("c__typography--list");
    rerender(
      <TypographyList ordered>
        <li>One</li>
      </TypographyList>,
    );
    expect(container.querySelector("ol")).toHaveClass("c__typography--list");
  });

  it("keeps a custom className", () => {
    const { container } = render(<Text className="mine">x</Text>);
    expect(container.firstElementChild).toHaveClass("c__typography", "mine");
  });
});

describe("Typography styles", () => {
  it("reads sizes and weights from tokens for every style, with no literal", () => {
    for (const style of [
      "h1",
      "h2",
      "h3",
      "h4",
      "lead",
      "large",
      "small",
      "muted",
      "blockquote",
      "code",
      "list",
    ]) {
      expect(scss).toContain(`--c--components--typography--${style}-font-size`);
    }
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
