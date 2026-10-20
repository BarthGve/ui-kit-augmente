import { readFileSync } from "fs";
import { resolve } from "path";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Slider, SliderProps } from "./Slider";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const setup = (props: Partial<SliderProps> = {}) =>
  render(
    <Slider
      aria-label="Volume"
      min={0}
      max={100}
      step={5}
      defaultValue={50}
      {...props}
    />,
  );

const thumb = (name = "Volume") =>
  screen.getByRole("slider", {
    name: name === "Volume" ? name : new RegExp(name),
  });

describe("Slider (single value)", () => {
  // The thumb is a native range input: its min, max and value are exposed as
  // the slider's value range, and react-aria adds the spoken value text.
  it("exposes the value to assistive technology", () => {
    setup();
    expect(thumb()).toHaveAttribute("min", "0");
    expect(thumb()).toHaveAttribute("max", "100");
    expect(thumb()).toHaveValue("50");
    expect(thumb()).toHaveAttribute("aria-valuetext", "50");
  });

  it("changes by step with the arrow keys", async () => {
    const onChange = vi.fn();
    setup({ onChange });
    thumb().focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(thumb()).toHaveValue("55");
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(thumb()).toHaveValue("45");
    expect(onChange).toHaveBeenLastCalledWith(45);
    await userEvent.keyboard("{ArrowUp}");
    expect(thumb()).toHaveValue("50");
    await userEvent.keyboard("{ArrowDown}");
    expect(thumb()).toHaveValue("45");
  });

  it("jumps to the bounds with Home and End", async () => {
    setup();
    thumb().focus();
    await userEvent.keyboard("{End}");
    expect(thumb()).toHaveValue("100");
    await userEvent.keyboard("{Home}");
    expect(thumb()).toHaveValue("0");
  });

  it("moves by a larger step with PageUp and PageDown", async () => {
    setup();
    thumb().focus();
    await userEvent.keyboard("{PageUp}");
    const up = Number((thumb() as HTMLInputElement).value);
    expect(up).toBeGreaterThan(55);
    await userEvent.keyboard("{PageDown}{PageDown}");
    expect(Number((thumb() as HTMLInputElement).value)).toBeLessThan(45);
  });

  it("stays within the bounds", async () => {
    setup({ defaultValue: 100 });
    thumb().focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(thumb()).toHaveValue("100");
  });

  it("is controlled by value", async () => {
    const Controlled = () => {
      const [value, setValue] = useState<number | [number, number]>(20);
      return (
        <>
          <Slider
            aria-label="Volume"
            min={0}
            max={100}
            step={10}
            value={value}
            onChange={setValue}
          />
          <output>{String(value)}</output>
        </>
      );
    };
    render(<Controlled />);
    thumb().focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("status")).toHaveTextContent("30");
    expect(thumb()).toHaveValue("30");
  });

  it("shows a visible label that names the thumb", () => {
    setup({ "aria-label": undefined, label: "Brightness" });
    expect(screen.getByRole("slider", { name: "Brightness" })).toBeVisible();
    expect(screen.getByText("Brightness")).toBeVisible();
  });

  it("cannot be changed when disabled", async () => {
    const onChange = vi.fn();
    setup({ disabled: true, onChange });
    expect(thumb()).toBeDisabled();
    await userEvent.keyboard("{ArrowRight}");
    expect(thumb()).toHaveValue("50");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("Slider (range)", () => {
  const range = (props: Partial<SliderProps> = {}) =>
    setup({
      defaultValue: [20, 60],
      thumbLabels: ["Minimum", "Maximum"],
      ...props,
    });

  it("has one named thumb per bound", () => {
    range();
    expect(thumb("Minimum")).toHaveValue("20");
    expect(thumb("Maximum")).toHaveValue("60");
  });

  it("moves each thumb with the keyboard without crossing the other", async () => {
    const onChange = vi.fn();
    range({ onChange });
    thumb("Minimum").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith([25, 60]);
    await userEvent.keyboard("{End}");
    expect(thumb("Minimum")).toHaveValue("60");
    thumb("Maximum").focus();
    await userEvent.keyboard("{Home}");
    expect(thumb("Maximum")).toHaveValue("60");
  });
});

describe("Slider styles", () => {
  it("takes the track, thumb and focus ring from slider tokens", () => {
    for (const token of [
      "track-color",
      "fill-color",
      "thumb-color",
      "focus-ring-color",
    ]) {
      expect(scss).toContain(`--c--components--slider--${token}`);
    }
  });

  it("holds no literal colour or length in its stylesheet", () => {
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
