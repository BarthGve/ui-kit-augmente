import type { Meta, StoryObj } from "@storybook/react";
import { Breadcrumb } from "./Breadcrumb";

const meta: Meta<typeof Breadcrumb> = {
  title: "Components/Breadcrumb",
  component: Breadcrumb,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          'Navigation trail. Rendered as a `nav` landmark: always pass an `aria-label`. The last item is the current page (`aria-current="page"`); separators are hidden from assistive technology. Above `maxItems`, the middle items collapse behind a button operable with Enter or Space.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

const SHORT = [
  { label: "Home", href: "#" },
  { label: "Documents", href: "#" },
  { label: "Report" },
];

export const Default: Story = {
  args: { "aria-label": "You are here", items: SHORT },
};

export const LongPath: Story = {
  args: {
    "aria-label": "You are here",
    maxItems: 3,
    items: [
      { label: "Home", href: "#" },
      { label: "Documents", href: "#" },
      { label: "2026", href: "#" },
      { label: "Reports", href: "#" },
      { label: "Quarterly" },
    ],
  },
};
