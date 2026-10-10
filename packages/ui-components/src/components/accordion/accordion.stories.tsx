import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { Key } from "react-aria-components";
import { Badge } from "../badge";
import { Button } from "../button";
import { Input } from "../forms/input";
import { TextArea } from "../forms/text-area";
import { Accordion, AccordionItem } from "./index";

const sections = (
  <>
    <AccordionItem id="delivery" title="Delivery">
      Orders ship within two working days.
    </AccordionItem>
    <AccordionItem id="returns" title="Returns">
      Items can be returned within thirty days.
    </AccordionItem>
    <AccordionItem id="support" title="Support">
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        Contact the help desk. <Badge type="info">24/7</Badge>
      </div>
      <Button size="small" variant="secondary">
        Open a ticket
      </Button>
    </AccordionItem>
  </>
);

const meta = {
  title: "Components/Accordion",
  component: Accordion,
  parameters: { layout: "padded" },
  args: { children: sections },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Multiple: Story = {
  args: { allowsMultipleExpanded: true },
};

export const DefaultExpanded: Story = {
  args: { defaultExpandedKeys: ["returns"] },
};

export const Controlled: Story = {
  render: (args) => {
    const [keys, setKeys] = useState<Set<Key>>(new Set(["delivery"]));
    return (
      <>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          {["delivery", "returns", "support"].map((key) => (
            <Button
              key={key}
              size="small"
              variant="secondary"
              onClick={() => setKeys(new Set([key]))}
            >
              Open {key}
            </Button>
          ))}
          <Button
            size="small"
            variant="tertiary"
            onClick={() => setKeys(new Set())}
          >
            Close all
          </Button>
        </div>
        <Accordion {...args} expandedKeys={keys} onExpandedChange={setKeys} />
      </>
    );
  },
};

export const WithDisabledItem: Story = {
  args: {
    children: (
      <>
        <AccordionItem id="delivery" title="Delivery">
          Orders ship within two working days.
        </AccordionItem>
        <AccordionItem id="returns" title="Returns (unavailable)" isDisabled>
          Returns are closed.
        </AccordionItem>
        <AccordionItem id="support" title="Support">
          Contact the help desk.
        </AccordionItem>
      </>
    ),
  },
};

export const LongContent: Story = {
  args: {
    defaultExpandedKeys: ["long"],
    children: (
      <>
        <AccordionItem
          id="long"
          title={
            "A very long section title that wraps over several lines " +
            "https://example.org/" +
            "a".repeat(80)
          }
        >
          {"Long panel content that wraps without overflowing. ".repeat(20)}
        </AccordionItem>
        <AccordionItem id="short" title="Short">
          Short content.
        </AccordionItem>
      </>
    ),
  },
  render: (args) => (
    <div style={{ maxWidth: "20rem" }}>
      <Accordion {...args} />
    </div>
  ),
};

export const Nested: Story = {
  args: {
    defaultExpandedKeys: ["orders"],
    children: (
      <>
        <AccordionItem id="orders" title="Orders">
          <Accordion>
            <AccordionItem id="tracking" title="Tracking" headingLevel={4}>
              Follow a parcel from the order page.
            </AccordionItem>
            <AccordionItem id="cancel" title="Cancellation" headingLevel={4}>
              An order can be cancelled until it ships.
            </AccordionItem>
          </Accordion>
        </AccordionItem>
        <AccordionItem id="account" title="Account">
          Manage your profile and password.
        </AccordionItem>
      </>
    ),
  },
};

export const WithFormControls: Story = {
  args: {
    defaultExpandedKeys: ["contact"],
    children: (
      <>
        <AccordionItem id="contact" title="Contact details">
          <div style={{ display: "grid", gap: "1rem" }}>
            <Input label="Name" />
            <TextArea label="Message" />
          </div>
        </AccordionItem>
        <AccordionItem id="billing" title="Billing">
          Invoices are sent by email.
        </AccordionItem>
      </>
    ),
  },
};
