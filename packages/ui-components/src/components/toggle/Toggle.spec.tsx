import { readFileSync } from "fs";
import { resolve } from "path";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toggle, ToggleProps } from "./Toggle";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const setup = (props: Partial<ToggleProps> = {}) =>
  render(<Toggle {...props}>Bold</Toggle>);
const toggle = () => screen.getByRole("button", { name: "Bold" });

describe("Toggle", () => {
  it("is a button with aria-pressed, off by default", () => {
    setup();
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
  });

  it("switches on click, Enter and Space", async () => {
    const onChange = vi.fn();
    setup({ onChange });
    await userEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-pressed", "true");
    expect(onChange).toHaveBeenLastCalledWith(true);
    toggle().focus();
    await userEvent.keyboard("{Enter}");
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
    await userEvent.keyboard(" ");
    expect(toggle()).toHaveAttribute("aria-pressed", "true");
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it("starts pressed with defaultPressed", () => {
    setup({ defaultPressed: true });
    expect(toggle()).toHaveAttribute("aria-pressed", "true");
  });

  it("is controlled by pressed", async () => {
    const Controlled = () => {
      const [pressed, setPressed] = useState(false);
      return (
        <>
          <Toggle pressed={pressed} onChange={setPressed}>
            Bold
          </Toggle>
          <output>{String(pressed)}</output>
        </>
      );
    };
    render(<Controlled />);
    await userEvent.click(toggle());
    expect(screen.getByRole("status")).toHaveTextContent("true");
    expect(toggle()).toHaveAttribute("aria-pressed", "true");
  });

  it("stays as the parent says when it ignores the change", async () => {
    setup({ pressed: false, onChange: () => {} });
    await userEvent.click(toggle());
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
  });

  it("supports the default and outlined variants and the button sizes", () => {
    const { rerender } = setup();
    expect(toggle()).toHaveClass("c__toggle--default", "c__toggle--medium");
    rerender(
      <Toggle variant="outlined" size="small">
        Bold
      </Toggle>,
    );
    expect(toggle()).toHaveClass("c__toggle--outlined", "c__toggle--small");
    rerender(<Toggle size="nano">Bold</Toggle>);
    expect(toggle()).toHaveClass("c__toggle--nano");
  });

  it("cannot be switched when disabled", async () => {
    const onChange = vi.fn();
    setup({ disabled: true, onChange });
    expect(toggle()).toBeDisabled();
    await userEvent.click(toggle());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("can be an icon-only toggle named by aria-label", () => {
    render(<Toggle icon={<span>★</span>} aria-label="Favourite" />);
    expect(screen.getByRole("button", { name: "Favourite" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("shows the pressed state without colour alone, in the stylesheet", () => {
    // A shape or weight change on top of the colour.
    expect(scss).toMatch(
      /\[aria-pressed="true"\][\s\S]*?(box-shadow|font-weight)/,
    );
  });

  it("takes focus ring and colours from tokens, with no literal", () => {
    for (const token of [
      "pressed-background-color",
      "focus-ring-color",
      "border-color",
    ]) {
      expect(scss).toContain(`--c--components--toggle--${token}`);
    }
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
