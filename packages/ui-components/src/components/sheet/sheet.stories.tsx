import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from ":/components/button";
import { Sheet, SheetSide } from "./Sheet";

const meta: Meta<typeof Sheet> = {
  title: "Components/Sheet",
  component: Sheet,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Panel that slides over the page from the left, right, top or bottom, as a modal dialog named by its `title` (same overlay as `Modal`: backdrop, focus trap, focus returned to the opener, Escape and the close button call `onClose`, an outside click closes it unless `closeOnClickOutside` is `false`). The body scrolls while the header and the `footer` stay visible. The slide animation is removed under `prefers-reduced-motion`. For a touch bottom sheet that can be dragged closed, see the drawer.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Sheet>;

const Demo = ({ side, long }: { side?: SheetSide; long?: boolean }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open the sheet</Button>
      <Sheet
        isOpen={open}
        onClose={() => setOpen(false)}
        side={side}
        title="Document details"
        footer={
          <>
            <Button
              color="neutral"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </>
        }
      >
        {Array.from({ length: long ? 40 : 3 }, (_, i) => (
          <p key={i}>Paragraph {i + 1} of the sheet body.</p>
        ))}
      </Sheet>
    </>
  );
};

export const Right: Story = { render: () => <Demo /> };
export const Left: Story = { render: () => <Demo side="left" /> };
export const Top: Story = { render: () => <Demo side="top" /> };
export const Bottom: Story = { render: () => <Demo side="bottom" /> };
export const ScrollingBody: Story = { render: () => <Demo long /> };
