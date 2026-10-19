import { readFileSync } from "fs";
import { resolve } from "path";
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { Sheet, SheetProps } from "./Sheet";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const setup = (props: Partial<SheetProps> = {}) => {
  const onClose = vi.fn();
  render(
    <CunninghamProvider currentLocale="en-US">
      <Sheet
        isOpen
        onClose={onClose}
        title="Details"
        footer={<button>Save</button>}
        {...props}
      >
        <button>First field</button>
        <p>Body text</p>
      </Sheet>
    </CunninghamProvider>,
  );
  return { onClose };
};

describe("Sheet", () => {
  it("is a modal dialog named by its title, with a backdrop", async () => {
    setup();
    const dialog = await screen.findByRole("dialog", { name: "Details" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.querySelector(".c__modal__backdrop")).not.toBeNull();
  });

  it.each(["left", "right", "top", "bottom"] as const)(
    "opens from the %s",
    async (side) => {
      setup({ side });
      expect(await screen.findByRole("dialog")).toHaveClass(
        `c__sheet--${side}`,
      );
    },
  );

  it("opens from the right by default", async () => {
    setup();
    expect(await screen.findByRole("dialog")).toHaveClass("c__sheet--right");
  });

  it("renders header, body and footer slots", async () => {
    setup();
    const dialog = await screen.findByRole("dialog");
    expect(dialog.querySelector(".c__sheet__header")).toHaveTextContent(
      "Details",
    );
    expect(dialog.querySelector(".c__sheet__body")).toHaveTextContent(
      "Body text",
    );
    expect(
      within(
        dialog.querySelector(".c__sheet__footer") as HTMLElement,
      ).getByRole("button", { name: "Save" }),
    ).toBeVisible();
  });

  it("omits the footer when none is given", async () => {
    setup({ footer: undefined });
    const dialog = await screen.findByRole("dialog");
    expect(dialog.querySelector(".c__sheet__footer")).toBeNull();
  });

  it("moves focus in and traps it", async () => {
    setup();
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    for (let i = 0; i < 6; i++) {
      await userEvent.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
    for (let i = 0; i < 6; i++) {
      await userEvent.tab({ shift: true });
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("returns focus to the opener on close", async () => {
    const Page = () => {
      const [open, setOpen] = useState(false);
      return (
        <CunninghamProvider currentLocale="en-US">
          <button onClick={() => setOpen(true)}>Open</button>
          <Sheet isOpen={open} onClose={() => setOpen(false)} title="Details">
            <p>Body</p>
          </Sheet>
        </CunninghamProvider>
      );
    };
    render(<Page />);
    const opener = screen.getByRole("button", { name: "Open" });
    await userEvent.click(opener);
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(opener).toHaveFocus();
  });

  it("calls onClose on Escape and with the close button", async () => {
    const { onClose } = setup();
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("closes on an outside click, unless disabled", async () => {
    const first = setup();
    await screen.findByRole("dialog");
    await userEvent.click(
      document.querySelector(".c__modal__backdrop") as HTMLElement,
    );
    expect(first.onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open on an outside click when closeOnClickOutside is false", async () => {
    const { onClose } = setup({ closeOnClickOutside: false });
    await screen.findByRole("dialog");
    await userEvent.click(
      document.querySelector(".c__modal__backdrop") as HTMLElement,
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders nothing when closed", () => {
    setup({ isOpen: false });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("Sheet styles", () => {
  it("scrolls the body while header and footer stay in view", () => {
    expect(scss).toMatch(/&__body\s*{[^}]*overflow:\s*auto/);
  });

  it("removes the slide animation under reduced motion", () => {
    expect(scss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation:\s*none/,
    );
  });

  it("takes width, padding and elevation from tokens, with no literal", () => {
    for (const token of ["width", "padding", "box-shadow"]) {
      expect(scss).toContain(`--c--components--sheet--${token}`);
    }
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
