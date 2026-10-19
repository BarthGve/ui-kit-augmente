import type { Meta, StoryObj } from "@storybook/react";
import { TreeViewNodeTypeEnum } from ":/components/tree-view";
import { MoveModal } from "./MoveModal";

type Item = { label: string };

const folder = (id: string, extra = {}) => ({
  id,
  label: id,
  nodeType: TreeViewNodeTypeEnum.SIMPLE_NODE as const,
  ...extra,
});

const ITEMS = [
  folder("Documents", {
    childrenCount: 2,
    children: [folder("Reports"), folder("Archive")],
  }),
  folder("Photos"),
  folder("Shared", { childrenCount: 3, children: [] }),
];

const meta: Meta<typeof MoveModal<Item>> = {
  title: "Components/MoveModal",
  component: MoveModal<Item>,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Modal to choose where to move an item. It renders the existing `Modal` and `TreeView`: children load lazily through `onLoadChildren`, and the tree is operable by keyboard (arrows, Enter). The item itself, its descendants and the current location cannot be chosen. `onMove` receives the destination id; cancelling or closing only calls `onClose`.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MoveModal<Item>>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onMove: (id) => console.log("move to", id),
    items: ITEMS as never,
    itemId: "Photos",
    currentLocationId: "Documents",
    onLoadChildren: async (id) => ({
      children: [folder(`${id} / A`), folder(`${id} / B`)] as never,
    }),
  },
};
