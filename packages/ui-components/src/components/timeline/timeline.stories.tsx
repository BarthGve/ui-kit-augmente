import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "../badge";
import { Button } from "../button";
import { Timeline } from "./index";

const meta = {
  title: "Components/Timeline",
  component: Timeline,
  parameters: { layout: "padded" },
  args: {
    "aria-label": "Order history",
    events: [
      { id: "received", date: "2026-10-12", title: "Order received" },
      { id: "packed", date: "2026-10-13", title: "Packed" },
      { id: "shipped", date: "2026-10-15", title: "Shipped" },
    ],
  },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithStates: Story = {
  args: {
    events: [
      {
        id: "received",
        date: "2026-10-12",
        title: "Order received",
        state: "done",
      },
      { id: "packed", date: "2026-10-13", title: "Packed", state: "current" },
      { id: "shipped", date: "2026-10-15", title: "Shipped", state: "upcoming" },
      {
        id: "delivered",
        date: "2026-10-16",
        title: "Delivered",
        state: "upcoming",
      },
    ],
  },
};

export const WithContent: Story = {
  args: {
    events: [
      {
        id: "received",
        date: "2026-10-12",
        title: "Order received",
        state: "done",
        content: "Payment confirmed by the bank.",
      },
      {
        id: "packed",
        date: "2026-10-13",
        title: "Packed",
        state: "current",
        content: (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Badge type="info">2 parcels</Badge>
            <Button size="small" variant="secondary">
              Track
            </Button>
          </div>
        ),
      },
      {
        id: "shipped",
        date: "2026-10-15",
        title:
          "Shipped to a very long address that wraps on a narrow column without overflowing",
        state: "upcoming",
      },
    ],
  },
};

export const Localized: Story = {
  globals: { locale: "fr-FR" },
  args: {
    "aria-label": "Historique de la commande",
    events: [
      {
        id: "received",
        date: "2026-10-12",
        title: "Commande reçue",
        state: "done",
      },
      { id: "packed", date: "2026-10-13", title: "Emballée", state: "current" },
      { id: "shipped", date: "2026-10-15", title: "Expédiée", state: "upcoming" },
    ],
  },
};
