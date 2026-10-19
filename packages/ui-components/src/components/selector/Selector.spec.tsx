import { readFileSync } from "fs";
import { resolve } from "path";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Selector, SelectorOption, SelectorProps } from "./Selector";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const OPTIONS: SelectorOption[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const setup = (props: Partial<SelectorProps> = {}) =>
  render(<Selector aria-label="Period" options={OPTIONS} {...props} />);

const radio = (name: string) => screen.getByRole("radio", { name });

describe("Selector", () => {
  it("shows its options side by side in a labelled group", () => {
    setup();
    expect(screen.getByRole("radiogroup", { name: "Period" })).toBeVisible();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("selects an option on click and calls onChange with its value", async () => {
    const onChange = vi.fn();
    setup({ onChange });
    await userEvent.click(screen.getByText("Week"));
    expect(radio("Week")).toBeChecked();
    expect(onChange).toHaveBeenCalledWith("week");
  });

  it("exposes the selected option to assistive technology", () => {
    setup({ defaultValue: "month" });
    expect(radio("Month")).toBeChecked();
    expect(radio("Day")).not.toBeChecked();
  });

  it("is controlled by value", async () => {
    const Controlled = () => {
      const [value, setValue] = useState("day");
      return (
        <>
          <Selector
            aria-label="Period"
            options={OPTIONS}
            value={value}
            onChange={setValue}
          />
          <output>{value}</output>
        </>
      );
    };
    render(<Controlled />);
    await userEvent.click(screen.getByText("Month"));
    expect(screen.getByRole("status")).toHaveTextContent("month");
    expect(radio("Month")).toBeChecked();
  });

  it("does not change on its own when controlled and the parent ignores onChange", async () => {
    setup({ value: "day", onChange: () => {} });
    await userEvent.click(screen.getByText("Week"));
    expect(radio("Day")).toBeChecked();
  });

  it("moves the selection with the arrow keys", async () => {
    const onChange = vi.fn();
    setup({ defaultValue: "day", onChange });
    radio("Day").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(radio("Week")).toBeChecked();
    expect(radio("Week")).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(radio("Day")).toBeChecked();
    expect(onChange).toHaveBeenNthCalledWith(1, "week");
    expect(onChange).toHaveBeenNthCalledWith(2, "day");
  });

  it("has a single tab stop", async () => {
    setup({ defaultValue: "week" });
    await userEvent.tab();
    expect(radio("Week")).toHaveFocus();
    await userEvent.tab();
    expect(document.body).toHaveFocus();
  });

  it("cannot select a disabled option", async () => {
    const onChange = vi.fn();
    setup({
      defaultValue: "day",
      onChange,
      options: [OPTIONS[0], { ...OPTIONS[1], disabled: true }, OPTIONS[2]],
    });
    expect(radio("Week")).toBeDisabled();
    await userEvent.click(screen.getByText("Week"));
    expect(onChange).not.toHaveBeenCalled();
    radio("Day").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(radio("Month")).toBeChecked();
  });

  it("disables the whole selector", () => {
    setup({ disabled: true });
    screen.getAllByRole("radio").forEach((r) => expect(r).toBeDisabled());
  });

  it("supports the small size and a custom className", () => {
    const { container } = setup({ size: "small", className: "mine" });
    expect(container.firstElementChild).toHaveClass(
      "c__selector",
      "c__selector--small",
      "mine",
    );
  });

  it("groups its radios under one name", () => {
    setup({ name: "period" });
    screen
      .getAllByRole("radio")
      .forEach((r) => expect(r).toHaveAttribute("name", "period"));
  });

  it("holds no literal colour or length in its stylesheet", () => {
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
