import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { TreeViewNodeTypeEnum } from ":/components/tree-view";
import { MoveModal, MoveModalProps } from "./MoveModal";

type Item = { label: string };

const ROW_HEIGHT = 34;

const folder = (id: string, extra = {}) => ({
  id,
  label: id,
  nodeType: TreeViewNodeTypeEnum.SIMPLE_NODE,
  ...extra,
});

const ITEMS = [
  folder("Docs", {
    childrenCount: 2,
    children: [folder("Reports"), folder("Archive")],
  }),
  folder("Photos"),
  folder("Lazy", { childrenCount: 1, children: [] }),
];

const setup = (props: Partial<MoveModalProps<Item>> = {}) => {
  const onMove = vi.fn();
  const onClose = vi.fn();
  render(
    <CunninghamProvider>
      <MoveModal<Item>
        isOpen
        onClose={onClose}
        onMove={onMove}
        items={ITEMS as never}
        {...props}
      />
    </CunninghamProvider>,
  );
  return { onMove, onClose };
};

const confirm = () => screen.getByRole("button", { name: "Move" });
const node = (label: string) =>
  screen.getByText(label).closest(".c__tree-view--node")!;

describe("MoveModal", () => {
  beforeEach(() => {
    // jsdom has no layout: give each row the box arborist measures.
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const isRow = this.getAttribute("role") === "treeitem";
        const y = isRow ? parseFloat(this.style.top) : 0;
        const height = isRow ? ROW_HEIGHT : 400;
        return {
          x: 0,
          y,
          top: y,
          left: 0,
          bottom: y + height,
          right: 300,
          width: 300,
          height,
          toJSON: () => ({}),
        } as DOMRect;
      },
    );
  });
  afterEach(() => vi.restoreAllMocks());

  it("shows the destination tree in a dialog and disables the confirm action", async () => {
    setup();
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Docs")).toBeVisible();
    expect(within(dialog).getByText("Photos")).toBeVisible();
    expect(confirm()).toBeDisabled();
  });

  it("enables the confirm action once a destination is selected, and moves there", async () => {
    const { onMove, onClose } = setup();
    await screen.findByRole("dialog");
    await userEvent.click(screen.getByText("Photos"));
    expect(confirm()).toBeEnabled();
    await userEvent.click(confirm());
    expect(onMove).toHaveBeenCalledExactlyOnceWith("Photos");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("cannot choose the item itself", async () => {
    const { onMove } = setup({ itemId: "Photos" });
    await screen.findByRole("dialog");
    await userEvent.click(screen.getByText("Photos"));
    expect(node("Photos")).toHaveAttribute("aria-disabled", "true");
    expect(confirm()).toBeDisabled();
    expect(onMove).not.toHaveBeenCalled();
  });

  it("cannot choose the current location", async () => {
    setup({ currentLocationId: "Photos" });
    await screen.findByRole("dialog");
    await userEvent.click(screen.getByText("Photos"));
    expect(node("Photos")).toHaveAttribute("aria-disabled", "true");
    expect(confirm()).toBeDisabled();
  });

  it("cannot choose a descendant of the item", async () => {
    setup({ itemId: "Docs" });
    await screen.findByRole("dialog");
    await userEvent.click(
      screen
        .getByText("Docs")
        .closest(".c__tree-view--node")!
        .querySelector(".c__tree-view--node__arrow")!,
    );
    await userEvent.click(await screen.findByText("Reports"));
    expect(node("Reports")).toHaveAttribute("aria-disabled", "true");
    expect(confirm()).toBeDisabled();
  });

  it("calls nothing but onClose when cancelling", async () => {
    const { onMove, onClose } = setup();
    await screen.findByRole("dialog");
    await userEvent.click(screen.getByText("Photos"));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onMove).not.toHaveBeenCalled();
  });

  it("calls nothing but onClose when closing", async () => {
    const { onMove, onClose } = setup();
    await screen.findByRole("dialog");
    await userEvent.click(screen.getByRole("button", { name: "close" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onMove).not.toHaveBeenCalled();
  });

  it("loads children lazily when a node is opened", async () => {
    const onLoadChildren = vi.fn().mockResolvedValue({
      children: [folder("Loaded")],
    });
    const { onMove } = setup({ onLoadChildren });
    await screen.findByRole("dialog");
    expect(onLoadChildren).not.toHaveBeenCalled();
    await userEvent.click(
      node("Lazy").querySelector(".c__tree-view--node__arrow")!,
    );
    await waitFor(() => expect(onLoadChildren).toHaveBeenCalledWith("Lazy", 1));
    await userEvent.click(await screen.findByText("Loaded"));
    await userEvent.click(confirm());
    expect(onMove).toHaveBeenCalledWith("Loaded");
  });

  it("is operable by keyboard", async () => {
    const { onMove } = setup();
    await screen.findByRole("dialog");
    await userEvent.click(screen.getByText("Docs"));
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(confirm()).toBeEnabled();
    await userEvent.click(confirm());
    expect(onMove).toHaveBeenCalledWith("Lazy");
  });
});
