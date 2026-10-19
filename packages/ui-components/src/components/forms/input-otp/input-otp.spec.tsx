import { readFileSync } from "fs";
import { resolve } from "path";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { InputOTP, InputOTPProps } from "./index";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "_index.scss"), "utf8");

const setup = (props: Partial<InputOTPProps> = {}) => {
  const view = render(
    <CunninghamProvider currentLocale="en-US">
      <InputOTP label="Verification code" {...props} />
    </CunninghamProvider>,
  );
  const input = () =>
    screen.getByRole("textbox", {
      name: "Verification code",
    }) as HTMLInputElement;
  const slots = () =>
    Array.from(view.container.querySelectorAll(".c__input-otp__slot")).map(
      (s) => s.textContent,
    );
  return { ...view, input, slots };
};

describe("InputOTP", () => {
  it("renders `length` slots and one logical field", () => {
    const { input, slots } = setup({ length: 6 });
    expect(slots()).toEqual(["", "", "", "", "", ""]);
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(input()).toHaveAttribute("autocomplete", "one-time-code");
    expect(input()).toHaveAttribute("maxlength", "6");
    expect(input()).toHaveAttribute("inputmode", "numeric");
  });

  it("defaults to six slots", () => {
    const { slots } = setup();
    expect(slots()).toHaveLength(6);
  });

  it("hides the slots from assistive technology", () => {
    const { container } = setup();
    expect(container.querySelector(".c__input-otp__slots")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("fills the slots while typing and marks the active one", async () => {
    const { input, slots, container } = setup();
    await userEvent.type(input(), "123");
    expect(slots()).toEqual(["1", "2", "3", "", "", ""]);
    const active = container.querySelector(".c__input-otp__slot--active");
    expect(active).toBe(container.querySelectorAll(".c__input-otp__slot")[3]);
  });

  it("goes back with Backspace", async () => {
    const { input, slots } = setup();
    await userEvent.type(input(), "123");
    await userEvent.keyboard("{Backspace}");
    expect(slots()).toEqual(["1", "2", "", "", "", ""]);
  });

  it("accepts only digits by default", async () => {
    const { input, slots } = setup();
    await userEvent.type(input(), "1a2-3");
    expect(slots()).toEqual(["1", "2", "3", "", "", ""]);
  });

  it("accepts any character with type text", async () => {
    const { input, slots } = setup({ type: "text" });
    await userEvent.type(input(), "a1B");
    expect(slots()).toEqual(["a", "1", "B", "", "", ""]);
    expect(input()).toHaveAttribute("inputmode", "text");
  });

  it("fills every slot when pasting a code, ignoring what is not a digit", async () => {
    const { input, slots } = setup();
    await userEvent.click(input());
    await userEvent.paste("12-34 56");
    expect(slots()).toEqual(["1", "2", "3", "4", "5", "6"]);
  });

  it("truncates a paste that is too long", async () => {
    const { input, slots } = setup({ length: 4 });
    await userEvent.click(input());
    await userEvent.paste("123456789");
    expect(slots()).toEqual(["1", "2", "3", "4"]);
  });

  it("fires onComplete once when all slots are filled", async () => {
    const onComplete = vi.fn();
    const onChange = vi.fn();
    const { input } = setup({ length: 4, onComplete, onChange });
    await userEvent.type(input(), "123");
    expect(onComplete).not.toHaveBeenCalled();
    await userEvent.type(input(), "4");
    expect(onComplete).toHaveBeenCalledExactlyOnceWith("1234");
    await userEvent.type(input(), "5");
    expect(onComplete).toHaveBeenCalledTimes(1);
    // Completed again after a correction.
    await userEvent.keyboard("{Backspace}4");
    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith("1234");
  });

  it("fires onComplete once for a paste", async () => {
    const onComplete = vi.fn();
    const { input } = setup({ onComplete });
    await userEvent.click(input());
    await userEvent.paste("123456");
    expect(onComplete).toHaveBeenCalledExactlyOnceWith("123456");
  });

  it("is controlled by value", async () => {
    const Controlled = () => {
      const [value, setValue] = useState("12");
      return (
        <CunninghamProvider currentLocale="en-US">
          <InputOTP
            label="Verification code"
            value={value}
            onChange={setValue}
            length={4}
          />
          <output>{value}</output>
        </CunninghamProvider>
      );
    };
    render(<Controlled />);
    const input = screen.getByRole("textbox", { name: "Verification code" });
    expect(input).toHaveValue("12");
    await userEvent.type(input, "34");
    expect(screen.getByRole("status")).toHaveTextContent("1234");
  });

  it("renders groups with a separator between them", () => {
    const { container } = setup({ length: 6, groups: [3, 3] });
    expect(container.querySelectorAll(".c__input-otp__group")).toHaveLength(2);
    expect(container.querySelectorAll(".c__input-otp__separator")).toHaveLength(
      1,
    );
    expect(container.querySelectorAll(".c__input-otp__slot")).toHaveLength(6);
  });

  it("works with Field: label, error text and error state", () => {
    const { container, input } = setup({ state: "error", text: "Wrong code" });
    expect(container.querySelector(".c__field--error")).not.toBeNull();
    expect(screen.getByText("Wrong code")).toBeVisible();
    expect(input()).toHaveAttribute("aria-invalid", "true");
    expect(container.querySelector(".c__input-otp--error")).not.toBeNull();
  });

  it("can be disabled", async () => {
    const { input, container } = setup({ disabled: true });
    expect(input()).toBeDisabled();
    expect(container.querySelector(".c__field--disabled")).not.toBeNull();
  });

  it("holds no literal colour or length in its stylesheet and uses tokens", () => {
    expect(scss).toContain("--c--components--input-otp--slot-size");
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
