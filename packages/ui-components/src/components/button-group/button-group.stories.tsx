import type { Meta, StoryObj } from "@storybook/react";
import { Button } from ":/components/button";
import { DropdownMenu, useDropdownMenu } from ":/components/dropdown-menu";
import { ButtonGroup } from "./ButtonGroup";

const meta: Meta<typeof ButtonGroup> = {
  title: "Components/ButtonGroup",
  component: ButtonGroup,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Joins adjacent `Button`s into one control: shared borders and a radius only on the outer edges, horizontal or vertical. It only wraps the buttons (`Button` is untouched), so every variant and size works, and so does a split button (an action next to a `DropdownMenu` trigger). Keyboard order follows the DOM order. Give it an `aria-label` to name the group.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

export const Default: Story = {
  render: () => (
    <ButtonGroup aria-label="Text alignment">
      <Button color="neutral" variant="bordered">
        Left
      </Button>
      <Button color="neutral" variant="bordered">
        Center
      </Button>
      <Button color="neutral" variant="bordered">
        Right
      </Button>
    </ButtonGroup>
  ),
};

export const Vertical: Story = {
  render: () => (
    <ButtonGroup aria-label="Zoom" orientation="vertical">
      <Button color="neutral" variant="bordered" size="small">
        +
      </Button>
      <Button color="neutral" variant="bordered" size="small">
        −
      </Button>
    </ButtonGroup>
  ),
};

export const Primary: Story = {
  render: () => (
    <ButtonGroup aria-label="Steps">
      <Button>Back</Button>
      <Button>Next</Button>
    </ButtonGroup>
  ),
};

export const SplitButton: Story = {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  render: () => {
    const { isOpen, setIsOpen } = useDropdownMenu();
    return (
      <ButtonGroup aria-label="Save">
        <Button>Save</Button>
        <DropdownMenu
          options={[
            { label: "Save as…", value: "as" },
            { label: "Save a copy", value: "copy" },
          ]}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
        >
          <Button
            aria-label="More save options"
            onClick={() => setIsOpen(!isOpen)}
          >
            ▾
          </Button>
        </DropdownMenu>
      </ButtonGroup>
    );
  },
};
