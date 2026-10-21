import { readFileSync } from "fs";
import { resolve } from "path";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Collapsible, CollapsibleProps } from "./Collapsible";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const setup = (props: Partial<CollapsibleProps> = {}) =>
  render(
    <>
      <button>before</button>
      <Collapsible trigger="Details" {...props}>
        <a href="#x">Inside link</a>
      </Collapsible>
      <button>after</button>
    </>,
  );
const trigger = () => screen.getByRole("button", { name: "Details" });

describe("Collapsible", () => {
  it("has a trigger that exposes aria-expanded and aria-controls", () => {
    setup();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveAttribute("aria-controls");
    const id = trigger().getAttribute("aria-controls")!;
    expect(document.getElementById(id)).toHaveClass("c__collapsible__panel");
  });

  it("toggles with click, Enter and Space", async () => {
    setup();
    await userEvent.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Inside link" })).toBeVisible();
    trigger().focus();
    await userEvent.keyboard("{Enter}");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    await userEvent.keyboard(" ");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });

  it("hides the collapsed content from assistive technology and the tab order", async () => {
    setup();
    expect(screen.queryByRole("link", { name: "Inside link" })).toBeNull();
    screen.getByRole("button", { name: "before" }).focus();
    await userEvent.tab();
    expect(trigger()).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
  });

  it("starts open with defaultOpen", () => {
    setup({ defaultOpen: true });
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Inside link" })).toBeVisible();
  });

  it("reports changes with onOpenChange", async () => {
    const onOpenChange = vi.fn();
    setup({ onOpenChange });
    await userEvent.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await userEvent.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("is controlled by open", async () => {
    const Controlled = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Collapsible trigger="Details" open={open} onOpenChange={setOpen}>
            Body
          </Collapsible>
          <output>{String(open)}</output>
        </>
      );
    };
    render(<Controlled />);
    await userEvent.click(trigger());
    expect(screen.getByRole("status")).toHaveTextContent("true");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });

  it("ignores a change the parent refuses", async () => {
    setup({ open: false, onOpenChange: () => {} });
    await userEvent.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("cannot be toggled when disabled", async () => {
    setup({ disabled: true });
    expect(trigger()).toBeDisabled();
    await userEvent.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("removes the height transition under reduced motion, and has no literal", () => {
    expect(scss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?transition:\s*none/,
    );
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
