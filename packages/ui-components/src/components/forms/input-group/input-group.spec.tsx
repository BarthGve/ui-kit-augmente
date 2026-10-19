import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from ":/components/button";
import { CunninghamProvider } from ":/components/provider";
import { InputGroup, InputGroupProps } from "./index";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "_index.scss"), "utf8");

const setup = (props: Partial<InputGroupProps> = {}) => {
  const view = render(
    <CunninghamProvider>
      <InputGroup label="Website" {...props} />
    </CunninghamProvider>,
  );
  return {
    ...view,
    input: () => screen.getByRole("textbox", { name: "Website" }),
  };
};

describe("InputGroup", () => {
  it("wraps a labelled text field in one group", () => {
    const { container, input } = setup();
    expect(input()).toBeVisible();
    expect(container.querySelectorAll(".c__input-group")).toHaveLength(1);
  });

  it("wraps a textarea when multiline", () => {
    setup({ multiline: true });
    const field = screen.getByRole("textbox", { name: "Website" });
    expect(field.tagName).toBe("TEXTAREA");
  });

  it("shows leading and trailing text, icon addons", () => {
    const { container } = setup({
      leading: "https://",
      trailing: <span>.com</span>,
    });
    expect(
      container.querySelector(".c__input-group__addon--leading"),
    ).toHaveTextContent("https://");
    expect(
      container.querySelector(".c__input-group__addon--trailing"),
    ).toHaveTextContent(".com");
  });

  it("hides decorative addons from assistive technology", () => {
    const { container } = setup({ leading: "https://", trailing: "€" });
    container
      .querySelectorAll(".c__input-group__addon")
      .forEach((addon) => expect(addon).toHaveAttribute("aria-hidden", "true"));
  });

  it("keeps an interactive addon (a button) reachable and operable", async () => {
    const onClick = vi.fn();
    setup({
      trailingAction: (
        <Button size="small" onClick={onClick}>
          Copy
        </Button>
      ),
    });
    const button = screen.getByRole("button", { name: "Copy" });
    expect(button.closest(".c__input-group__addon")).not.toHaveAttribute(
      "aria-hidden",
    );
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("focuses the field when an addon text is clicked", async () => {
    const { input, container } = setup({ leading: "https://" });
    await userEvent.click(
      container.querySelector(".c__input-group__addon--leading") as HTMLElement,
    );
    expect(input()).toHaveFocus();
  });

  it("passes the usual input props to the field", async () => {
    const onChange = vi.fn();
    const { input } = setup({ placeholder: "example", onChange, name: "site" });
    expect(input()).toHaveAttribute("placeholder", "example");
    expect(input()).toHaveAttribute("name", "site");
    await userEvent.type(input(), "ab");
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(input()).toHaveValue("ab");
  });

  describe("field states", () => {
    it("propagates the error state to the whole group", () => {
      const { container, input } = setup({
        state: "error",
        text: "Not a valid URL",
      });
      expect(container.querySelector(".c__field--error")).not.toBeNull();
      expect(container.querySelector(".c__input-group--error")).not.toBeNull();
      expect(input()).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByText("Not a valid URL")).toBeVisible();
    });

    it("propagates the success state", () => {
      const { container } = setup({ state: "success" });
      expect(
        container.querySelector(".c__input-group--success"),
      ).not.toBeNull();
    });

    it("propagates the disabled state", () => {
      const { container, input } = setup({ disabled: true });
      expect(input()).toBeDisabled();
      expect(
        container.querySelector(".c__input-group--disabled"),
      ).not.toBeNull();
      expect(container.querySelector(".c__field--disabled")).not.toBeNull();
    });
  });

  describe("styles", () => {
    it("draws one border and one focus ring for the whole group", () => {
      expect(scss).toMatch(/:focus-within/);
    });

    it("takes spacing and colours from tokens, with no literal", () => {
      for (const token of ["addon-color", "addon-padding", "border-color"]) {
        expect(scss).toContain(`--c--components--input-group--${token}`);
      }
      expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
        /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
      );
    });
  });
});
