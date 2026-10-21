import { readFileSync } from "fs";
import { resolve } from "path";
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider";

const responsive = vi.hoisted(() => ({ isDesktop: true }));
vi.mock(":/hooks/useResponsive", () => ({
  useResponsive: () => ({
    isMobile: !responsive.isDesktop,
    isTablet: !responsive.isDesktop,
    isDesktop: responsive.isDesktop,
  }),
}));

import { Sidebar, SidebarProps } from "./Sidebar";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const GROUPS: SidebarProps["groups"] = [
  {
    label: "Workspace",
    items: [
      {
        id: "home",
        label: "Home",
        icon: <span>H</span>,
        href: "/",
        current: true,
      },
      { id: "files", label: "Files", icon: <span>F</span>, href: "/files" },
    ],
  },
  {
    items: [
      {
        id: "settings",
        label: "Settings",
        icon: <span>S</span>,
        href: "/settings",
      },
    ],
  },
];

const setup = (props: Partial<SidebarProps> = {}) =>
  render(
    <CunninghamProvider currentLocale="en-US">
      <Sidebar
        aria-label="Main"
        groups={GROUPS}
        header={<strong>Acme</strong>}
        footer={<span>Ada</span>}
        {...props}
      />
    </CunninghamProvider>,
  );

beforeEach(() => {
  responsive.isDesktop = true;
});

describe("Sidebar", () => {
  it("is a labelled navigation landmark with header, grouped navigation and footer", () => {
    const { container } = setup();
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getByText("Acme")).toBeVisible();
    expect(within(nav).getByText("Workspace")).toBeVisible();
    expect(within(nav).getByRole("link", { name: "Files" })).toHaveAttribute(
      "href",
      "/files",
    );
    expect(within(nav).getByText("Ada")).toBeVisible();
    expect(container.querySelectorAll(".c__sidebar__group")).toHaveLength(2);
  });

  it("marks the current item", () => {
    setup();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Files" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  describe("collapsing", () => {
    it("toggles with its button, which exposes the state", async () => {
      const { container } = setup();
      const toggle = screen.getByRole("button", { name: "Collapse sidebar" });
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      await userEvent.click(toggle);
      expect(container.querySelector(".c__sidebar")).toHaveClass(
        "c__sidebar--collapsed",
      );
      const expand = screen.getByRole("button", { name: "Expand sidebar" });
      expect(expand).toHaveAttribute("aria-expanded", "false");
    });

    it("keeps the item names for assistive technology when only icons show", async () => {
      setup({ defaultCollapsed: true });
      expect(screen.getByRole("link", { name: "Files" })).toBeVisible();
      expect(screen.getByText("Files")).toHaveClass("c__offscreen");
    });

    it("shows a tooltip on an icon when collapsed", async () => {
      setup({ defaultCollapsed: true });
      await userEvent.hover(screen.getByRole("link", { name: "Files" }));
      expect(await screen.findByRole("tooltip")).toHaveTextContent("Files");
    });

    it("toggles with the keyboard shortcut", async () => {
      const { container } = setup();
      await userEvent.keyboard("{Control>}b{/Control}");
      expect(container.querySelector(".c__sidebar")).toHaveClass(
        "c__sidebar--collapsed",
      );
      await userEvent.keyboard("{Meta>}b{/Meta}");
      expect(container.querySelector(".c__sidebar")).not.toHaveClass(
        "c__sidebar--collapsed",
      );
    });

    it("ignores the shortcut while typing in a field", async () => {
      const { container } = render(
        <CunninghamProvider currentLocale="en-US">
          <input aria-label="search" />
          <Sidebar aria-label="Main" groups={GROUPS} />
        </CunninghamProvider>,
      );
      await userEvent.click(screen.getByRole("textbox", { name: "search" }));
      await userEvent.keyboard("{Control>}b{/Control}");
      expect(container.querySelector(".c__sidebar")).not.toHaveClass(
        "c__sidebar--collapsed",
      );
    });

    it("is controlled through collapsed and onCollapsedChange", async () => {
      const Controlled = () => {
        const [collapsed, setCollapsed] = useState(false);
        return (
          <>
            <Sidebar
              aria-label="Main"
              groups={GROUPS}
              collapsed={collapsed}
              onCollapsedChange={setCollapsed}
            />
            <output>{String(collapsed)}</output>
          </>
        );
      };
      render(
        <CunninghamProvider currentLocale="en-US">
          <Controlled />
        </CunninghamProvider>,
      );
      await userEvent.click(
        screen.getByRole("button", { name: "Collapse sidebar" }),
      );
      expect(screen.getByRole("status")).toHaveTextContent("true");
    });

    it("stays as the parent says when it ignores the change", async () => {
      const { container } = setup({
        collapsed: false,
        onCollapsedChange: () => {},
      });
      await userEvent.click(
        screen.getByRole("button", { name: "Collapse sidebar" }),
      );
      expect(container.querySelector(".c__sidebar")).not.toHaveClass(
        "c__sidebar--collapsed",
      );
    });
  });

  describe("on narrow screens", () => {
    beforeEach(() => {
      responsive.isDesktop = false;
    });

    it("is an off-canvas sheet, closed until asked", async () => {
      setup();
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("opens as a sheet from the left with its navigation, and closes", async () => {
      const onMobileOpenChange = vi.fn();
      setup({ mobileOpen: true, onMobileOpenChange });
      const dialog = await screen.findByRole("dialog");
      expect(dialog).toHaveClass("c__sheet--left");
      expect(
        within(dialog).getByRole("navigation", { name: "Main" }),
      ).toBeVisible();
      expect(within(dialog).getByRole("link", { name: "Files" })).toBeVisible();
      await userEvent.keyboard("{Escape}");
      expect(onMobileOpenChange).toHaveBeenCalledWith(false);
    });

    it("is never in icons-only mode", async () => {
      setup({ mobileOpen: true, defaultCollapsed: true });
      const dialog = await screen.findByRole("dialog");
      expect(dialog.querySelector(".c__sidebar--collapsed")).toBeNull();
      expect(within(dialog).getByText("Files")).not.toHaveClass("c__offscreen");
    });
  });

  it("takes widths, colours and transitions from tokens, and respects reduced motion", () => {
    for (const token of ["width", "width--collapsed", "background-color"]) {
      expect(scss).toContain(`--c--components--sidebar--${token}`);
    }
    expect(scss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?transition:\s*none/,
    );
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
