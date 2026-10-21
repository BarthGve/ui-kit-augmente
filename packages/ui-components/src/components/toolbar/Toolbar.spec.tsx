import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from ":/components/button";
import { VerticalSeparator } from ":/components/separator";
import { Toolbar } from "./Toolbar";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const setup = (props = {}) =>
  render(
    <>
      <button>before</button>
      <Toolbar aria-label="Formatting" {...props}>
        <Button color="neutral" variant="tertiary">
          Bold
        </Button>
        <Button color="neutral" variant="tertiary">
          Italic
        </Button>
        <VerticalSeparator withPadding={false} />
        <Button color="neutral" variant="tertiary" disabled>
          Link
        </Button>
        <Button color="neutral" variant="tertiary">
          Quote
        </Button>
      </Toolbar>
      <button>after</button>
    </>,
  );

const button = (name: string) => screen.getByRole("button", { name });

// The single tab stop is react-aria moving focus before the browser handles
// Tab: jsdom cannot follow it, so it is checked in e2e/toolbar.
describe("Toolbar", () => {
  it("exposes the toolbar role with an accessible label", () => {
    setup();
    expect(screen.getByRole("toolbar", { name: "Formatting" })).toBeVisible();
  });

  it("groups its buttons", () => {
    setup();
    const toolbar = screen.getByRole("toolbar");
    expect(toolbar).toContainElement(button("Bold"));
    expect(toolbar).toContainElement(button("Quote"));
    expect(toolbar.querySelector(".c__separator")).not.toBeNull();
  });

  it("moves focus with the left and right arrow keys", async () => {
    setup();
    button("Bold").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(button("Italic")).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    // The disabled button and the separator are skipped.
    expect(button("Quote")).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(button("Italic")).toHaveFocus();
  });

  it("keeps a custom className", () => {
    setup({ className: "mine" });
    expect(screen.getByRole("toolbar")).toHaveClass("c__toolbar", "mine");
  });

  it("wraps controls that do not fit instead of cutting them off", () => {
    expect(scss).toMatch(/flex-wrap:\s*wrap/);
    expect(scss).not.toMatch(/overflow:\s*(hidden|auto|scroll)/);
  });

  it("holds no literal colour or length in its stylesheet", () => {
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
