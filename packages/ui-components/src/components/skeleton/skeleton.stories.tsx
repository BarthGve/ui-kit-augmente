import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "./Skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "Components/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Placeholder that keeps the layout stable while content loads. It is hidden from assistive technology: expose the loading state on the container (for example `aria-busy`). The shimmer stops under `prefers-reduced-motion`.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: { shape: "line", width: 240 },
};

export const Shapes: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <Skeleton shape="line" width={160} />
      <Skeleton shape="block" width={160} />
      <Skeleton shape="circle" width={64} />
    </div>
  ),
};

export const CardPlaceholder: Story = {
  render: () => (
    <div aria-busy="true" style={{ display: "flex", gap: "1rem", width: 320 }}>
      <Skeleton shape="circle" width={48} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <Skeleton shape="line" width="60%" />
        <Skeleton shape="line" />
        <Skeleton shape="line" width="80%" />
      </div>
    </div>
  ),
};
