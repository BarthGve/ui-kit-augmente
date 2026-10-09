import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { DropdownMenu } from "./DropdownMenu";
import { DropdownMenuItem } from "./types";

const setup = ({
  shouldCloseOnInteractOutside,
}: {
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
} = {}) => {
  const onOpenChange = vi.fn();
  const onSelectValue = vi.fn();
  const callbacks = {
    plain: vi.fn(),
    keepOpen: vi.fn(),
    disabled: vi.fn(),
    hidden: vi.fn(),
    child: vi.fn(),
  };
  const options: DropdownMenuItem[] = [
    { label: "Rename", callback: callbacks.plain },
    { label: "Pinned", isChecked: true },
    { label: "Editor", value: "editor" },
    { label: "Reader", value: "reader" },
    { label: "Share", subText: "Anyone with the link" },
    { label: "Stay open", keepOpen: true, callback: callbacks.keepOpen },
    { type: "separator" },
    { label: "Locked", isDisabled: true, callback: callbacks.disabled },
    { label: "Ghost", isHidden: true, callback: callbacks.hidden },
    {
      label: "More",
      children: [{ label: "Archive", callback: callbacks.child }],
    },
  ];

  // The caller owns `isOpen` and its trigger toggles it, as every consumer does.
  const Harness = () => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <CunninghamProvider>
        <button type="button">Before</button>
        <DropdownMenu
          options={options}
          isOpen={isOpen}
          selectedValues={["editor"]}
          shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
          onSelectValue={onSelectValue}
          onOpenChange={(open) => {
            onOpenChange(open);
            setIsOpen(open);
          }}
        >
          <button type="button" onClick={() => setIsOpen(!isOpen)}>
            Actions
          </button>
        </DropdownMenu>
        <button type="button">After</button>
      </CunninghamProvider>
    );
  };

  render(<Harness />);
  return { onOpenChange, onSelectValue, callbacks };
};

// Any menu item role: t03 may turn selectable items into
// menuitemradio / menuitemcheckbox.
const item = (label: string) =>
  Array.from(document.querySelectorAll<HTMLElement>('[role^="menuitem"]')).find(
    (el) => el.textContent?.startsWith(label),
  )!;

describe("<DropdownMenu/>", () => {
  describe("callbacks (must not change)", () => {
    it("passes the option value to onSelectValue and closes", async () => {
      const { onSelectValue, onOpenChange } = setup();
      await userEvent.click(item("Reader"));
      expect(onSelectValue).toHaveBeenCalledWith("reader");
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("calls the option callback and closes", async () => {
      const { callbacks, onOpenChange, onSelectValue } = setup();
      await userEvent.click(item("Rename"));
      expect(callbacks.plain).toHaveBeenCalledTimes(1);
      expect(onSelectValue).not.toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("keeps the menu open for a keepOpen option", async () => {
      const { callbacks, onOpenChange } = setup();
      await userEvent.click(item("Stay open"));
      expect(callbacks.keepOpen).toHaveBeenCalledTimes(1);
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("does not activate a disabled option", async () => {
      const { callbacks, onOpenChange } = setup();
      await userEvent.click(item("Locked"));
      expect(callbacks.disabled).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it("does not render a hidden option", () => {
      setup();
      expect(item("Ghost")).toBeUndefined();
    });

    it("moves with the arrow keys and activates with Enter", async () => {
      const { callbacks } = setup();
      expect(item("Rename")).toHaveFocus();
      await userEvent.keyboard("{ArrowDown}");
      expect(item("Pinned")).toHaveFocus();
      await userEvent.keyboard("{ArrowUp}{Enter}");
      expect(callbacks.plain).toHaveBeenCalledTimes(1);
    });
  });

  describe("roles and keyboard", () => {
    it("exposes the open menu as role=menu", () => {
      setup();
      expect(screen.getByRole("menu", { name: "Actions" })).toBeInTheDocument();
    });

    it("is not wrapped in a dialog", () => {
      setup();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes on a click outside the menu", async () => {
      const { onOpenChange } = setup();
      await userEvent.click(document.body);
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("stays open on an outside click refused by shouldCloseOnInteractOutside", async () => {
      const { onOpenChange } = setup({
        shouldCloseOnInteractOutside: () => false,
      });
      await userEvent.click(document.body);
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("closes on a click on the trigger", async () => {
      setup();
      await userEvent.click(screen.getByText("Actions"));
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("activates a submenu item without closing on the way", async () => {
      const { callbacks, onOpenChange } = setup();
      await userEvent.click(item("More"));
      await userEvent.click(item("Archive"));
      expect(callbacks.child).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("asks to close on Escape", async () => {
      const { onOpenChange } = setup();
      await userEvent.keyboard("{Escape}");
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    // Limit: focus leaves for the end of the page (relatedTarget null), so the
    // menu is not asked to close; it stays open until the next outside
    // click or Escape from the caller's side.
    it("lets Tab move focus out of the menu", async () => {
      setup();
      expect(item("Rename")).toHaveFocus();
      await userEvent.tab();
      expect(
        screen.queryByRole("menu")?.contains(document.activeElement),
      ).not.toBe(true);
    });
  });

  describe("selected state and names", () => {
    // fixed by t03: flip to a plain `it`
    it.fails(
      "exposes the checked state of a selectedValues item and an isChecked item",
      () => {
        setup();
        for (const name of ["Editor", "Pinned"]) {
          const el = item(name);
          expect(el.getAttribute("role")).toMatch(/^menuitem(radio|checkbox)$/);
          expect(el).toHaveAttribute("aria-checked", "true");
        }
        expect(item("Reader")).not.toHaveAttribute("aria-checked", "true");
      },
    );

    // fixed by t03: flip to a plain `it`
    it.fails("hides the check icon from assistive technology", () => {
      setup();
      const icon = item("Editor").querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    // fixed by t03: flip to a plain `it`
    it.fails("includes the subText in the item name", () => {
      setup();
      expect(
        screen.getByRole("menuitem", {
          name: /Share.*Anyone with the link/,
        }),
      ).toBeInTheDocument();
    });
  });
});
