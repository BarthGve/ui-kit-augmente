import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Toggle } from "./Toggle";

const meta: Meta<typeof Toggle> = {
  title: "Components/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A button that stays pressed (`aria-pressed`): a tool or a format option. Click, Enter and Space switch it; controlled (`pressed`, `onChange`) or uncontrolled (`defaultPressed`). The pressed state shows through a bar under the label and a heavier weight, not colour alone. A group of exclusive options is the `Selector`.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = { args: { children: "Bold" } };
export const Outlined: Story = {
  args: { children: "Italic", variant: "outlined" },
};
export const Pressed: Story = {
  args: { children: "Bold", defaultPressed: true },
};
export const Disabled: Story = { args: { children: "Bold", disabled: true } };
export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <Toggle variant="outlined">Medium</Toggle>
      <Toggle variant="outlined" size="small">
        Small
      </Toggle>
      <Toggle variant="outlined" size="nano">
        Nano
      </Toggle>
    </div>
  ),
};
export const IconOnly: Story = {
  args: {
    icon: <span>★</span>,
    "aria-label": "Favourite",
    variant: "outlined",
  },
};
export const Controlled: Story = {
  render: () => {
    const [pressed, setPressed] = useState(false);
    return (
      <Toggle pressed={pressed} onChange={setPressed}>
        {pressed ? "On" : "Off"}
      </Toggle>
    );
  },
};
