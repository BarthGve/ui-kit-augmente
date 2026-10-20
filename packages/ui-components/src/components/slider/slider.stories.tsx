import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Slider, SliderValue } from "./Slider";

const meta: Meta<typeof Slider> = {
  title: "Components/Slider",
  component: Slider,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Pick a number, or a range with two thumbs, between `min` and `max` by `step`. Built on react-aria's `Slider`: arrow keys move by `step`, Home and End jump to the bounds, PageUp and PageDown move by a larger step. Name it with `label` or `aria-label`; a range also names its thumbs with `thumbLabels`. Controlled (`value`, `onChange`) or uncontrolled (`defaultValue`).",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: { label: "Volume", defaultValue: 40, showValue: true },
};

export const Range: Story = {
  args: {
    label: "Price",
    defaultValue: [20, 60],
    thumbLabels: ["Minimum", "Maximum"],
    showValue: true,
  },
};

export const Stepped: Story = {
  args: {
    label: "Rating",
    min: 0,
    max: 10,
    step: 2,
    defaultValue: 4,
    showValue: true,
  },
};

export const Disabled: Story = {
  args: { ...Default.args, disabled: true },
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState<SliderValue>(30);
    return (
      <Slider label="Brightness" value={value} onChange={setValue} showValue />
    );
  },
};
