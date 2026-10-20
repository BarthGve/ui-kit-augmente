import type { Meta, StoryObj } from "@storybook/react";
import { Button } from ":/components/button";
import { Item, ItemGroup } from "./Item";

const meta: Meta<typeof Item> = {
  title: "Components/Item",
  component: Item,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A row for lists: optional media, a title, a description and an actions area. With `href` it is a link, with `onPress` a button (the interactive pattern of `Card`), otherwise static, with a visible focus ring when interactive. The actions sit beside the link or button, never inside it, so interactive elements never nest. Variants `default`, `outlined` and `muted`; sizes `medium` and `small`; `ItemGroup` makes a list of them.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Item>;

const Avatar = () => (
  <div
    style={{
      width: 40,
      height: 40,
      borderRadius: "50%",
      background: "#cfd3f1",
    }}
    aria-hidden="true"
  />
);

export const Default: Story = {
  args: {
    media: <Avatar />,
    title: "Quarterly report",
    description: "Updated today by Ada",
  },
};

export const Variants: Story = {
  render: () => (
    <ItemGroup aria-label="Variants">
      <Item
        variant="default"
        media={<Avatar />}
        title="Default"
        description="No frame"
      />
      <Item
        variant="outlined"
        media={<Avatar />}
        title="Outlined"
        description="With a border"
      />
      <Item
        variant="muted"
        media={<Avatar />}
        title="Muted"
        description="On a tinted background"
      />
    </ItemGroup>
  ),
};

export const Interactive: Story = {
  render: () => (
    <ItemGroup aria-label="Documents">
      <Item
        variant="outlined"
        media={<Avatar />}
        title="A link"
        description="Opens the document"
        href="#doc"
        actions={
          <Button size="small" variant="tertiary" color="neutral">
            More
          </Button>
        }
      />
      <Item
        variant="outlined"
        media={<Avatar />}
        title="A button"
        description="Selects the document"
        onPress={() => console.log("selected")}
        actions={
          <Button size="small" variant="tertiary" color="neutral">
            More
          </Button>
        }
      />
    </ItemGroup>
  ),
};

export const Small: Story = {
  args: { size: "small", title: "Compact row", description: "Less padding" },
};
