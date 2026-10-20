import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Gauge } from "./Gauge";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const fill = () => screen.getByRole("meter").firstElementChild as HTMLElement;

describe("Gauge", () => {
  it("exposes a meter with its value, range and label", () => {
    render(<Gauge value={30} min={10} max={50} label="Quota" />);
    const meter = screen.getByRole("meter", { name: "Quota" });
    expect(meter).toHaveAttribute("aria-valuenow", "30");
    expect(meter).toHaveAttribute("aria-valuemin", "10");
    expect(meter).toHaveAttribute("aria-valuemax", "50");
  });

  it("goes from 0 to 100 by default", () => {
    render(<Gauge value={25} label="Quota" />);
    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
    expect(fill().style.width).toBe("25%");
  });

  it("fills in proportion to the position between min and max", () => {
    render(<Gauge value={30} min={10} max={50} label="Quota" />);
    expect(fill().style.width).toBe("50%");
  });

  it("clamps a value above the maximum", () => {
    render(<Gauge value={80} max={50} label="Quota" />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "50");
    expect(fill().style.width).toBe("100%");
  });

  it("clamps a value below the minimum", () => {
    render(<Gauge value={-5} label="Quota" />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "0");
    expect(fill().style.width).toBe("0%");
  });

  it.each([NaN, Infinity])("stays empty when the value is %s", (value) => {
    render(<Gauge value={value} label="Quota" />);
    expect(fill().style.width).toBe("0%");
  });

  it("stays empty when the range is empty or reversed", () => {
    render(<Gauge value={5} min={10} max={10} label="Quota" />);
    expect(fill().style.width).toBe("0%");
  });

  it("warns from 80% and flags an error at 100%", () => {
    const { rerender } = render(<Gauge value={79} label="Quota" />);
    expect(fill()).not.toHaveClass("c__gauge__fill--warning");
    rerender(<Gauge value={80} label="Quota" />);
    expect(fill()).toHaveClass("c__gauge__fill--warning");
    rerender(<Gauge value={100} label="Quota" />);
    expect(fill()).toHaveClass("c__gauge__fill--error");
    expect(fill()).not.toHaveClass("c__gauge__fill--warning");
  });

  it("keeps a custom className and other attributes", () => {
    render(<Gauge value={1} label="Quota" className="mine" data-x="y" />);
    expect(screen.getByRole("meter")).toHaveClass("c__gauge", "mine");
    expect(screen.getByRole("meter")).toHaveAttribute("data-x", "y");
  });

  it("holds no literal colour or length", () => {
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
