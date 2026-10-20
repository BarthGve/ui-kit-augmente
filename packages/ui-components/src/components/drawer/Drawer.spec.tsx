import { readFileSync } from "fs";
import { resolve } from "path";
import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { Drawer, DrawerProps } from "./Drawer";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const setup = (props: Partial<DrawerProps> = {}) => {
  const onClose = vi.fn();
  render(
    <CunninghamProvider currentLocale="en-US">
      <Drawer isOpen onClose={onClose} title="Filters" {...props}>
        <button>Apply</button>
        <p>Body text</p>
      </Drawer>
    </CunninghamProvider>,
  );
  return { onClose };
};

// jsdom has no PointerEvent: build the event by hand with its coordinates.
const pointer = (
  type: "pointerDown" | "pointerMove" | "pointerUp",
  el: Element,
  clientY: number,
) => {
  const event = createEvent[type](el, { pointerId: 1, bubbles: true });
  Object.defineProperty(event, "clientY", { value: clientY });
  fireEvent(el, event);
};

const dragHandle = async () =>
  (await screen.findByRole("dialog")).querySelector(
    ".c__drawer__handle",
  ) as HTMLElement;
const dialog = () => screen.getByRole("dialog");

describe("Drawer", () => {
  it("opens from the bottom as a modal dialog with a decorative drag handle", async () => {
    setup();
    const el = await screen.findByRole("dialog", { name: "Filters" });
    expect(el).toHaveAttribute("aria-modal", "true");
    expect(el).toHaveClass("c__sheet--bottom", "c__drawer");
    const handle = await dragHandle();
    expect(handle).toHaveAttribute("aria-hidden", "true");
  });

  it("closes after a drag down beyond the threshold", async () => {
    const { onClose } = setup();
    const handle = await dragHandle();
    pointer("pointerDown", handle, 100);
    pointer("pointerMove", handle, 160);
    expect(dialog().style.transform).toBe("translateY(60px)");
    pointer("pointerMove", handle, 260);
    pointer("pointerUp", handle, 260);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("springs back after a short drag", async () => {
    const { onClose } = setup();
    const handle = await dragHandle();
    pointer("pointerDown", handle, 100);
    pointer("pointerMove", handle, 140);
    pointer("pointerUp", handle, 140);
    expect(onClose).not.toHaveBeenCalled();
    expect(dialog().style.transform).toBe("");
  });

  it("does not follow a drag upwards", async () => {
    setup();
    const handle = await dragHandle();
    pointer("pointerDown", handle, 100);
    pointer("pointerMove", handle, 50);
    expect(dialog().style.transform).toBe("translateY(0px)");
  });

  it("can be closed from the keyboard and from a labelled close button, with focus kept inside", async () => {
    const { onClose } = setup();
    await screen.findByRole("dialog");
    for (let i = 0; i < 5; i++) {
      await userEvent.tab();
      expect(dialog()).toContainElement(document.activeElement as HTMLElement);
    }
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("scrolls its body when the content is taller than the viewport", () => {
    expect(scss).toMatch(/overscroll-behavior/);
    expect(
      readFileSync(resolve(__dirname, "../sheet/index.scss"), "utf8"),
    ).toMatch(/&__body\s*{[^}]*overflow:\s*auto/);
  });

  describe("snap points", () => {
    it("opens at the first snap point", async () => {
      setup({ snapPoints: [0.4, 0.9] });
      await screen.findByRole("dialog");
      expect(dialog().style.height).toBe("40dvh");
    });

    it("a drag past the threshold from a higher snap point goes to the lower one instead of closing", async () => {
      const { onClose } = setup({ snapPoints: [0.4, 0.9], defaultSnap: 1 });
      const handle = await dragHandle();
      expect(dialog().style.height).toBe("90dvh");
      pointer("pointerDown", handle, 100);
      pointer("pointerMove", handle, 300);
      pointer("pointerUp", handle, 300);
      expect(onClose).not.toHaveBeenCalled();
      expect(dialog().style.height).toBe("40dvh");
      // From the lowest one, the same drag closes it.
      pointer("pointerDown", handle, 100);
      pointer("pointerMove", handle, 300);
      pointer("pointerUp", handle, 300);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("styles", () => {
    it("removes the motion under reduced motion", () => {
      expect(scss).toMatch(
        /@media \(prefers-reduced-motion: reduce\)[\s\S]*?transition:\s*none/,
      );
    });

    it("takes radius, handle and elevation from tokens, with no literal", () => {
      for (const token of [
        "border-radius",
        "handle-color",
        "handle-width",
        "box-shadow",
      ]) {
        expect(scss).toContain(`--c--components--drawer--${token}`);
      }
      expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
        /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
      );
    });
  });
});
