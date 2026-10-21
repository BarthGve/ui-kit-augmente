import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Selector } from "./Selector";

const OPTIONS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const meta: Meta<typeof Selector> = {
  title: "Components/Selector",
  component: Selector,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Segmented selector: choose one option among a few. Built on native radios inside a `radiogroup`: always pass an `aria-label`. Arrow keys move the selection, the group is a single tab stop, and a disabled option cannot be selected. Use `Tabs` to switch panels and `Radio` for a form field with a visible description.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Selector>;

export const Default: Story = {
  args: { "aria-label": "Period", options: OPTIONS, defaultValue: "week" },
};

export const Small: Story = {
  args: { ...Default.args, size: "small" },
};

export const DisabledOption: Story = {
  args: {
    ...Default.args,
    options: [OPTIONS[0], { ...OPTIONS[1], disabled: true }, OPTIONS[2]],
  },
};

export const Disabled: Story = {
  args: { ...Default.args, disabled: true },
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState("day");
    return (
      <Selector
        aria-label="Period"
        options={OPTIONS}
        value={value}
        onChange={setValue}
      />
    );
  },
};
