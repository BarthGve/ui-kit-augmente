import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { Breadcrumb, BreadcrumbItem } from "./Breadcrumb";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const ITEMS: BreadcrumbItem[] = [
  { label: "Home", href: "/" },
  { label: "Docs", href: "/docs" },
  { label: "Guides", href: "/docs/guides" },
  { label: "Setup", href: "/docs/guides/setup" },
  { label: "Install" },
];

const renderBreadcrumb = (
  items = ITEMS,
  props: Partial<Parameters<typeof Breadcrumb>[0]> = {},
) =>
  render(
    <CunninghamProvider>
      <Breadcrumb aria-label="You are here" items={items} {...props} />
    </CunninghamProvider>,
  );

describe("Breadcrumb", () => {
  it("is a navigation landmark with an accessible label", () => {
    renderBreadcrumb(ITEMS.slice(0, 3));
    expect(
      screen.getByRole("navigation", { name: "You are here" }),
    ).toBeVisible();
  });

  it("renders the path as links", () => {
    renderBreadcrumb(ITEMS.slice(0, 3));
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "href",
      "/docs",
    );
  });

  it("marks the last item as the current page", () => {
    renderBreadcrumb(ITEMS.slice(0, 3));
    const current = screen.getByText("Guides");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current.closest("a")).toHaveAttribute("href", "/docs/guides");
  });

  it("keeps a last item without href as plain text", () => {
    renderBreadcrumb(ITEMS.slice(3));
    expect(screen.getByText("Install")).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Install" })).toBeNull();
  });

  it("hides the separators from assistive technology", () => {
    const { container } = renderBreadcrumb(ITEMS.slice(0, 3));
    const separators = container.querySelectorAll(".c__breadcrumb__separator");
    expect(separators).toHaveLength(2);
    separators.forEach((s) => expect(s).toHaveAttribute("aria-hidden", "true"));
  });

  it("calls onClick of an item", async () => {
    let clicked = 0;
    renderBreadcrumb([
      { label: "Home", href: "#", onClick: () => clicked++ },
      { label: "Here" },
    ]);
    await userEvent.click(screen.getByRole("link", { name: "Home" }));
    expect(clicked).toBe(1);
  });

  describe("long path", () => {
    it("collapses the middle items behind a button", () => {
      renderBreadcrumb(ITEMS, { maxItems: 3 });
      expect(screen.getByRole("link", { name: "Home" })).toBeVisible();
      expect(screen.queryByRole("link", { name: "Docs" })).toBeNull();
      expect(screen.queryByRole("link", { name: "Guides" })).toBeNull();
      expect(screen.getByRole("link", { name: "Setup" })).toBeVisible();
      expect(screen.getByText("Install")).toBeVisible();
      expect(
        screen.getByRole("button", { name: "Show full path" }),
      ).toHaveAttribute("aria-expanded", "false");
    });

    it("does not collapse a path within maxItems", () => {
      renderBreadcrumb(ITEMS, { maxItems: 5 });
      expect(screen.queryByRole("button")).toBeNull();
    });

    it("expands with the keyboard and moves nothing out of order", async () => {
      renderBreadcrumb(ITEMS, { maxItems: 3 });
      await userEvent.tab(); // Home
      await userEvent.tab(); // expand button
      expect(
        screen.getByRole("button", { name: "Show full path" }),
      ).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      expect(
        screen.queryByRole("button", { name: "Show full path" }),
      ).toBeNull();
      expect(screen.getAllByRole("link").map((a) => a.textContent)).toEqual([
        "Home",
        "Docs",
        "Guides",
        "Setup",
      ]);
    });

    it("also expands with Space", async () => {
      renderBreadcrumb(ITEMS, { maxItems: 3 });
      screen.getByRole("button", { name: "Show full path" }).focus();
      await userEvent.keyboard(" ");
      expect(screen.getByRole("link", { name: "Docs" })).toBeVisible();
    });
  });

  it("holds no literal colour or length in its stylesheet", () => {
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
