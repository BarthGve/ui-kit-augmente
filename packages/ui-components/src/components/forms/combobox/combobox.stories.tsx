import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Combobox, ComboboxOption } from "./index";

const OPTIONS: ComboboxOption[] = [
  { value: "fr", label: "France" },
  { value: "de", label: "Germany" },
  { value: "es", label: "Spain" },
  { value: "it", label: "Italy" },
  { value: "fi", label: "Finland", disabled: true },
];

const meta: Meta<typeof Combobox> = {
  title: "Components/Forms/Combobox",
  component: Combobox,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Type to filter and pick an option, following the ARIA combobox pattern (built on react-aria's `ComboBox`). Unlike `Select`, the user types free text: use `Select` with `searchable` to choose among a fixed set, `Combobox` for long or remote lists and when a value outside the list can be allowed (`allowsCustomValue`). Arrows move the active option, Enter selects, Escape closes. It shares the `Field` states (`state`, `text`, `disabled`) and the `floating` / `classic` variants of `Input` and `Select`.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Combobox>;

export const Default: Story = {
  args: { label: "Country", options: OPTIONS },
};

export const Classic: Story = {
  args: { ...Default.args, variant: "classic", placeholder: "Pick a country" },
};

export const WithCustomValue: Story = {
  args: { ...Default.args, allowsCustomValue: true },
};

export const States: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 320 }}>
      <Combobox
        label="Error"
        options={OPTIONS}
        state="error"
        text="Pick a country"
      />
      <Combobox
        label="Success"
        options={OPTIONS}
        state="success"
        text="Looks good"
      />
      <Combobox label="Disabled" options={OPTIONS} disabled />
    </div>
  ),
};

export const Loading: Story = {
  args: { ...Default.args, options: [], isLoading: true },
};

export const Asynchronous: Story = {
  render: () => {
    const [options, setOptions] = useState<ComboboxOption[]>([]);
    const [loading, setLoading] = useState(false);
    return (
      <Combobox
        label="Search a country"
        options={options}
        filterOptions={false}
        isLoading={loading}
        onInputChange={(text) => {
          setLoading(true);
          setTimeout(() => {
            setOptions(
              OPTIONS.filter((o) =>
                o.label.toLowerCase().includes(text.toLowerCase()),
              ),
            );
            setLoading(false);
          }, 500);
        }}
      />
    );
  },
};
