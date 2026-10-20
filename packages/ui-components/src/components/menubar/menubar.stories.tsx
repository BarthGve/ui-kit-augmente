import type { Meta, StoryObj } from "@storybook/react";
import { Menubar, MenubarMenu } from "./Menubar";

const MENUS: MenubarMenu[] = [
  {
    label: "File",
    items: [
      {
        label: "New",
        shortcut: ["Mod", "N"],
        callback: () => console.log("new"),
      },
      { label: "Open…", shortcut: ["Mod", "O"] },
      { type: "separator" },
      { label: "Export", children: [{ label: "As PDF" }, { label: "As CSV" }] },
      { label: "Delete", variant: "danger" },
    ],
  },
  {
    label: "View",
    items: [
      { label: "Show grid", isChecked: true, keepOpen: true },
      { label: "Show rulers", isChecked: false, keepOpen: true },
      { type: "separator" },
      { label: "Light", radio: true, isChecked: true, keepOpen: true },
      { label: "Dark", radio: true, isChecked: false, keepOpen: true },
    ],
  },
  {
    label: "Help",
    items: [{ label: "Documentation" }, { label: "About", isDisabled: true }],
  },
];

const meta: Meta<typeof Menubar> = {
  title: "Components/Menubar",
  component: Menubar,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Persistent bar of menus for desktop-style applications (roles `menubar`, `menu`, `menuitem`, `menuitemcheckbox`, `menuitemradio`). One tab stop; the left and right arrows move between menus, Enter, Space or ArrowDown open one, Escape closes it and gives the focus back, and while a menu is open the pointer or the horizontal arrows switch to the neighbouring one. Items are those of `DropdownMenu` (checkable entries, sub-menus) plus a `shortcut` drawn with `Kbd`. For site navigation, use the navigation menu instead.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Menubar>;

export const Default: Story = {
  args: { "aria-label": "Application", menus: MENUS },
};
