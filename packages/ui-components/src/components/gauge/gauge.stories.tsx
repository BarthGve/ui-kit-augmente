import type { Meta, StoryObj } from "@storybook/react";
import { Gauge } from "./Gauge";

const meta: Meta<typeof Gauge> = {
  title: "Components/Gauge",
  component: Gauge,
  tags: ["autodocs"],
  args: { value: 40, label: "Credits used" },
  parameters: {
    docs: {
      description: {
        component:
          "Shows any quantity between a minimum and a maximum, exposed as a `meter`. A value outside the range is clamped. The fill turns to warning from 80% and to error at 100%.",
      },
    },
  },
  render: (args) => (
    <div style={{ display: "flex", width: "300px" }}>
      <Gauge {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof Gauge>;

export const Default: Story = {};

export const CustomRange: Story = {
  args: { value: 15, min: 10, max: 30, label: "Temperature" },
};

export const Warning: Story = { args: { value: 85 } };

export const Full: Story = { args: { value: 100 } };

/** Out-of-range values are clamped to the bounds. */
export const Clamped: Story = { args: { value: 250 } };
