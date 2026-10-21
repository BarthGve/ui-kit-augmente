import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Collapsible } from "./Collapsible";

const meta: Meta<typeof Collapsible> = {
  title: "Components/Collapsible",
  component: Collapsible,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A single region that a button shows or hides (built on the same react-aria `Disclosure` as the `Accordion`, which groups several). The trigger exposes `aria-expanded` and `aria-controls`; Enter and Space toggle it. The collapsed content is hidden from assistive technology and cannot be focused. The height transition is removed under `prefers-reduced-motion`.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  args: {
    trigger: "Show details",
    children: "Some content that can be hidden.",
  },
};

export const OpenByDefault: Story = {
  args: { ...Default.args, defaultOpen: true },
};
export const Disabled: Story = { args: { ...Default.args, disabled: true } };

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Collapsible
        trigger={open ? "Hide" : "Show"}
        open={open}
        onOpenChange={setOpen}
      >
        Controlled content.
      </Collapsible>
    );
  },
};
