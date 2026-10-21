import type { Meta, StoryObj } from "@storybook/react";
import { ScrollArea } from "./ScrollArea";

const meta: Meta<typeof ScrollArea> = {
  title: "Components/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A scrollable box with thin scrollbars styled in CSS (`scrollbar-width`, `::-webkit-scrollbar`), so wheel, touch and keyboard scrolling stay native. The region is labelled and becomes focusable (`tabindex=0`) only when its content overflows, so keyboard users can scroll it; scrollbars show only where needed, and forced-colors mode uses the system scrollbars. Constrain it with a height or a width. For a horizontal strip with arrow buttons, see `SmartScroller`.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

export const Vertical: Story = {
  render: () => (
    <ScrollArea aria-label="Release notes" style={{ height: 160, width: 320 }}>
      {Array.from({ length: 20 }, (_, i) => (
        <p key={i}>Line {i + 1} of the release notes.</p>
      ))}
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <ScrollArea
      aria-label="Wide table"
      orientation="horizontal"
      style={{ width: 320 }}
    >
      <div style={{ width: 800, whiteSpace: "nowrap" }}>
        A very wide row of content that needs sideways scrolling.
      </div>
    </ScrollArea>
  ),
};

export const Both: Story = {
  render: () => (
    <ScrollArea
      aria-label="Canvas"
      orientation="both"
      style={{ height: 160, width: 320 }}
    >
      <div style={{ width: 800, height: 500 }}>Large content</div>
    </ScrollArea>
  ),
};
