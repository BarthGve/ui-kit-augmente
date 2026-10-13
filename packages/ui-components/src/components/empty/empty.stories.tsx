import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../button";
import { Icon } from "../icon";
import { Empty } from "./Empty";

const meta = {
  title: "Components/Empty",
  component: Empty,
  parameters: { layout: "padded" },
  args: { title: "No projects yet" },
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    media: <Icon name="folder_open" aria-hidden="true" />,
    description:
      "Projects you create or are invited to will appear here. Start with a new one.",
    actions: <Button>New project</Button>,
  },
};

export const TitleOnly: Story = {};

export const WithActions: Story = {
  args: {
    title: "No results",
    media: <Icon name="search_off" aria-hidden="true" />,
    description: "No document matches your filters.",
    actions: (
      <>
        <Button variant="secondary">Reset filters</Button>
        <Button>New document</Button>
      </>
    ),
  },
};

export const HeadingLevels: Story = {
  render: (args) => (
    <>
      {([1, 2, 3, 4, 5, 6] as const).map((level) => (
        <Empty
          key={level}
          {...args}
          headingLevel={level}
          title={`Heading level ${level}`}
          description={`The title is an h${level}.`}
        />
      ))}
    </>
  ),
};
