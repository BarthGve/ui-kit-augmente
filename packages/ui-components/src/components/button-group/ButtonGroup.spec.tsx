import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from ":/components/button";
import { DropdownMenu } from ":/components/dropdown-menu";
import { CunninghamProvider } from ":/components/provider";
import { ButtonGroup, ButtonGroupProps } from "./ButtonGroup";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const setup = (props: Partial<ButtonGroupProps> = {}) =>
  render(
    <CunninghamProvider>
      <ButtonGroup aria-label="Text alignment" {...props}>
        <Button color="neutral" variant="secondary">
          Left
        </Button>
        <Button color="neutral" variant="secondary">
          Center
        </Button>
        <Button color="neutral" variant="secondary">
          Right
        </Button>
      </ButtonGroup>
    </CunninghamProvider>,
  );

describe("ButtonGroup", () => {
  it("renders adjacent buttons in a labelled group", () => {
    setup();
    const group = screen.getByRole("group", { name: "Text alignment" });
    expect(group.querySelectorAll("button")).toHaveLength(3);
    expect(group).toHaveClass("c__button-group", "c__button-group--horizontal");
  });

  it("is a plain group when no name is given", () => {
    setup({ "aria-label": undefined });
    expect(screen.getByRole("group")).not.toHaveAccessibleName();
  });

  it("can be vertical", () => {
    setup({ orientation: "vertical" });
    expect(screen.getByRole("group")).toHaveClass("c__button-group--vertical");
  });

  it("keeps the DOM order for the keyboard", async () => {
    setup();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Left" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Center" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Right" })).toHaveFocus();
  });

  it("does not change its buttons", () => {
    setup();
    expect(screen.getByRole("button", { name: "Left" })).toHaveClass(
      "c__button",
      "c__button--neutral--secondary",
    );
  });

  it("works with a split button: an action and a dropdown trigger", async () => {
    render(
      <CunninghamProvider>
        <ButtonGroup aria-label="Save">
          <Button>Save</Button>
          <DropdownMenu
            options={[{ label: "Save as", value: "as" }]}
            isOpen={false}
          >
            <Button aria-label="More save options">▾</Button>
          </DropdownMenu>
        </ButtonGroup>
      </CunninghamProvider>,
    );
    const group = screen.getByRole("group", { name: "Save" });
    expect(group.querySelectorAll("button")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "More save options" }),
    ).toBeVisible();
  });

  it("keeps a custom className", () => {
    setup({ className: "mine" });
    expect(screen.getByRole("group")).toHaveClass("c__button-group", "mine");
  });
});

describe("ButtonGroup styles", () => {
  it("rounds only the outer edges and shares the borders", () => {
    expect(scss).toMatch(/:first-child/);
    expect(scss).toMatch(/:last-child/);
    expect(scss).toMatch(/margin-inline-start:\s*calc\(\s*-1 \*/);
  });

  it("takes gap and radius from tokens, with no literal", () => {
    for (const token of ["gap", "border-radius", "border-width"]) {
      expect(scss).toContain(`--c--components--button-group--${token}`);
    }
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
