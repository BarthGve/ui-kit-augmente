import type { Meta, StoryObj } from "@storybook/react";
import { Bubble, BubbleGroup, BubbleReactions } from "./Bubble";

const meta: Meta<typeof Bubble> = {
  title: "Components/Chat/Bubble",
  component: Bubble,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          'A message bubble, first piece of the chat set (with `Message` and `MessageScroller`). Seven variants and an `align` to the `start` (others) or `end` (the reader). With `href` it is a link, with `onPress` a button. It never grows past 80% of its container. The `destructive` variant also writes what went wrong, so the error is not colour only. `BubbleGroup` stacks consecutive bubbles of one sender; `BubbleReactions` is a labelled row where each reaction reads "emoji, count".',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Bubble>;

export const Default: Story = { args: { children: "Hello, how are you?" } };

export const Variants: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "0.5rem", width: 420 }}>
      {(
        [
          "default",
          "secondary",
          "muted",
          "tinted",
          "outline",
          "ghost",
          "destructive",
        ] as const
      ).map((variant) => (
        <Bubble key={variant} variant={variant}>
          {variant}
        </Bubble>
      ))}
    </div>
  ),
};

export const Conversation: Story = {
  render: () => (
    <div style={{ width: 420, display: "grid", gap: "0.75rem" }}>
      <BubbleGroup>
        <Bubble variant="muted">Did you see the report?</Bubble>
        <Bubble variant="muted">It is in the shared folder.</Bubble>
      </BubbleGroup>
      <BubbleGroup align="end">
        <Bubble align="end">Yes, thanks!</Bubble>
        <Bubble align="end" variant="destructive">
          This one did not go through
        </Bubble>
      </BubbleGroup>
      <BubbleReactions
        reactions={[
          { emoji: "👍", count: 3 },
          { emoji: "❤️", count: 1, label: "heart" },
        ]}
      />
    </div>
  ),
};

export const Interactive: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "0.5rem", width: 320 }}>
      <Bubble variant="outline" href="#thread">
        See the thread
      </Bubble>
      <Bubble variant="outline" onPress={() => console.log("reply")}>
        Reply
      </Bubble>
    </div>
  ),
};
