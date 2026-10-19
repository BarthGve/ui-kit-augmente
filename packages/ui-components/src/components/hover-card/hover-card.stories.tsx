import type { Meta, StoryObj } from "@storybook/react";
import { HoverCard } from "./HoverCard";

const meta: Meta<typeof HoverCard> = {
  title: "Components/HoverCard",
  component: HoverCard,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A card shown after a delay when its trigger is hovered or focused, and closed on blur, Escape or when the pointer leaves (after a short delay, so it can reach the card). The card is rendered next to the trigger, so Tab reaches its content in page order, and it is not announced as a dialog. **Rule**: it previews details only. Touch screens have no hover, so whatever it shows must also be reachable another way (the link behind the trigger, for instance). Placement uses the same engine as `DropdownMenu`.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof HoverCard>;

export const Default: Story = {
  render: () => (
    <div style={{ padding: "4rem" }}>
      <HoverCard
        trigger={<a href="#ada">@ada</a>}
        content={
          <>
            <strong>Ada Lovelace</strong>
            <p style={{ margin: "0.5rem 0" }}>
              Mathematician, first programmer.
            </p>
            <a href="#ada">Open profile</a>
          </>
        }
      />
    </div>
  ),
};

export const Top: Story = {
  render: () => (
    <div style={{ padding: "8rem 4rem" }}>
      <HoverCard
        placement="top"
        trigger={<button>Hover or focus me</button>}
        content="Shown above."
      />
    </div>
  ),
};
