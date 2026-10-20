import { readFileSync } from "fs";
import { resolve } from "path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { Menubar, MenubarMenu } from "./Menubar";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const build = (spies: Record<string, () => void> = {}): MenubarMenu[] => [
  {
    label: "File",
    items: [
      { label: "New", callback: spies.new, shortcut: ["Mod", "N"] },
      { label: "Open", callback: spies.open },
      { type: "separator" },
      {
        label: "Export",
        children: [
          { label: "As PDF", callback: spies.pdf },
          { label: "As CSV" },
        ],
      },
    ],
  },
  {
    label: "View",
    items: [
      { label: "Show grid", isChecked: true, keepOpen: true },
      { label: "Dark", radio: true, isChecked: false },
    ],
  },
  { label: "Help", items: [{ label: "About" }] },
];

const setup = (spies: Record<string, () => void> = {}) =>
  render(
    <CunninghamProvider currentLocale="en-US">
      <button>before</button>
      <Menubar aria-label="Application" menus={build(spies)} />
      <button>after</button>
    </CunninghamProvider>,
  );
const top = (name: string) => screen.getByRole("menuitem", { name });

describe("Menubar", () => {
  it("renders top-level menus in a labelled menubar", () => {
    setup();
    expect(screen.getByRole("menubar", { name: "Application" })).toBeVisible();
    ["File", "View", "Help"].forEach((n) => {
      expect(top(n)).toHaveAttribute("aria-haspopup", "menu");
      expect(top(n)).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("is a single tab stop (roving tabindex)", async () => {
    setup();
    screen.getByRole("button", { name: "before" }).focus();
    await userEvent.tab();
    expect(top("File")).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
  });

  it("moves between menus with the left and right arrows", async () => {
    setup();
    top("File").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(top("View")).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(top("File")).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(top("Help")).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(top("File")).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(top("Help")).toHaveFocus();
  });

  it.each([["Enter"], [" "], ["ArrowDown"]])(
    "opens the menu with %s",
    async (key) => {
      setup();
      top("File").focus();
      await userEvent.keyboard(key === " " ? " " : `{${key}}`);
      expect(top("File")).toHaveAttribute("aria-expanded", "true");
      const menu = await screen.findByRole("menu");
      expect(within(menu).getAllByRole("menuitem")[0]).toHaveFocus();
    },
  );

  it("closes with Escape and returns the focus to the menu button", async () => {
    setup();
    top("File").focus();
    await userEvent.keyboard("{Enter}");
    await screen.findByRole("menu");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(top("File")).toHaveFocus();
    expect(top("File")).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the next menu with the right arrow while one is open", async () => {
    setup();
    top("File").focus();
    await userEvent.keyboard("{Enter}");
    await screen.findByRole("menu");
    await userEvent.keyboard("{ArrowRight}");
    expect(top("View")).toHaveAttribute("aria-expanded", "true");
    expect(top("File")).toHaveAttribute("aria-expanded", "false");
    expect(
      within(await screen.findByRole("menu")).getByRole("menuitemcheckbox", {
        name: "Show grid",
      }),
    ).toBeVisible();
    await userEvent.keyboard("{ArrowLeft}");
    expect(top("File")).toHaveAttribute("aria-expanded", "true");
  });

  it("switches menus on hover while one is open, and not otherwise", async () => {
    setup();
    fireEvent.pointerEnter(top("View"));
    expect(top("View")).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(top("File"));
    await screen.findByRole("menu");
    fireEvent.pointerEnter(top("Help"));
    expect(top("Help")).toHaveAttribute("aria-expanded", "true");
    expect(top("File")).toHaveAttribute("aria-expanded", "false");
  });

  it("runs an item's callback and closes the menu", async () => {
    const open = vi.fn();
    setup({ open });
    await userEvent.click(top("File"));
    await userEvent.click(
      await screen.findByRole("menuitem", { name: "Open" }),
    );
    expect(open).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("exposes checkable items as menuitemcheckbox and menuitemradio", async () => {
    setup();
    await userEvent.click(top("View"));
    const grid = await screen.findByRole("menuitemcheckbox", {
      name: "Show grid",
    });
    expect(grid).toHaveAttribute("aria-checked", "true");
    const dark = screen.getByRole("menuitemradio", { name: "Dark" });
    expect(dark).toHaveAttribute("aria-checked", "false");
  });

  it("shows shortcuts with Kbd", async () => {
    setup();
    await userEvent.click(top("File"));
    const item = await screen.findByRole("menuitem", { name: /New/ });
    expect(item.querySelectorAll("kbd")).toHaveLength(2);
    expect(item.querySelector(".c__kbd-group")).not.toBeNull();
  });

  it("supports sub-menus", async () => {
    const pdf = vi.fn();
    setup({ pdf });
    await userEvent.click(top("File"));
    const exportItem = await screen.findByRole("menuitem", { name: "Export" });
    expect(exportItem).toHaveAttribute("aria-haspopup", "menu");
    exportItem.focus();
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.click(
      await screen.findByRole("menuitem", { name: "As PDF" }),
    );
    expect(pdf).toHaveBeenCalledTimes(1);
  });

  it("takes colours, spacing and elevation from tokens, with no literal", () => {
    for (const token of [
      "background-color",
      "item-padding-block",
      "box-shadow",
    ]) {
      expect(scss).toContain(`--c--components--menubar--${token}`);
    }
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
