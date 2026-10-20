import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Item, ItemGroup } from "./Item";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

describe("Item", () => {
  it("renders media, title, description and actions", () => {
    const { container } = render(
      <Item
        media={<span>icon</span>}
        title="Report"
        description="Updated today"
        actions={<button>More</button>}
      />,
    );
    expect(container.querySelector(".c__item__media")).toHaveTextContent(
      "icon",
    );
    expect(container.querySelector(".c__item__title")).toHaveTextContent(
      "Report",
    );
    expect(container.querySelector(".c__item__description")).toHaveTextContent(
      "Updated today",
    );
    expect(screen.getByRole("button", { name: "More" })).toBeVisible();
  });

  it("leaves out the parts that are not given", () => {
    const { container } = render(<Item title="Only a title" />);
    expect(container.querySelector(".c__item__media")).toBeNull();
    expect(container.querySelector(".c__item__description")).toBeNull();
    expect(container.querySelector(".c__item__actions")).toBeNull();
  });

  it.each(["default", "outlined", "muted"] as const)(
    "has the %s variant",
    (variant) => {
      const { container } = render(<Item title="x" variant={variant} />);
      expect(container.firstElementChild).toHaveClass(`c__item--${variant}`);
    },
  );

  it("has sizes", () => {
    const { container, rerender } = render(<Item title="x" />);
    expect(container.firstElementChild).toHaveClass("c__item--medium");
    rerender(<Item title="x" size="small" />);
    expect(container.firstElementChild).toHaveClass("c__item--small");
  });

  it("is static, with no interactive role, by default", () => {
    render(<Item title="Plain" />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders as a link with href", () => {
    render(<Item title="Open" href="/docs/1" description="Doc" />);
    const link = screen.getByRole("link", { name: /Open/ });
    expect(link).toHaveAttribute("href", "/docs/1");
    expect(link).toHaveTextContent("Doc");
  });

  it("renders as a button with onPress, operable with click, Enter and Space", async () => {
    const onPress = vi.fn();
    render(<Item title="Select me" onPress={onPress} />);
    const button = screen.getByRole("button", { name: /Select me/ });
    await userEvent.click(button);
    expect(onPress).toHaveBeenCalledTimes(1);
    button.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it("keeps the actions out of the link or button, so interactive elements never nest", async () => {
    const onMore = vi.fn();
    render(
      <Item
        title="Open"
        href="/x"
        actions={<button onClick={onMore}>More</button>}
      />,
    );
    const link = screen.getByRole("link", { name: /Open/ });
    const more = screen.getByRole("button", { name: "More" });
    expect(link).not.toContainElement(more);
    await userEvent.click(more);
    expect(onMore).toHaveBeenCalledTimes(1);
  });

  it("has a visible focus ring from tokens, and no literal", () => {
    expect(scss).toMatch(/focus-visible/);
    for (const token of [
      "focus-ring-color",
      "padding",
      "outlined-border-color",
      "muted-background-color",
    ]) {
      expect(scss).toContain(`--c--components--item--${token}`);
    }
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});

describe("ItemGroup", () => {
  it("groups items into a list", () => {
    render(
      <ItemGroup aria-label="Files">
        <Item title="One" />
        <Item title="Two" href="/two" />
      </ItemGroup>,
    );
    const list = screen.getByRole("list", { name: "Files" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
  });

  it("keeps a standalone item out of a list", () => {
    render(<Item title="Alone" />);
    expect(screen.queryByRole("listitem")).toBeNull();
  });
});
