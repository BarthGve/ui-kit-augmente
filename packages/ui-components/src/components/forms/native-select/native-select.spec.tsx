import { readFileSync } from "fs";
import { resolve } from "path";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { NativeSelect, NativeSelectProps } from "./index";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "_index.scss"), "utf8");

const OPTIONS = [
  { value: "fr", label: "France" },
  { value: "de", label: "Germany" },
  { value: "es", label: "Spain", disabled: true },
];

const setup = (props: Partial<NativeSelectProps> = {}) => {
  const view = render(
    <CunninghamProvider>
      <NativeSelect label="Country" options={OPTIONS} {...props} />
    </CunninghamProvider>,
  );
  return {
    ...view,
    select: () =>
      screen.getByRole("combobox", { name: "Country" }) as HTMLSelectElement,
  };
};

describe("NativeSelect", () => {
  it("wraps a native select with its label", () => {
    const { select } = setup();
    expect(select().tagName).toBe("SELECT");
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("takes options from an array, with disabled ones", () => {
    setup();
    expect(screen.getByRole("option", { name: "Spain" })).toBeDisabled();
    expect(screen.getByRole("option", { name: "France" })).toHaveValue("fr");
  });

  it("takes option groups from the array", () => {
    setup({
      options: [
        { group: "Europe", options: [{ value: "fr", label: "France" }] },
        { group: "Asia", options: [{ value: "jp", label: "Japan" }] },
      ],
    });
    expect(screen.getByRole("group", { name: "Europe" })).toContainElement(
      screen.getByRole("option", { name: "France" }),
    );
    expect(screen.getByRole("group", { name: "Asia" })).toContainElement(
      screen.getByRole("option", { name: "Japan" }),
    );
  });

  it("takes options and optgroups as children", () => {
    render(
      <CunninghamProvider>
        <NativeSelect label="Country">
          <optgroup label="Europe">
            <option value="fr">France</option>
          </optgroup>
          <option value="us">United States</option>
        </NativeSelect>
      </CunninghamProvider>,
    );
    expect(screen.getByRole("group", { name: "Europe" })).toBeVisible();
    expect(screen.getByRole("option", { name: "United States" })).toBeVisible();
  });

  it("is uncontrolled with defaultValue and reports changes", async () => {
    const onChange = vi.fn();
    const { select } = setup({ defaultValue: "de", onChange });
    expect(select()).toHaveValue("de");
    await userEvent.selectOptions(select(), "fr");
    expect(select()).toHaveValue("fr");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("is controlled by value", async () => {
    const Controlled = () => {
      const [value, setValue] = useState("fr");
      return (
        <CunninghamProvider>
          <NativeSelect
            label="Country"
            options={OPTIONS}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <output>{value}</output>
        </CunninghamProvider>
      );
    };
    render(<Controlled />);
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Country" }),
      "de",
    );
    expect(screen.getByRole("status")).toHaveTextContent("de");
  });

  it("shows a placeholder as a first empty option", () => {
    const { select } = setup({ placeholder: "Pick one", defaultValue: "" });
    expect(select()).toHaveValue("");
    expect(screen.getByRole("option", { name: "Pick one" })).toBeVisible();
  });

  it("shows the hint and links it to the select", () => {
    const { select } = setup({ text: "Where you live" });
    const hint = screen.getByText("Where you live");
    expect(select()).toHaveAttribute("aria-describedby", hint.id);
  });

  it("shows the error state with aria-invalid", () => {
    const { container, select } = setup({ state: "error", text: "Required" });
    expect(container.querySelector(".c__field--error")).not.toBeNull();
    expect(select()).toHaveAttribute("aria-invalid", "true");
  });

  it("shows the success state", () => {
    const { container } = setup({ state: "success" });
    expect(container.querySelector(".c__field--success")).not.toBeNull();
  });

  it("can be disabled", () => {
    const { container, select } = setup({ disabled: true });
    expect(select()).toBeDisabled();
    expect(container.querySelector(".c__field--disabled")).not.toBeNull();
  });

  it("uses the input tokens for border, radius and focus ring", () => {
    for (const token of [
      "border-color",
      "border-radius",
      "border-color--focus",
    ]) {
      expect(scss).toContain(`--c--components--forms-input--${token}`);
    }
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});
