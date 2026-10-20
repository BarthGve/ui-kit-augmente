import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import { Button } from ":/components/button";
import { Message } from ":/components/message";
import { MessageScroller } from "./MessageScroller";

const meta: Meta<typeof MessageScroller> = {
  title: "Components/Chat/MessageScroller",
  component: MessageScroller,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          'Scroll area for a live conversation, last piece of the chat set. It follows new messages **only while the reader is at the end**; scrolled up, it stays put and offers a "Jump to latest" button. Older messages added above do not move what the reader is looking at. The viewport is a labelled, focusable region and the messages a `role="log"` (`aria-busy` while `streaming`). Mark messages with `data-message-id` and use the ref\'s `scrollToMessage(id)` to jump to one. It fills the height its parent gives it.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MessageScroller>;

const NOW = new Date("2026-10-19T14:05:00Z");

export const Live: Story = {
  render: () => {
    const [count, setCount] = useState(12);
    useEffect(() => {
      const timer = setInterval(() => setCount((n) => n + 1), 2000);
      return () => clearInterval(timer);
    }, []);
    return (
      <div
        style={{
          height: 360,
          width: 420,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <MessageScroller aria-label="Conversation">
          {Array.from({ length: count }, (_, i) => (
            <Message
              key={i}
              data-message-id={`m${i}`}
              author={i % 2 ? "Me" : "Ada"}
              own={i % 2 === 1}
              timestamp={NOW}
            >
              Message {i + 1}
            </Message>
          ))}
        </MessageScroller>
      </div>
    );
  },
};

export const Streaming: Story = {
  render: () => {
    const [text, setText] = useState("");
    useEffect(() => {
      const words =
        "A reply that is written word after word while you read it".split(" ");
      let i = 0;
      const timer = setInterval(() => {
        i = (i + 1) % (words.length + 1);
        setText(words.slice(0, i).join(" "));
      }, 400);
      return () => clearInterval(timer);
    }, []);
    return (
      <div
        style={{
          height: 200,
          width: 420,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <MessageScroller aria-label="Assistant" streaming>
          <Message author="Assistant" timestamp={NOW}>
            {text || "…"}
          </Message>
        </MessageScroller>
      </div>
    );
  },
};

export const WithButton: Story = {
  render: () => (
    <div
      style={{
        height: 240,
        width: 420,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <MessageScroller aria-label="Conversation">
        {Array.from({ length: 20 }, (_, i) => (
          <Message key={i} author="Ada" timestamp={NOW}>
            Message {i + 1}
          </Message>
        ))}
      </MessageScroller>
      <Button size="small" onClick={() => undefined}>
        Scroll up to see the jump button
      </Button>
    </div>
  ),
};
