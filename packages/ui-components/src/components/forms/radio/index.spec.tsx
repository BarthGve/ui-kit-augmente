import { readFileSync } from "fs";
import { resolve } from "path";
import userEvent from "@testing-library/user-event";
import React from "react";
import { render, screen } from "@testing-library/react";
import { expect } from "vitest";
import {
  Radio,
  RadioGroup,
  RadioOnlyProps,
} from ":/components/forms/radio/index";
import { tokens as radioTokens } from ":/components/forms/radio/tokens";
import { FieldProps } from "../field";

const spyError = vi.spyOn(global.console, "error");

describe("<Radio/>", () => {
  afterAll(() => {
    spyError.mockRestore();
  });

  it("should render", async () => {
    render(<Radio label="Yes" />);
    expect(screen.getByLabelText("Yes")).toBeInTheDocument();
  });
  it("should render checked", async () => {
    render(<Radio label="Yes" defaultChecked={true} />);
    const input: HTMLInputElement = screen.getByRole("radio", {
      name: "Yes",
    });
    expect(input.checked).toEqual(true);
  });
  it("should render disabled", async () => {
    render(<Radio label="Yes" disabled={true} />);
    expect(screen.getByRole("radio", { name: "Yes" })).toBeDisabled();
    // Click and expect the radio does not get checked
    const user = userEvent.setup();
    const input: HTMLInputElement = screen.getByRole("radio", {
      name: "Yes",
    });
    expect(input.checked).toEqual(false);
    await user.click(input);
    expect(input.checked).toEqual(false);
  });
  it("should render with text", async () => {
    render(<Radio label="Yes" text="Text" />);
    expect(screen.getByText("Text")).toBeInTheDocument();
  });
  it("should render with state=success", async () => {
    render(<Radio label="Yes" state="success" text="Success text" />);
    expect(screen.getByText("Success text")).toBeInTheDocument();
    expect(
      document.querySelector(".c__field.c__field--success"),
    ).toBeInTheDocument();
  });
  it("should render with state=error", async () => {
    render(<Radio label="Yes" state="error" text="Error text" />);
    expect(screen.getByText("Error text")).toBeInTheDocument();
    expect(
      document.querySelector(".c__field.c__field--error"),
    ).toBeInTheDocument();
  });
  it("should render with group", async () => {
    render(
      <RadioGroup>
        <Radio label="Yes" />
        <Radio label="No" />
      </RadioGroup>,
    );
    screen.getByRole("radio", {
      name: "Yes",
    });
    screen.getByRole("radio", {
      name: "No",
    });
  });
  it("should render with group and checking one radio should unchecked all others", async () => {
    render(
      <RadioGroup>
        <Radio name="agree" label="Yes" />
        <Radio name="agree" label="No" />
      </RadioGroup>,
    );
    const user = userEvent.setup();
    const yesInput: HTMLInputElement = screen.getByLabelText("Yes");
    const noInput: HTMLInputElement = screen.getByLabelText("No");
    expect(yesInput.checked).toEqual(false);
    expect(noInput.checked).toEqual(false);
    await user.click(yesInput);
    expect(yesInput.checked).toEqual(true);
    expect(noInput.checked).toEqual(false);
    await user.click(noInput);
    expect(yesInput.checked).toEqual(false);
    expect(noInput.checked).toEqual(true);
  });
  it("should render with group text", async () => {
    render(
      <RadioGroup text="Text">
        <Radio label="Yes" />
        <Radio label="No" />
      </RadioGroup>,
    );
    expect(screen.getByText("Text")).toBeInTheDocument();
  });
  it("should render with group state=success", async () => {
    render(
      <RadioGroup state="success" text="Success text">
        <Radio label="Yes" />
        <Radio label="No" />
      </RadioGroup>,
    );
    expect(screen.getByText("Success text")).toBeInTheDocument();
    expect(
      document.querySelector(".c__radio__group.c__field.c__field--success"),
    ).toBeInTheDocument();
  });
  it("should render with group state=error", async () => {
    render(
      <RadioGroup state="error" text="Error text">
        <Radio label="Yes" />
        <Radio label="No" />
      </RadioGroup>,
    );
    expect(screen.getByText("Error text")).toBeInTheDocument();
    expect(
      document.querySelector(".c__radio__group.c__field.c__field--error"),
    ).toBeInTheDocument();
  });

  it("checks the props doesn't create error warning", async () => {
    const propsInput: Required<FieldProps & RadioOnlyProps> = {
      label: "First name",
      fullWidth: true,
      className: "c__field--full-width",
      compact: false,
      state: "default",
      text: "my text",
      textItems: ["my text item 1", "my text item 2"],
      rightText: "my right text",
      disabled: false,
      labelWidth: "10rem",
    };

    render(<Radio {...propsInput} />);
    expect(spyError).not.toHaveBeenCalled();
  });

  it("renders with className", async () => {
    render(
      <Radio
        label="Agree"
        checked={true}
        readOnly={true}
        className="my-custom-class"
      />,
    );
    expect(
      document.querySelector(".c__checkbox.my-custom-class"),
    ).toBeInTheDocument();
  });
  it("renders group with className", async () => {
    render(<RadioGroup className="my-custom-class" />);
    expect(
      document.querySelector(".c__checkbox__group.my-custom-class"),
    ).toBeInTheDocument();
  });

  describe("size", () => {
    const rootOf = (input: HTMLElement) => input.closest("label")!;

    it("marks the root of a small radio with the shared small modifier", () => {
      render(<Radio label="Yes" size="small" />);
      const root = rootOf(screen.getByRole("radio", { name: "Yes" }));
      expect(root.classList.contains("c__checkbox--small")).toBe(true);
      expect(root.classList.contains("c__radio")).toBe(true);
    });

    it("keeps today's root classes without size and with size=medium", () => {
      render(
        <>
          <Radio label="Default" />
          <Radio label="Medium" size="medium" />
        </>,
      );
      for (const name of ["Default", "Medium"]) {
        const root = rootOf(screen.getByRole("radio", { name }));
        expect(root.className).toBe("c__checkbox c__radio");
      }
    });

    it("accepts only medium or small", () => {
      // Checked by `tsc` (yarn build), not at runtime.
      // @ts-expect-error unknown size
      render(<Radio label="Huge" size="huge" />);
      // @ts-expect-error the inherited numeric HTML size is no longer accepted
      render(<Radio label="Three" size={3} />);
    });

    it("keeps group text, states, disabled and exclusive selection when small", async () => {
      render(
        <>
          <RadioGroup state="error" text="Group error">
            <Radio name="a" label="Yes" size="small" />
            <Radio name="a" label="No" size="small" />
            <Radio name="a" label="Maybe" size="small" disabled />
          </RadioGroup>
          <RadioGroup state="success" text="Group success">
            <Radio name="b" label="Ok" size="small" />
          </RadioGroup>
        </>,
      );
      expect(screen.getByText("Group error")).toBeInTheDocument();
      expect(screen.getByText("Group success")).toBeInTheDocument();
      expect(
        document.querySelector(".c__radio__group.c__field--error"),
      ).toBeInTheDocument();
      expect(
        document.querySelector(".c__radio__group.c__field--success"),
      ).toBeInTheDocument();

      const yes: HTMLInputElement = screen.getByRole("radio", { name: "Yes" });
      const no: HTMLInputElement = screen.getByRole("radio", { name: "No" });
      const maybe = screen.getByRole("radio", { name: "Maybe" });
      for (const input of [yes, no, maybe]) {
        expect(rootOf(input).classList).toContain("c__checkbox--small");
      }
      expect(maybe).toBeDisabled();

      const user = userEvent.setup();
      await user.click(yes);
      expect(yes.checked).toBe(true);
      await user.click(no);
      expect(yes.checked).toBe(false);
      expect(no.checked).toBe(true);
    });
  });
});

describe("forms-radio tokens", () => {
  // The radio reads the forms-checkbox table: no parallel radio token.
  it("emits no forms-radio variable and keeps an empty table", () => {
    const tokensCss = readFileSync(
      resolve(__dirname, "../../../cunningham-tokens.css"),
      "utf8",
    );
    expect(tokensCss).not.toContain("--c--components--forms-radio--");
    expect(radioTokens()).toEqual({});
  });
});
