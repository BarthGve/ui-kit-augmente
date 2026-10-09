import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "../badge";
import { Button } from "../button";
import { Card } from "./Card";

const meta = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
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
