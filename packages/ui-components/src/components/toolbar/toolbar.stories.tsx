import type { Meta, StoryObj } from "@storybook/react";
import { Button } from ":/components/button";
import { VerticalSeparator } from ":/components/separator";
import { Toolbar } from "./Toolbar";

const meta: Meta<typeof Toolbar> = {
  title: "Components/Toolbar",
  component: Toolbar,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Toolbar of actions with the `toolbar` role: always pass an `aria-label`. The whole toolbar is a single tab stop and the left and right arrow keys move between its controls (disabled ones are skipped). Controls that do not fit wrap onto a new line. Compose it with `Button` and `VerticalSeparator`.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toolbar>;

const Controls = () => (
  <>
    <Button color="neutral" variant="tertiary">
      Bold
    </Button>
    <Button color="neutral" variant="tertiary">
      Italic
    </Button>
    <VerticalSeparator withPadding={false} />
    <Button color="neutral" variant="tertiary" disabled>
      Link
    </Button>
    <Button color="neutral" variant="tertiary">
      Quote
    </Button>
  </>
);

export const Default: Story = {
  render: () => (
    <Toolbar aria-label="Formatting">
      <Controls />
    </Toolbar>
  ),
};

export const Wrapping: Story = {
  render: () => (
    <div style={{ width: 220 }}>
      <Toolbar aria-label="Formatting">
        <Controls />
      </Toolbar>
    </div>
  ),
};
