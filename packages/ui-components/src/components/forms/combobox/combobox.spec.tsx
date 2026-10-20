import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { Combobox, ComboboxProps } from "./index";

const OPTIONS = [
  { value: "fr", label: "France" },
  { value: "de", label: "Germany" },
  { value: "es", label: "Spain" },
  { value: "fi", label: "Finland", disabled: true },
];

const setup = (props: Partial<ComboboxProps> = {}) =>
  render(
    <CunninghamProvider>
      <Combobox label="Country" options={OPTIONS} {...props} />
    </CunninghamProvider>,
  );

const input = () => screen.getByRole("combobox", { name: "Country" });
const optionNames = () =>
  screen.queryAllByRole("option").map((o) => o.textContent);

describe("Combobox", () => {
  it("exposes the ARIA combobox pattern", async () => {
    setup();
    expect(input()).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(input());
    await userEvent.keyboard("{ArrowDown}");
    expect(input()).toHaveAttribute("aria-expanded", "true");
    const list = screen.getByRole("listbox");
    expect(input()).toHaveAttribute("aria-controls", list.id);
    expect(within(list).getAllByRole("option")).toHaveLength(4);
  });

  it("filters the options while typing", async () => {
    setup();
    await userEvent.type(input(), "an");
    expect(optionNames()).toEqual(["France", "Germany", "Finland"]);
  });

  it("moves the active option with the arrows and selects it with Enter", async () => {
    const onChange = vi.fn();
    setup({ onChange });
    await userEvent.type(input(), "{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    const active = input().getAttribute("aria-activedescendant");
    expect(active).toBeTruthy();
    expect(document.getElementById(active!)).toHaveTextContent("Germany");
    await userEvent.keyboard("{Enter}");
    expect(input()).toHaveValue("Germany");
    expect(onChange).toHaveBeenCalledWith("de");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("closes with Escape", async () => {
    setup();
    await userEvent.type(input(), "{ArrowDown}");
    expect(screen.getByRole("listbox")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("selects an option with the mouse", async () => {
    const onChange = vi.fn();
    setup({ onChange });
    await userEvent.type(input(), "spa");
    await userEvent.click(screen.getByRole("option", { name: "Spain" }));
    expect(input()).toHaveValue("Spain");
    expect(onChange).toHaveBeenCalledWith("es");
  });

  it("does not select a disabled option", async () => {
    const onChange = vi.fn();
    setup({ onChange });
    await userEvent.type(input(), "fin");
    const option = screen.getByRole("option", { name: "Finland" });
    expect(option).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(option);
    expect(onChange).not.toHaveBeenCalled();
  });

  describe("a value that is not in the list", () => {
    it("is refused by default: the input goes back to the selection", async () => {
      setup({ defaultValue: "fr" });
      expect(input()).toHaveValue("France");
      await userEvent.type(input(), "XYZ");
      expect(input()).toHaveValue("FranceXYZ");
      await userEvent.tab();
      expect(input()).toHaveValue("France");
    });

    it("is kept when allowed", async () => {
      const onInputChange = vi.fn();
      setup({ allowsCustomValue: true, onInputChange });
      await userEvent.type(input(), "Atlantis");
      await userEvent.tab();
      expect(input()).toHaveValue("Atlantis");
      expect(onInputChange).toHaveBeenLastCalledWith("Atlantis");
    });
  });

  it("shows an empty state when nothing matches", async () => {
    setup();
    await userEvent.type(input(), "zzz");
    expect(screen.getByText("No results")).toBeVisible();
  });

  it("shows a loading state", async () => {
    setup({ isLoading: true, options: [] });
    await userEvent.type(input(), "{ArrowDown}");
    expect(screen.getByText("Loading…")).toBeVisible();
    expect(screen.queryByText("No results")).toBeNull();
  });

  it("supports an asynchronous option source", async () => {
    const Async = () => {
      const [options, setOptions] = useState<typeof OPTIONS>([]);
      return (
        <CunninghamProvider>
          <Combobox
            label="Country"
            options={options}
            filterOptions={false}
            onInputChange={(text) =>
              setTimeout(
                () =>
                  setOptions(
                    text ? [{ value: "remote", label: `Remote ${text}` }] : [],
                  ),
                10,
              )
            }
          />
        </CunninghamProvider>
      );
    };
    render(<Async />);
    await userEvent.type(input(), "ab");
    await waitFor(() => expect(optionNames()).toEqual(["Remote ab"]));
  });

  it("is controlled by value", async () => {
    const Controlled = () => {
      const [value, setValue] = useState<string | null>("de");
      return (
        <CunninghamProvider>
          <Combobox
            label="Country"
            options={OPTIONS}
            value={value}
            onChange={setValue}
          />
          <output>{value}</output>
        </CunninghamProvider>
      );
    };
    render(<Controlled />);
    expect(input()).toHaveValue("Germany");
    await userEvent.click(input());
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.click(screen.getByRole("option", { name: "Spain" }));
    expect(screen.getByRole("status")).toHaveTextContent("es");
  });

  describe("field states and variants", () => {
    it("shows the error state with its text", () => {
      const { container } = setup({ state: "error", text: "Pick a country" });
      expect(container.querySelector(".c__field--error")).not.toBeNull();
      expect(screen.getByText("Pick a country")).toBeVisible();
    });

    it("shows the success state", () => {
      const { container } = setup({ state: "success" });
      expect(container.querySelector(".c__field--success")).not.toBeNull();
    });

    it("can be disabled", async () => {
      const { container } = setup({ disabled: true });
      expect(input()).toBeDisabled();
      expect(container.querySelector(".c__field--disabled")).not.toBeNull();
    });

    it("renders the floating label by default and a static one for the classic variant", () => {
      const { container, unmount } = setup();
      expect(container.querySelector(".labelled-box")).not.toBeNull();
      unmount();
      const classic = setup({ variant: "classic" });
      expect(classic.container.querySelector(".labelled-box")).toBeNull();
      expect(classic.container.querySelector("label")).toHaveTextContent(
        "Country",
      );
    });

    it("keeps the accessible name when the label is hidden", () => {
      setup({ hideLabel: true });
      expect(input()).toBeVisible();
    });
  });
});
