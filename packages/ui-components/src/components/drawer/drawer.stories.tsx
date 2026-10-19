import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from ":/components/button";
import { Drawer } from "./Drawer";

const meta: Meta<typeof Drawer> = {
  title: "Components/Drawer",
  component: Drawer,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Bottom drawer for touch screens: a `Sheet` that opens from the bottom with a drag handle. Dragging the handle down past `closeThreshold` closes it (or lowers it to the previous `snapPoints` entry). Keyboard and screen reader users close it with Escape or the labelled close button; focus is trapped and returned to the opener. Content taller than the viewport scrolls inside the drawer. Motion is removed under `prefers-reduced-motion`.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Drawer>;

const Demo = ({
  snapPoints,
  long,
}: {
  snapPoints?: number[];
  long?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open the drawer</Button>
      <Drawer
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Filters"
        snapPoints={snapPoints}
        footer={<Button onClick={() => setOpen(false)}>Apply</Button>}
      >
        {Array.from({ length: long ? 40 : 3 }, (_, i) => (
          <p key={i}>Filter option {i + 1}</p>
        ))}
      </Drawer>
    </>
  );
};

export const Default: Story = { render: () => <Demo /> };
export const SnapPoints: Story = {
  render: () => <Demo snapPoints={[0.4, 0.9]} long />,
};
export const LongContent: Story = { render: () => <Demo long /> };
