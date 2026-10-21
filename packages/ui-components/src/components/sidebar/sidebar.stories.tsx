import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from ":/components/button";
import { Icon } from ":/components/icon";
import { Sidebar, SidebarGroup } from "./Sidebar";

const GROUPS: SidebarGroup[] = [
  {
    label: "Workspace",
    items: [
      {
        id: "home",
        label: "Home",
        icon: <Icon name="home" />,
        href: "#",
        current: true,
      },
      { id: "files", label: "Files", icon: <Icon name="folder" />, href: "#" },
      { id: "shared", label: "Shared", icon: <Icon name="group" />, href: "#" },
    ],
  },
  {
    items: [
      {
        id: "settings",
        label: "Settings",
        icon: <Icon name="settings" />,
        href: "#",
      },
    ],
  },
];

const meta: Meta<typeof Sidebar> = {
  title: "Components/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'Application navigation: header, grouped links, footer, and a collapsed (icons only) mode toggled by a button or by `Ctrl`/`⌘` + `B` (ignored while typing in a field). The names of the icons stay available to assistive technology and as tooltips when collapsed; the current item has `aria-current="page"`. `collapsed` / `onCollapsedChange` control the state, so the app can persist it. On narrow screens it becomes an off-canvas `Sheet` from the left (`mobileOpen`). It goes in the left panel of the `MainLayout`, which it complements rather than replaces.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  render: () => (
    <div style={{ height: 420 }}>
      <Sidebar
        aria-label="Main"
        groups={GROUPS}
        header={<strong>Acme</strong>}
        footer={<span>Ada</span>}
      />
    </div>
  ),
};

export const Collapsed: Story = {
  render: () => (
    <div style={{ height: 420 }}>
      <Sidebar
        aria-label="Main"
        groups={GROUPS}
        defaultCollapsed
        header={<strong>A</strong>}
      />
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    return (
      <div style={{ height: 420 }}>
        <Button size="small" onClick={() => setMobileOpen(true)}>
          Open (narrow screens)
        </Button>
        <Sidebar
          aria-label="Main"
          groups={GROUPS}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        />
      </div>
    );
  },
};
