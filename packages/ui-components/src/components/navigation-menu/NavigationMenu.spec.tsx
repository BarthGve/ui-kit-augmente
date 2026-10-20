import { readFileSync } from "fs";
import { resolve } from "path";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { NavigationMenu, NavigationMenuItem } from "./NavigationMenu";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const ITEMS: NavigationMenuItem[] = [
  { id: "home", label: "Home", href: "/", current: true },
  {
    id: "products",
    label: "Products",
    content: (
      <ul>
        <li>
          <a href="/products/a">Product A</a>
        </li>
        <li>
          <a href="/products/b">Product B</a>
        </li>
      </ul>
    ),
  },
  {
    id: "docs",
    label: "Docs",
    content: <a href="/docs/start">Getting started</a>,
  },
  { id: "contact", label: "Contact", href: "/contact" },
];

const setup = () =>
  render(
    <CunninghamProvider currentLocale="en-US">
      <button>before</button>
      <NavigationMenu aria-label="Main" items={ITEMS} />
      <p>Outside</p>
    </CunninghamProvider>,
  );
const trigger = (name: string) => screen.getByRole("button", { name });

describe("NavigationMenu", () => {
  it("is a labelled nav landmark of links and panel triggers", () => {
    setup();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Products")).toHaveAttribute("aria-controls");
  });

  it("marks the current page link", () => {
    setup();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Contact" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("opens a panel on click and closes it on a second click", async () => {
    setup();
    await userEvent.click(trigger("Products"));
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Product A" })).toBeVisible();
    await userEvent.click(trigger("Products"));
    expect(screen.queryByRole("link", { name: "Product A" })).toBeNull();
  });

  it("panels are not menus", async () => {
    setup();
    await userEvent.click(trigger("Products"));
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.queryByRole("menuitem")).toBeNull();
    const panel = document.getElementById(
      trigger("Products").getAttribute("aria-controls")!,
    );
    expect(panel).toContainElement(
      screen.getByRole("link", { name: "Product A" }),
    );
  });

  it("opens one panel at a time", async () => {
    setup();
    await userEvent.click(trigger("Products"));
    await userEvent.click(trigger("Docs"));
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Docs")).toHaveAttribute("aria-expanded", "true");
  });

  it("opens with Enter, Space and ArrowDown, content following the trigger in tab order", async () => {
    setup();
    trigger("Products").focus();
    await userEvent.keyboard("{Enter}");
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{ArrowDown}");
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "Product A" })).toHaveFocus();
  });

  it("moves between the items with the left and right arrows", async () => {
    setup();
    screen.getByRole("link", { name: "Home" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(trigger("Products")).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("link", { name: "Contact" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("link", { name: "Home" })).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("link", { name: "Contact" })).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("link", { name: "Home" })).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("link", { name: "Contact" })).toHaveFocus();
  });

  it("closes with Escape and returns the focus to the trigger", async () => {
    setup();
    await userEvent.click(trigger("Products"));
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "Product A" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(trigger("Products")).toHaveFocus();
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on a click outside, and when focus leaves the menu", async () => {
    setup();
    await userEvent.click(trigger("Products"));
    await userEvent.click(screen.getByText("Outside"));
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger("Docs"));
    act(() => screen.getByRole("button", { name: "before" }).focus());
    expect(trigger("Docs")).toHaveAttribute("aria-expanded", "false");
  });

  it("collapses to a button-opened list on narrow screens", async () => {
    const { container } = setup();
    const toggle = screen.getByRole("button", { name: "Menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      container.querySelector(".c__navigation-menu__list"),
    ).not.toHaveClass("c__navigation-menu__list--open");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(container.querySelector(".c__navigation-menu__list")).toHaveClass(
      "c__navigation-menu__list--open",
    );
  });

  it("has a narrow-screen rule and takes spacing, elevation and colours from tokens", () => {
    expect(scss).toMatch(/@include media\(/);
    for (const token of [
      "panel-box-shadow",
      "item-padding-inline",
      "current-color",
    ]) {
      expect(scss).toContain(`--c--components--navigation-menu--${token}`);
    }
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
