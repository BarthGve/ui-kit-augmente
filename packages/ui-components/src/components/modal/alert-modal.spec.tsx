import React, { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { onTestFinished } from "vitest";
import { AlertModal, AlertModalProps } from ":/components/modal/AlertModal";
import { CunninghamProvider } from ":/components/provider";
import { VariantType } from ":/utils/VariantUtils";

type HarnessProps = Omit<
  AlertModalProps,
  "isOpen" | "onClose" | "title" | "children"
> & {
  onClose?: () => void;
  locale?: string;
};

/** An opener button toggling the alert, so focus return follows a real open. */
const Harness = ({ onClose, locale, ...props }: HarnessProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <CunninghamProvider currentLocale={locale}>
      <button onClick={() => setIsOpen(true)}>Open alert</button>
      <AlertModal
        {...props}
        isOpen={isOpen}
        onClose={() => {
          onClose?.();
          setIsOpen(false);
        }}
        title="Delete this file?"
      >
        This cannot be undone.
      </AlertModal>
    </CunninghamProvider>
  );
};

const open = async (props: HarnessProps = {}) => {
  const user = userEvent.setup();
  render(<Harness {...props} />);
  await user.click(screen.getByRole("button", { name: "Open alert" }));
  const dialog = await screen.findByRole("alertdialog");
  return { user, dialog };
};

const primary = (onClick = vi.fn()) => ({ label: "Delete", onClick });

describe("<AlertModal/>", () => {
  describe("semantics", () => {
    it("is an alertdialog named by its title and described by its message only", async () => {
      const { dialog } = await open({
        severity: VariantType.WARNING,
        details: <a href="#more">Learn more</a>,
      });
      expect(dialog).toHaveAccessibleName("Delete this file?");
      expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
      expect(dialog).not.toHaveAttribute("aria-label");
      expect(
        screen.getByRole("link", { name: "Learn more" }),
      ).toBeInTheDocument();
    });

    it("renders a hidden icon per severity, none without severity, the media instead when given", async () => {
      const ligatures = {
        info: "info",
        success: "check_circle",
        warning: "error_outline",
        error: "cancel",
      } as const;
      for (const [severity, ligature] of Object.entries(ligatures)) {
        const { unmount } = render(
          <CunninghamProvider>
            <AlertModal
              isOpen
              onClose={() => {}}
              severity={severity as keyof typeof ligatures}
              title="Title"
            >
              Message
            </AlertModal>
          </CunninghamProvider>,
        );
        const dialog = await screen.findByRole("alertdialog");
        const icon = screen.getByText(ligature);
        expect(icon).toHaveAttribute("aria-hidden", "true");
        expect(dialog).toHaveAccessibleName("Title");
        unmount();
      }

      const { unmount } = render(
        <CunninghamProvider>
          <AlertModal isOpen onClose={() => {}} title="Title">
            Message
          </AlertModal>
        </CunninghamProvider>,
      );
      await screen.findByRole("alertdialog");
      for (const ligature of Object.values(ligatures)) {
        expect(screen.queryByText(ligature)).not.toBeInTheDocument();
      }
      unmount();

      render(
        <CunninghamProvider>
          <AlertModal
            isOpen
            onClose={() => {}}
            severity="error"
            media={<span>media</span>}
            title="Title"
          >
            Message
          </AlertModal>
        </CunninghamProvider>,
      );
      await screen.findByRole("alertdialog");
      expect(screen.getByText("media")).toBeInTheDocument();
      expect(screen.queryByText("cancel")).not.toBeInTheDocument();
    });

    it("types severity as optional and refuses a value outside the four", () => {
      const props: AlertModalProps = {
        isOpen: false,
        onClose: () => {},
        title: "t",
        children: "m",
      };
      // @ts-expect-error neutral is the absence of severity, not a value.
      const invalid: AlertModalProps = { ...props, severity: "neutral" };
      expect(invalid).toBeDefined();
    });

    it("has no close X", async () => {
      await open();
      expect(
        screen.queryByRole("button", { name: "close" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("focus", () => {
    it("focuses the primary action, loops Tab inside, and returns to the opener", async () => {
      // jsdom has no layout: react-modal's Tab loop would see every button
      // as hidden (zero size) and swallow Tab. Give elements a size.
      const width = vi
        .spyOn(HTMLElement.prototype, "offsetWidth", "get")
        .mockReturnValue(1);
      onTestFinished(() => width.mockRestore());
      const { user } = await open({ primaryAction: primary() });
      const del = screen.getByRole("button", { name: "Delete" });
      const cancel = screen.getByRole("button", { name: "Cancel" });
      expect(del).toHaveFocus();

      await user.tab();
      expect(cancel).toHaveFocus();
      await user.tab({ shift: true });
      expect(del).toHaveFocus();

      await user.keyboard("{Escape}");
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Open alert" })).toHaveFocus();
    });

    it("focuses the dismiss action when there is no primary action", async () => {
      await open({ severity: VariantType.INFO });
      expect(screen.getByRole("button", { name: "Ok" })).toHaveFocus();
    });

    it("focuses the dismiss action, not the primary one, for an error", async () => {
      await open({ severity: "error", primaryAction: primary() });
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    });

    it("focuses without scrolling, so a long message opens at its title", async () => {
      const focus = vi.spyOn(HTMLElement.prototype, "focus");
      onTestFinished(() => focus.mockRestore());
      await open({ primaryAction: primary() });
      const del = screen.getByRole("button", { name: "Delete" });
      expect(del).toHaveFocus();
      const calls = focus.mock.contexts
        .map((el, i) => [el, focus.mock.calls[i][0]] as const)
        .filter(([el]) => el === del);
      expect(calls.length).toBeGreaterThan(0);
      for (const [, options] of calls) {
        expect(options).toEqual({ preventScroll: true });
      }
    });
  });

  describe("closing", () => {
    it("calls onClose once on dismiss and once on Escape", async () => {
      const onClose = vi.fn();
      const { user } = await open({ onClose });
      await user.click(screen.getByRole("button", { name: "Ok" }));
      expect(onClose).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole("button", { name: "Open alert" }));
      await screen.findByRole("alertdialog");
      await user.keyboard("{Escape}");
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it("runs the primary action without closing", async () => {
      const onClose = vi.fn();
      const onClick = vi.fn();
      const { user } = await open({ onClose, primaryAction: primary(onClick) });
      await user.click(screen.getByRole("button", { name: "Delete" }));
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("ignores a backdrop click unless closeOnClickOutside", async () => {
      const onClose = vi.fn();
      const { user } = await open({ onClose });
      await user.click(document.querySelector(".c__modal__backdrop")!);
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    it("closes on a backdrop click with closeOnClickOutside", async () => {
      const onClose = vi.fn();
      const { user } = await open({ onClose, closeOnClickOutside: true });
      await user.click(document.querySelector(".c__modal__backdrop")!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("labels", () => {
    const dismissName = async (props: HarnessProps) => {
      const { dialog } = await open(props);
      // DOM order: dismiss first, then the primary action.
      return within(dialog).getAllByRole("button")[0].textContent;
    };

    it("defaults to Ok alone", async () => {
      expect(await dismissName({})).toBe("Ok");
    });

    it("defaults to Cancel next to a primary action", async () => {
      expect(await dismissName({ primaryAction: primary() })).toBe("Cancel");
    });

    it("is translated", async () => {
      expect(
        await dismissName({ primaryAction: primary(), locale: "fr-FR" }),
      ).toBe("Annuler");
    });

    it("is overridden by dismissLabel", async () => {
      expect(
        await dismissName({ primaryAction: primary(), dismissLabel: "Keep" }),
      ).toBe("Keep");
    });
  });
});
