import type { Meta, StoryObj } from "@storybook/react";
import { Button } from ":/components/button";
import { Message } from "./Message";

const meta: Meta<typeof Message> = {
  title: "Components/Chat/Message",
  component: Message,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "One message of a conversation: the author's avatar (from `users`), name, a `<time>` and the content in a `Bubble`, plus actions. The actions are real controls in the tab order: they appear on hover and as soon as one of them has the focus, and stay visible on touch screens. The reader's own messages (`own`) sit at the end, with the default bubble; others' use the muted one.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Message>;

const NOW = new Date("2026-10-19T14:05:00Z");
const actions = (
  <>
    <Button size="nano" variant="tertiary" color="neutral">
      Reply
    </Button>
    <Button size="nano" variant="tertiary" color="neutral">
      React
    </Button>
  </>
);

export const Others: Story = {
  args: {
    author: "Ada Lovelace",
    timestamp: NOW,
    children: "Did you see the report?",
    actions,
  },
};

export const Own: Story = {
  args: {
    author: "Me",
    timestamp: NOW,
    own: true,
    children: "Yes, thanks!",
    actions,
  },
};

export const Conversation: Story = {
  render: () => (
    <div style={{ width: 460, display: "grid", gap: "1rem" }}>
      <Message author="Ada Lovelace" timestamp={NOW} actions={actions}>
        Did you see the report?
      </Message>
      <Message author="Me" own timestamp={NOW} actions={actions}>
        Yes, thanks!
      </Message>
      <Message author="Me" own timestamp={NOW} variant="destructive">
        This one did not go through
      </Message>
    </div>
  ),
};
