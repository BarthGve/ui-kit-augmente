import type { Meta, StoryObj } from "@storybook/react";
import { NavigationMenu } from "./NavigationMenu";

const meta: Meta<typeof NavigationMenu> = {
  title: "Components/NavigationMenu",
  component: NavigationMenu,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          'Site navigation: links, and triggers whose fly-out panels hold more links. It is a `nav` landmark (give it an `aria-label`); the link of the current page has `aria-current="page"`; the panels follow the disclosure pattern, so they are not `menu` roles and their links are reached with Tab. Click, Enter, Space or ArrowDown open a panel, Escape closes it and gives the focus back, the left and right arrows (and Home and End) move between the items. On narrow screens the list collapses behind a button. For application commands, use the `Menubar`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof NavigationMenu>;

export const Default: Story = {
  args: {
    "aria-label": "Main",
    items: [
      { id: "home", label: "Home", href: "#", current: true },
      {
        id: "products",
        label: "Products",
        content: (
          <ul>
            <li>
              <a href="#a">Product A</a>
            </li>
            <li>
              <a href="#b">Product B</a>
            </li>
            <li>
              <a href="#c">Product C</a>
            </li>
          </ul>
        ),
      },
      {
        id: "docs",
        label: "Docs",
        content: <a href="#start">Getting started</a>,
      },
      { id: "contact", label: "Contact", href: "#" },
    ],
  },
  render: (args) => (
    <div style={{ minHeight: 220 }}>
      <NavigationMenu {...args} />
    </div>
  ),
};
