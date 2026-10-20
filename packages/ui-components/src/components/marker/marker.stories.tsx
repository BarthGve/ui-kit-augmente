import type { Meta, StoryObj } from "@storybook/react";
import { Marker } from "./Marker";

const meta: Meta<typeof Marker> = {
  title: "Components/Marker",
  component: Marker,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          'An inline note between messages or events: a system line, or a divider such as "Yesterday" (`separator`, a centred label between two rules). Presentational unless it reports progress (`status`, announced as a status); a marker with only an icon needs an `aria-label`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Marker>;

export const Default: Story = {
  args: { children: "Ada joined the conversation" },
};
export const Border: Story = {
  args: { variant: "border", children: "Conversation archived" },
};
export const Separator: Story = {
  args: { variant: "separator", children: "Yesterday" },
};
export const WithIcon: Story = {
  args: { icon: <span>✔</span>, children: "Message delivered" },
};
export const Status: Story = { args: { status: true, children: "Uploading…" } };
