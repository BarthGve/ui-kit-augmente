import type { Meta, StoryObj } from "@storybook/react";
import { AspectRatio } from "./AspectRatio";

const meta: Meta<typeof AspectRatio> = {
  title: "Components/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A box that keeps a fixed width-to-height `ratio` (CSS `aspect-ratio`; default 1, an invalid value falls back to 1). An image, video or iframe inside fills it and is cropped, never stretched. It adds no role.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AspectRatio>;

const Placeholder = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      background: "linear-gradient(135deg, #cfd3f1, #8f94fd)",
    }}
  />
);

export const Video: Story = {
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <AspectRatio ratio={16 / 9}>
        <Placeholder />
      </AspectRatio>
    </div>
  ),
};

export const Square: Story = {
  render: () => (
    <div style={{ maxWidth: 240 }}>
      <AspectRatio>
        <Placeholder />
      </AspectRatio>
    </div>
  ),
};

export const Portrait: Story = {
  render: () => (
    <div style={{ maxWidth: 240 }}>
      <AspectRatio ratio={3 / 4}>
        <Placeholder />
      </AspectRatio>
    </div>
  ),
};
