import { readFileSync } from "fs";
import { resolve } from "path";
import userEvent from "@testing-library/user-event";
import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import { expect } from "vitest";
import {
  Checkbox,
  CheckboxGroup,
  CheckboxOnlyProps,
} from ":/components/forms/checkbox/index";
import { FieldProps } from "../field";

const spyError = vi.spyOn(global.console, "error");

describe("<Checkbox/>", () => {
  afterAll(() => {
    spyError.mockRestore();
  });

  it("renders and can be checked", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Agree" />);
    const input: HTMLInputElement = screen.getByRole("checkbox", {
      name: "Agree",
    });
    expect(input.checked).toEqual(false);
    await user.click(input);
    expect(input.checked).toEqual(true);
  });
  it("renders with default value and can be unchecked", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Agree" checked={true} />);
    const input: HTMLInputElement = screen.getByRole("checkbox", {
      name: "Agree",
    });
    expect(input.checked).toEqual(true);
    await user.click(input);
    expect(input.checked).toEqual(false);
  });
  it("renders with indeterminate state", async () => {
    render(<Checkbox label="Agree" indeterminate={true} />);
    expect(document.querySelector("svg.indeterminate")).toBeInTheDocument();
  });
  it("renders disabled", async () => {
    render(<Checkbox label="Agree" disabled={true} />);
    expect(screen.getByRole("checkbox", { name: "Agree" })).toBeDisabled();
    // Click and expect the checkbox does not get checked
    const user = userEvent.setup();
    const input: HTMLInputElement = screen.getByRole("checkbox", {
      name: "Agree",
    });
    expect(input.checked).toEqual(false);
    await user.click(input);
    expect(input.checked).toEqual(false);
  });
  it("renders with text", async () => {
    render(<Checkbox label="Agree" text="Text" />);
    expect(screen.getByText("Text")).toBeInTheDocument();
  });
  it("renders with state=success", async () => {
    render(<Checkbox label="Agree" state="success" text="Success text" />);
    expect(screen.getByText("Success text")).toBeInTheDocument();
    expect(
      document.querySelector(".c__field.c__field--success"),
    ).toBeInTheDocument();
  });
  it("renders with state=error", async () => {
    render(<Checkbox label="Agree" state="error" text="Error text" />);
    expect(screen.getByText("Error text")).toBeInTheDocument();
    expect(
      document.querySelector(".c__field.c__field--error"),
    ).toBeInTheDocument();
  });

  it("renders with group", async () => {
    render(
      <CheckboxGroup>
        <Checkbox label="Agree" />
        <Checkbox label="Disagree" />
      </CheckboxGroup>,
    );
    screen.getByRole("checkbox", {
      name: "Agree",
    });
    screen.getByRole("checkbox", {
      name: "Disagree",
    });
  });
  it("renders with group text", async () => {
    render(
      <CheckboxGroup text="Text">
        <Checkbox label="Agree" />
        <Checkbox label="Disagree" />
      </CheckboxGroup>,
    );
    expect(screen.getByText("Text")).toBeInTheDocument();
  });
  it("renders with group state=success", async () => {
    render(
      <CheckboxGroup state="success" text="Success text">
        <Checkbox label="Agree" />
        <Checkbox label="Disagree" />
      </CheckboxGroup>,
    );
    expect(screen.getByText("Success text")).toBeInTheDocument();
    expect(
      document.querySelector(".c__checkbox__group.c__field.c__field--success"),
    ).toBeInTheDocument();
  });
  it("renders with group state=error", async () => {
    render(
      <CheckboxGroup state="error" text="Error text">
        <Checkbox label="Agree" />
        <Checkbox label="Disagree" />
      </CheckboxGroup>,
    );
    expect(screen.getByText("Error text")).toBeInTheDocument();
    expect(
      document.querySelector(".c__checkbox__group.c__field.c__field--error"),
    ).toBeInTheDocument();
  });

  it("checks the props doesn't create error warning", async () => {
    const propsInput: Required<FieldProps & CheckboxOnlyProps> = {
      label: "First name",
      fullWidth: true,
      className: "c__field--full-width",
      compact: false,
      state: "default",
      text: "my text",
      textItems: ["my text item 1", "my text item 2"],
      rightText: "my right text",
      indeterminate: true,
      disabled: false,
      labelWidth: "10rem",
    };

    render(<Checkbox {...propsInput} />);
    expect(spyError).not.toHaveBeenCalled();
  });

  /**
   * From this issue: https://github.com/suitenumerique/cunningham/issues/175
   * The bug was that when clicking on the checkmark (svg) it was firing two onClick event to
   * <section>.
   */
  it("can be unchecked when being controlled from a bigger parent", async () => {
    const Wrapper = () => {
      const [checked, setChecked] = useState(true);
      return (
        <section
          className="center"
          onClick={() => {
            setChecked(!checked);
          }}
          style={{ width: "30%", background: "gainsboro", cursor: "pointer" }}
        >
          <header>Full Card clickable</header>
          <div>Checked = {checked ? "true" : "false"}|</div>
          <Checkbox checked={checked} />
        </section>
      );
    };

    const user = userEvent.setup();
    render(<Wrapper />);
    const input: HTMLInputElement = screen.getByRole("checkbox");
    expect(input.checked).toEqual(true);
    screen.getByText("Checked = true|");

    // Uncheck by clicking on the SVG.
    const checkmark = document.querySelector("svg.checkmark")!;
    await user.click(checkmark);
    expect(input.checked).toEqual(false);
    screen.getByText("Checked = false|");
  });
  it("renders with className", async () => {
    render(
      <Checkbox label="Agree" checked={true} className="my-custom-class" />,
    );
    expect(
      document.querySelector(".c__checkbox.my-custom-class"),
    ).toBeInTheDocument();
  });
  it("renders group with className", async () => {
    render(<CheckboxGroup className="my-custom-class" />);
    expect(
      document.querySelector(".c__checkbox__group.my-custom-class"),
    ).toBeInTheDocument();
  });

  describe("size", () => {
    const rootOf = (input: HTMLElement) => input.closest("label")!;

    it("marks the root of a small checkbox with the shared small modifier", () => {
      render(<Checkbox label="Agree" size="small" />);
      const root = rootOf(screen.getByRole("checkbox", { name: "Agree" }));
      expect(root.classList.contains("c__checkbox--small")).toBe(true);
    });

    it("keeps today's root classes without size and with size=medium", () => {
      render(
        <>
          <Checkbox label="Default" />
          <Checkbox label="Medium" size="medium" />
        </>,
      );
      for (const name of ["Default", "Medium"]) {
        const root = rootOf(screen.getByRole("checkbox", { name }));
        expect(root.className).toBe("c__checkbox");
      }
    });

    it("accepts only medium or small", () => {
      // Checked by `tsc` (yarn build), not at runtime.
      // @ts-expect-error unknown size
      render(<Checkbox label="Huge" size="huge" />);
      // @ts-expect-error the inherited numeric HTML size is no longer accepted
      render(<Checkbox label="Three" size={3} />);
    });

    it("keeps label, hint text, states and indeterminate when small", () => {
      render(
        <>
          <Checkbox label="Errored" size="small" state="error" text="Err" />
          <Checkbox label="Passed" size="small" state="success" text="Ok" />
          <Checkbox label="Partial" size="small" indeterminate />
        </>,
      );
      for (const name of ["Errored Err", "Passed Ok", "Partial"]) {
        expect(
          rootOf(screen.getByRole("checkbox", { name })).classList,
        ).toContain("c__checkbox--small");
      }
      expect(screen.getByText("Err")).toBeInTheDocument();
      expect(screen.getByText("Ok")).toBeInTheDocument();
      expect(document.querySelector(".c__field--error")).toBeInTheDocument();
      expect(document.querySelector(".c__field--success")).toBeInTheDocument();
      expect(
        (screen.getByRole("checkbox", { name: "Partial" }) as HTMLInputElement)
          .indeterminate,
      ).toBe(true);
    });
  });
});

describe("forms-checkbox small tokens", () => {
  // Vitest stubs stylesheets, so the generated CSS is read from disk.
  const tokensCss = readFileSync(
    resolve(__dirname, "../../../cunningham-tokens.css"),
    "utf8",
  );
  const blocks = [
    ":root ",
    ".cunningham-theme--dark",
    ".cunningham-theme--dsfr-light",
    ".cunningham-theme--dsfr-dark",
    ".cunningham-theme--anct-light",
    ".cunningham-theme--anct-dark",
  ];

  it.each(blocks)("are emitted in %s", (selector) => {
    // Theme blocks hold flat declarations only: the first `}` closes the block.
    const body = tokensCss.split(`${selector}{`)[1]?.split("}")[0] ?? "";
    expect(body).toMatch(
      /--c--components--forms-checkbox--small-size:\s*1rem;/,
    );
    expect(body).toMatch(
      /--c--components--forms-checkbox--small-font-size:\s*var\(--c--globals--font--sizes--xs\);/,
    );
  });
});
