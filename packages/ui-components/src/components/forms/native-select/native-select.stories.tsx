import type { Meta, StoryObj } from "@storybook/react";
import { NativeSelect } from "./index";

const meta: Meta<typeof NativeSelect> = {
  title: "Components/Forms/NativeSelect",
  component: NativeSelect,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A native `select` with the `Field` look (label, hint, error and success states, disabled), so the platform picker is used: the right choice on mobile and in simple forms. The custom `Select` stays for richer needs (search, multiple, pills). Options come from `options` (entries and groups) or from `option` / `optgroup` children; controlled (`value`) or uncontrolled (`defaultValue`). Border, radius and focus ring are the `Input` tokens.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof NativeSelect>;

const OPTIONS = [
  { value: "fr", label: "France" },
  { value: "de", label: "Germany" },
  { value: "es", label: "Spain", disabled: true },
];

export const Default: Story = {
  args: { label: "Country", options: OPTIONS, defaultValue: "fr" },
};
export const Placeholder: Story = {
  args: { label: "Country", options: OPTIONS, placeholder: "Pick a country" },
};
export const Groups: Story = {
  args: {
    label: "Country",
    options: [
      {
        group: "Europe",
        options: [
          { value: "fr", label: "France" },
          { value: "de", label: "Germany" },
        ],
      },
      { group: "Asia", options: [{ value: "jp", label: "Japan" }] },
    ],
  },
};
export const States: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 320 }}>
      <NativeSelect
        label="Error"
        options={OPTIONS}
        state="error"
        text="Pick a country"
      />
      <NativeSelect
        label="Success"
        options={OPTIONS}
        state="success"
        text="Looks good"
      />
      <NativeSelect label="Disabled" options={OPTIONS} disabled />
    </div>
  ),
};
