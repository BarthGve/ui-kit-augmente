import { useEffect, useState } from "react";
import { NodeRendererProps } from "react-arborist";
import { CunninghamProvider } from "../../src/components/provider/Provider";
import { Modal, ModalSize } from "../../src/components/modal";
import { TreeProvider } from "../../src/components/tree-view/providers/TreeContext";
import { TreeView } from "../../src/components/tree-view/TreeView";
import { TreeViewItem } from "../../src/components/tree-view/TreeViewItem";
import {
  TreeDataItem,
  TreeViewDataType,
  TreeViewMoveResult,
  TreeViewNodeTypeEnum,
} from "../../src/components/tree-view/types";

// Playwright CT bridges function props as one-way dispatchers, so tests
// describe the scenario with plain data and this helper, which runs in the
// browser, builds the callbacks. Moves land on `window.__treeMoves`, and the
// parent of every `canDrop` question on `window.__canDropAsked` (proof that a
// refused drag really reached its target).

declare global {
  interface Window {
    __treeMoves: TreeViewMoveResult[];
    __canDropAsked: (string | null)[];
  }
}

type Item = Record<string, never>;

export type TestNode = { id: string; children?: TestNode[]; lazy?: string[] };

const toData = (n: TestNode): TreeViewDataType<Item> =>
  ({
    id: n.id,
    label: n.id,
    nodeType: TreeViewNodeTypeEnum.SIMPLE_NODE,
    children: n.children?.map(toData),
    childrenCount: n.lazy?.length ?? n.children?.length,
  }) as TreeViewDataType<Item>;

const renderNode = (props: NodeRendererProps<TreeDataItem<Item>>) => {
  const { id } = props.node.data.value;
  return (
    <TreeViewItem {...props} testId={`node-${id}`}>
      <span>{id}</span>
    </TreeViewItem>
  );
};

interface TestTreeViewProps {
  nodes: TestNode[];
  open?: string[];
  /** `canDrop` refuses this parent id. */
  refuseParent?: string;
  /** Render the tree inside an open `Modal`; "with-root" passes the modal
   * body as `dndRootElement`. */
  modal?: "with-root" | "without-root";
}

export const TestTreeView = ({
  nodes,
  open = [],
  refuseParent,
  modal,
}: TestTreeViewProps) => {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    window.__treeMoves = [];
    window.__canDropAsked = [];
  }, []);

  const lazyChildren = new Map(
    nodes.filter((n) => n.lazy).map((n) => [n.id, n.lazy!]),
  );

  // react-dnd keeps one HTML5 backend per window, created by the first
  // render: with a root element, mount the tree only once the element exists.
  const tree =
    modal === "with-root" && !root ? null : (
      <TreeView
        rootNodeId="ROOT"
        renderNode={renderNode}
        initialOpenState={Object.fromEntries(open.map((id) => [id, true]))}
        dndRootElement={modal === "with-root" ? root : undefined}
        canDrop={({ parentNode }) => {
          const id = parentNode?.data.value?.id ?? null;
          window.__canDropAsked.push(id);
          return id !== refuseParent;
        }}
        afterMove={(result) => window.__treeMoves.push(result)}
      />
    );

  const provider = (
    <TreeProvider
      initialTreeData={nodes.map(toData)}
      onLoadChildren={async (id) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return {
          children: (lazyChildren.get(id) ?? []).map((child) =>
            toData({ id: child }),
          ),
        };
      }}
    >
      {tree}
    </TreeProvider>
  );

  return (
    <CunninghamProvider currentLocale="en-US">
      {modal ? (
        <Modal isOpen size={ModalSize.MEDIUM} onClose={() => {}} title="Move">
          <div ref={setRoot}>{provider}</div>
        </Modal>
      ) : (
        provider
      )}
    </CunninghamProvider>
  );
};
