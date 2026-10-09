import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Badge } from "../badge";
import { Button } from "../button";
import { Card } from "./Card";

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: { layout: "padded" },
  args: { children: "A card groups related content." },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HeaderBodyFooter: Story = {
  args: {
    header: (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>Project status</span>
        <Badge type="success">Active</Badge>
      </div>
    ),
    children: "Three milestones delivered, two remaining before release.",
    footer: (
      <Button size="small" variant="secondary">
        Open project
      </Button>
    ),
  },
};

export const LongContent: Story = {
  args: {
    header: "Long content wraps",
    children:
      "https://example.org/a/very/long/unbroken/address/that/would/overflow/the/card/without/wrapping/" +
      "a".repeat(120),
  },
  render: (args) => (
    <div style={{ maxWidth: "20rem" }}>
      <Card {...args} />
    </div>
  ),
};

export const InteractiveLink: Story = {
  args: {
    href: "#card-target",
    header: "Annual report",
    children: "The whole card is a link. Its content names it.",
  },
};

export const InteractiveButton: Story = {
  args: {
    onPress: fn(),
    header: "New project",
    children: "The whole card is a button. Enter and Space press it.",
  },
};
