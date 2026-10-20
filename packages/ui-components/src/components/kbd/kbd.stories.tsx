import type { Meta, StoryObj } from "@storybook/react";
import { Kbd, KbdGroup, ModKbd } from "./Kbd";

const meta: Meta<typeof Kbd> = {
  title: "Components/Kbd",
  component: Kbd,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          'A keyboard key, as a `kbd` element. `KbdGroup` joins the keys of a shortcut with a decorative separator; `ModKbd` is the platform\'s main modifier, ⌘ (named "Command" for screen readers) on macOS and Ctrl elsewhere, overridable with `platform`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Kbd>;

export const Default: Story = { args: { children: "Esc" } };

export const Shortcut: Story = {
  render: () => (
    <KbdGroup>
      <ModKbd />
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
};

export const Platforms: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <KbdGroup>
        <ModKbd platform="mac" />
        <Kbd>S</Kbd>
      </KbdGroup>
      <KbdGroup>
        <ModKbd platform="other" />
        <Kbd>S</Kbd>
      </KbdGroup>
    </div>
  ),
};

export const Sequence: Story = {
  render: () => (
    <KbdGroup separator="then">
      <Kbd>G</Kbd>
      <Kbd>H</Kbd>
    </KbdGroup>
  ),
};
