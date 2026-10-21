import { ReactNode, useState } from "react";
import { NodeApi } from "react-arborist";
import { Button } from ":/components/button";
import { Modal, ModalSize } from ":/components/modal";
import { useCunningham } from ":/components/provider";
import {
  PaginatedChildrenResult,
  TreeDataItem,
  TreeProvider,
  TreeView,
  TreeViewDataType,
  TreeViewItem,
  TreeViewNodeTypeEnum,
} from ":/components/tree-view";

export type MoveModalProps<T> = {
  isOpen: boolean;
  /** Called when cancelling or closing; never called by a confirmed move. */
  onClose: () => void;
  /** Called with the id of the chosen destination. */
  onMove: (destinationId: string) => void;
  /** Tree of the possible destinations. */
  items: TreeViewDataType<T>[];
  /** Id of the item being moved: it and its descendants cannot be chosen. */
  itemId?: string;
  /** Id of the current location: it cannot be chosen. */
  currentLocationId?: string;
  /** Loads the children of a node the first time it is opened. */
  onLoadChildren?: (
    id: string,
    page: number,
  ) => Promise<PaginatedChildrenResult<T>>;
  title?: ReactNode;
  /** Text of a node; defaults to its `label`, then its `name`, then its id. */
  getLabel?: (value: TreeViewDataType<T>) => ReactNode;
};

const defaultLabel = <T,>(value: TreeViewDataType<T>) => {
  const { label, name } = value as { label?: string; name?: string };
  return label ?? name ?? value.id;
};

/**
 * Modal to choose the destination of a move. It renders the existing `Modal`
 * and `TreeView`: the tree logic (lazy loading, keyboard) is the tree's own.
 */
export const MoveModal = <T,>(props: MoveModalProps<T>) => {
  const { t } = useCunningham();
  const [selectedId, setSelectedId] = useState<string>();
  const getLabel = props.getLabel ?? defaultLabel;

  const isForbidden = (node: NodeApi<TreeDataItem<T>>) => {
    const id = node.data.value.id;
    if (id === props.itemId || id === props.currentLocationId) {
      return true;
    }
    if (props.itemId === undefined) {
      return false;
    }
    for (let parent = node.parent; parent; parent = parent.parent) {
      if (parent.data?.value?.id === props.itemId) {
        return true;
      }
    }
    return false;
  };

  const select = (node: NodeApi<TreeDataItem<T>>) => {
    const { nodeType } = node.data.value;
    if (
      nodeType === TreeViewNodeTypeEnum.TITLE ||
      nodeType === TreeViewNodeTypeEnum.SEPARATOR ||
      nodeType === TreeViewNodeTypeEnum.VIEW_MORE
    ) {
      return;
    }
    if (!isForbidden(node)) {
      setSelectedId(node.data.value.id);
    }
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      size={ModalSize.MEDIUM}
      title={props.title ?? t("components.moveModal.title")}
      rightActions={
        <>
          <Button color="neutral" variant="secondary" onClick={props.onClose}>
            {t("components.moveModal.cancel")}
          </Button>
          <Button
            disabled={selectedId === undefined}
            onClick={() => selectedId !== undefined && props.onMove(selectedId)}
          >
            {t("components.moveModal.move")}
          </Button>
        </>
      }
    >
      <TreeProvider<T>
        initialTreeData={props.items}
        onLoadChildren={props.onLoadChildren}
      >
        <TreeView<T>
          rootNodeId="__move-modal-root"
          selectedNodeId={selectedId}
          onActivate={select}
          canDrag={() => false}
          renderNode={(nodeProps) => {
            const forbidden = isForbidden(nodeProps.node);
            return (
              <TreeViewItem
                {...nodeProps}
                itemProps={forbidden ? { "aria-disabled": true } : undefined}
                onClick={() => select(nodeProps.node)}
              >
                <span className="c__move-modal__label">
                  {getLabel(nodeProps.node.data.value)}
                </span>
              </TreeViewItem>
            );
          }}
        />
      </TreeProvider>
    </Modal>
  );
};
