import {
  act,
  createEvent,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createPortal } from "react-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NodeRendererProps } from "react-arborist";
import { CunninghamProvider } from ":/components/provider";
import { TreeProvider, TreeProviderProps } from "./providers/TreeContext";
import { TreeView, TreeViewProps } from "./TreeView";
import { TreeViewItem } from "./TreeViewItem";
import {
  TreeDataItem,
  TreeViewDataType,
  TreeViewMoveModeEnum,
  TreeViewNodeTypeEnum,
} from "./types";

type Item = Record<string, never>;

const ROW_HEIGHT = 34;

const node = (
  id: string,
  extra: Partial<TreeViewDataType<Item>> = {}
): TreeViewDataType<Item> =>
  ({
    id,
    label: id,
    nodeType: TreeViewNodeTypeEnum.SIMPLE_NODE,
    ...extra,
  }) as TreeViewDataType<Item>;

const renderNode = (props: NodeRendererProps<TreeDataItem<Item>>) => {
  const { id, label } = props.node.data.value as { id: string; label: string };
  return (
    <TreeViewItem {...props} testId={`node-${id}`}>
      <span>{label}</span>
      {id === "a" &&
        createPortal(<button>portal action</button>, document.body)}
    </TreeViewItem>
  );
};

const renderTree = ({
  data = [node("a"), node("b"), node("c")],
  onLoadChildren,
  onAncestorClick,
  ...treeProps
}: Partial<TreeViewProps<Item>> & {
  data?: TreeViewDataType<Item>[];
  onLoadChildren?: TreeProviderProps<Item>["onLoadChildren"];
  onAncestorClick?: () => void;
} = {}) =>
  render(
    <CunninghamProvider>
      <TreeProvider initialTreeData={data} onLoadChildren={onLoadChildren}>
        <div onClick={onAncestorClick}>
          <TreeView rootNodeId="ROOT" renderNode={renderNode} {...treeProps} />
        </div>
      </TreeProvider>
    </CunninghamProvider>
  );

const row = (id: string) =>
  screen.getByTestId(`node-${id}`).closest('[role="treeitem"]') as HTMLElement;

// The visible tree, top to bottom, as "<aria-level>:<id>".
const shape = () =>
  screen.getAllByRole("treeitem").map((r) => {
    const testId = r.querySelector("[data-testid]")?.getAttribute("data-testid");
    return `${r.getAttribute("aria-level")}:${testId?.replace("node-", "")}`;
  });

// Drags `source` and drops it on the vertical middle of `target`'s row, which
// arborist reads as "into this node" (first child).
const dragOnto = (source: string, target: string) => {
  const handle = screen.getByTestId(`node-${source}`);
  const targetRow = row(target);
  const y = parseFloat(targetRow.style.top) + ROW_HEIGHT / 2;
  // jsdom has no DragEvent: the generic Event it builds drops clientX/Y, so
  // set them by hand (the HTML5 backend reads them to place the drop).
  const fire = (
    type: "dragStart" | "dragEnter" | "dragOver" | "drop" | "dragEnd",
    el: Element
  ) => {
    const event = createEvent[type](el);
    Object.defineProperties(event, {
      clientX: { value: 50 },
      clientY: { value: y },
    });
    return fireEvent(el, event);
  };
  // Like a browser, give up when the drag source cancels the dragstart.
  if (!fire("dragStart", handle)) {
    return;
  }
  fire("dragEnter", targetRow);
  fire("dragOver", targetRow);
  fire("drop", targetRow);
  fire("dragEnd", handle);
};

describe("<TreeView/>", () => {
  beforeEach(() => {
    // jsdom has no layout: give each row the box arborist measures (its
    // `top` style and the 34px row height).
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
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("moving a node", () => {
    it("moves a node dropped onto a parent and reports the new parent and index", () => {
      const afterMove = vi.fn();
      renderTree({ afterMove });

      dragOnto("a", "b");

      expect(afterMove).toHaveBeenCalledTimes(1);
      expect(afterMove).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceId: "a",
          newParentId: "b",
          mode: TreeViewMoveModeEnum.FIRST_CHILD,
          index: 0,
        })
      );
      expect(shape()).toEqual(["1:b", "2:a", "1:c"]);
    });

    it("defers the move until beforeMove runs its callback", () => {
      const afterMove = vi.fn();
      let moveCallback: (() => void) | undefined;
      const beforeMove = vi.fn((_result, callback: () => void) => {
        moveCallback = callback;
      });
      renderTree({ afterMove, beforeMove });

      dragOnto("a", "b");

      expect(beforeMove).toHaveBeenCalledWith(
        expect.objectContaining({ sourceId: "a", newParentId: "b" }),
        expect.any(Function)
      );
      expect(afterMove).not.toHaveBeenCalled();
      expect(shape().filter((s) => s.startsWith("1:"))).toEqual([
        "1:a",
        "1:b",
        "1:c",
      ]);

      act(() => moveCallback!());

      expect(afterMove).toHaveBeenCalledTimes(1);
      expect(shape()).toEqual(["1:b", "2:a", "1:c"]);
    });

    it("leaves the tree unchanged when canDrop refuses the target", () => {
      const afterMove = vi.fn();
      const beforeMove = vi.fn();
      renderTree({ afterMove, beforeMove, canDrop: () => false });

      dragOnto("a", "b");

      expect(beforeMove).not.toHaveBeenCalled();
      expect(afterMove).not.toHaveBeenCalled();
      expect(shape()).toEqual(["1:a", "1:b", "1:c"]);
    });

    it("leaves the tree unchanged when canDrag refuses the node", () => {
      const afterMove = vi.fn();
      renderTree({ afterMove, canDrag: () => false });

      dragOnto("a", "b");

      expect(afterMove).not.toHaveBeenCalled();
      expect(shape()).toEqual(["1:a", "1:b", "1:c"]);
    });

    it("moves a node into a parent whose children were loaded lazily", async () => {
      const afterMove = vi.fn();
      const onLoadChildren = vi.fn(async () => ({ children: [node("l1")] }));
      renderTree({
        data: [node("a"), node("l", { childrenCount: 1 })],
        initialOpenState: { l: true },
        onLoadChildren,
        afterMove,
      });

      await screen.findByTestId("node-l1");
      expect(onLoadChildren).toHaveBeenCalledWith("l", 1);

      dragOnto("a", "l");

      expect(afterMove).toHaveBeenCalledWith(
        expect.objectContaining({ sourceId: "a", newParentId: "l" })
      );
      expect(shape()).toEqual(["1:l", "2:a", "2:l1"]);
    });
  });

  describe("clicks", () => {
    it("does not let a click inside a portal reach the row or its ancestors", async () => {
      const user = userEvent.setup();
      const onAncestorClick = vi.fn();
      const onRowClick = vi.fn();
      renderTree({ onAncestorClick, rowProps: { onClick: onRowClick } });

      await user.click(screen.getByRole("button", { name: "portal action" }));

      expect(onAncestorClick).not.toHaveBeenCalled();
      expect(onRowClick).not.toHaveBeenCalled();
      expect(row("a")).toHaveAttribute("aria-selected", "false");

      // Witness: a click on the node itself does bubble.
      await user.click(screen.getByText("a"));

      expect(onAncestorClick).toHaveBeenCalledTimes(1);
      expect(row("a")).toHaveAttribute("aria-selected", "true");
    });

    it("calls rowProps.onClick once when an ordinary row is clicked, and still selects it", async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();
      renderTree({ rowProps: { onClick: onRowClick } });

      await user.click(screen.getByText("b"));

      expect(onRowClick).toHaveBeenCalledTimes(1);
      expect(row("b")).toHaveAttribute("aria-selected", "true");
    });
  });
});
