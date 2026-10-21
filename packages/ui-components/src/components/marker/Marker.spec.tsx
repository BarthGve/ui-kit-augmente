import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Marker } from "./Marker";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

describe("Marker", () => {
  it("renders the default variant with its content, presentational", () => {
    const { container } = render(<Marker>Today</Marker>);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveClass("c__marker", "c__marker--default");
    expect(el).toHaveTextContent("Today");
    expect(el).not.toHaveAttribute("role");
  });

  it.each(["default", "border", "separator"] as const)(
    "renders the %s variant",
    (variant) => {
      const { container } = render(<Marker variant={variant}>Note</Marker>);
      expect(container.firstElementChild).toHaveClass(`c__marker--${variant}`);
    },
  );

  it("draws the rules of a separator on both sides of the label", () => {
    const { container } = render(
      <Marker variant="separator">Yesterday</Marker>,
    );
    const rules = container.querySelectorAll(".c__marker__rule");
    expect(rules).toHaveLength(2);
    rules.forEach((r) => expect(r).toHaveAttribute("aria-hidden", "true"));
    expect(container.querySelector(".c__marker__label")).toHaveTextContent(
      "Yesterday",
    );
  });

  it("shows an icon, hidden from assistive technology when the content names it", () => {
    const { container } = render(<Marker icon={<span>i</span>}>Joined</Marker>);
    expect(container.querySelector(".c__marker__icon")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("is a status when it reports progress", () => {
    render(<Marker status>Uploading…</Marker>);
    expect(screen.getByRole("status")).toHaveTextContent("Uploading…");
  });

  it("names an icon-only marker with its aria-label", () => {
    render(<Marker icon={<span>★</span>} aria-label="Starred" />);
    const marker = screen.getByLabelText("Starred");
    expect(marker).toHaveAttribute("role", "img");
  });

  it("keeps a custom className", () => {
    const { container } = render(<Marker className="mine">x</Marker>);
    expect(container.firstElementChild).toHaveClass("c__marker", "mine");
  });

  it("takes colours, rules and spacing from tokens, with no literal", () => {
    for (const token of ["color", "rule-color", "border-color"]) {
      expect(scss).toContain(`--c--components--marker--${token}`);
    }
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
