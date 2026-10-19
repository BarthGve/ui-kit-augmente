import type { Meta, StoryObj } from "@storybook/react";
import { Button } from ":/components/button";
import { InputGroup } from "./index";

const meta: Meta<typeof InputGroup> = {
  title: "Components/Forms/InputGroup",
  component: InputGroup,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "An input (or a textarea with `multiline`) with a prefix, a suffix or an inline action inside its border. One border and one focus ring surround the group; clicking an addon text focuses the field; the `Field` states (`state`, `text`, `disabled`) apply to all of it. `leading` and `trailing` are decorative (hidden from assistive technology): put information the user needs in the label or the text. `leadingAction` and `trailingAction` are interactive (a `Button`) and stay reachable.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof InputGroup>;

export const Default: Story = {
  args: {
    label: "Website",
    leading: "https://",
    trailing: ".com",
    placeholder: "example",
  },
};

export const WithAction: Story = {
  args: {
    label: "Invitation link",
    defaultValue: "https://example.com/invite/42",
    readOnly: true,
    trailingAction: (
      <Button size="small" variant="tertiary" color="neutral">
        Copy
      </Button>
    ),
  },
};

export const Amount: Story = {
  args: {
    label: "Amount",
    leading: "€",
    trailing: "EUR",
    inputMode: "decimal",
    placeholder: "0.00",
  },
};

export const Multiline: Story = {
  args: { label: "Comment", multiline: true, rows: 3, leading: "💬" },
};

export const States: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 360 }}>
      <InputGroup
        label="Error"
        leading="https://"
        state="error"
        text="Not a valid URL"
      />
      <InputGroup
        label="Success"
        leading="https://"
        state="success"
        text="Available"
      />
      <InputGroup label="Disabled" leading="https://" disabled />
    </div>
  ),
};
