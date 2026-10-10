import { readFileSync } from "fs";
import { resolve } from "path";
import { render, screen } from "@testing-library/react";
import React from "react";
import userEvent from "@testing-library/user-event";
import { Switch, SwitchOnlyProps } from ":/components/forms/switch/index";
import { FieldProps } from "../field";

const spyError = vi.spyOn(global.console, "error");

describe("<Switch/>", () => {
  afterAll(() => {
    spyError.mockRestore();
  });

  it("renders and can be checked", async () => {
    const user = userEvent.setup();
    render(<Switch label="Newsletter" />);
    const input: HTMLInputElement = screen.getByRole("checkbox", {
      name: "Newsletter",
    });
    expect(input.checked).toEqual(false);
    await user.click(input);
    expect(input.checked).toEqual(true);
  });

  it("renders with default value and can be unchecked", async () => {
    const user = userEvent.setup();
    render(<Switch label="Newsletter" defaultChecked={true} />);
    const input: HTMLInputElement = screen.getByRole("checkbox", {
      name: "Newsletter",
    });
    expect(input.checked).toEqual(true);
    await user.click(input);
    expect(input.checked).toEqual(false);
  });

  it("renders disabled", async () => {
    render(<Switch label="Newsletter" disabled={true} />);
    expect(screen.getByRole("checkbox", { name: "Newsletter" })).toBeDisabled();
    // Click and expect the checkbox does not get checked
    const user = userEvent.setup();
    const input: HTMLInputElement = screen.getByRole("checkbox", {
      name: "Newsletter",
    });
    expect(input.checked).toEqual(false);
    await user.click(input);
    expect(input.checked).toEqual(false);
  });

  it("renders with text", async () => {
    render(<Switch label="Newsletter" text="Text" />);
    screen.getByText("Text");
  });

  it("renders with state=success", async () => {
    render(<Switch label="Newsletter" state="success" text="Success text" />);
    screen.getByText("Success text");
    expect(
      document.querySelector(".c__field.c__field--success"),
    ).toBeInTheDocument();
  });

  it("renders with state=error", async () => {
    render(<Switch label="Newsletter" state="error" text="Error text" />);
    screen.getByText("Error text");
    expect(
      document.querySelector(".c__field.c__field--error"),
    ).toBeInTheDocument();
  });

  it("renders multiple", async () => {
    // make sure switching one does not switch the others.
    const user = userEvent.setup();
    render(
      <div>
        <Switch label="Newsletter" />
        <Switch label="Notifications" />
        <Switch label="Phone" />
      </div>,
    );
    // expect all checkboxes to be unchecked
    const newsletter: HTMLInputElement = screen.getByRole("checkbox", {
      name: "Newsletter",
    });
    const notifications: HTMLInputElement = screen.getByRole("checkbox", {
      name: "Notifications",
    });
    const phone: HTMLInputElement = screen.getByRole("checkbox", {
      name: "Phone",
    });
    expect(newsletter.checked).toEqual(false);
    expect(notifications.checked).toEqual(false);
    expect(phone.checked).toEqual(false);

    // Turn on only one checkbox.
    await user.click(newsletter);
    expect(newsletter.checked).toEqual(true);
    expect(notifications.checked).toEqual(false);
    expect(phone.checked).toEqual(false);

    // Turn off only one checkbox.
    await user.click(newsletter);
    expect(newsletter.checked).toEqual(false);
    expect(notifications.checked).toEqual(false);
    expect(phone.checked).toEqual(false);
  });

  it("renders with label right", async () => {
    render(<Switch label="Newsletter" labelSide="right" />);
    const input: HTMLInputElement = screen.getByRole("checkbox", {
      name: "Newsletter",
    });
    expect(input.closest(".c__switch")).toHaveClass("c__switch--right");
  });

  it("renders controlled", async () => {
    const Wrapper = () => {
      const [checked, setChecked] = React.useState(false);
      return (
        <div>
          <div>Value: {JSON.stringify(checked)}.</div>
          <Switch
            label="Newsletter"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
        </div>
      );
    };
    render(<Wrapper />);
    const input: HTMLInputElement = screen.getByRole("checkbox", {
      name: "Newsletter",
    });
    expect(input.checked).toEqual(false);
    screen.queryByText("Value: false.");
    await userEvent.click(input);
    expect(input.checked).toEqual(true);
    screen.queryByText("Value: true.");
    await userEvent.click(input);
    expect(input.checked).toEqual(false);
    screen.queryByText("Value: false.");
  });

  it("checks the props doesn't create error warning", async () => {
    const propsInput: Required<FieldProps & SwitchOnlyProps> = {
      label: "First name",
      fullWidth: true,
      className: "c__field--full-width",
      compact: false,
      state: "default",
      text: "my text",
      textItems: ["my text item 1", "my text item 2"],
      rightText: "my right text",
      labelSide: "right",
      disabled: false,
      labelWidth: "10rem",
    };

    render(<Switch {...propsInput} />);
    expect(spyError).not.toHaveBeenCalled();
  });

  it("renders with className", async () => {
    render(<Switch className="my-custom-class" />);
    expect(
      document.querySelector(".c__switch.my-custom-class"),
    ).toBeInTheDocument();
  });

  describe("size", () => {
    const rootOf = (input: HTMLElement) => input.closest("label")!;

    it("marks the root of a small switch with the shared small modifier", () => {
      render(<Switch label="Newsletter" size="small" />);
      const root = rootOf(screen.getByRole("checkbox", { name: "Newsletter" }));
      expect(root.classList.contains("c__checkbox--small")).toBe(true);
      expect(root.classList.contains("c__switch")).toBe(true);
      expect(root.classList.contains("c__switch--left")).toBe(true);
    });

    it("keeps today's root classes without size and with size=medium", () => {
      render(
        <>
          <Switch label="Default" />
          <Switch label="Medium" size="medium" />
        </>,
      );
      for (const name of ["Default", "Medium"]) {
        const root = rootOf(screen.getByRole("checkbox", { name }));
        expect(root.className).toBe("c__checkbox c__switch c__switch--left");
      }
    });

    it("accepts only medium or small", () => {
      // Checked by `tsc` (yarn build), not at runtime.
      // @ts-expect-error unknown size
      render(<Switch label="Huge" size="huge" />);
      // @ts-expect-error the inherited numeric HTML size is no longer accepted
      render(<Switch label="Three" size={3} />);
    });

    it("keeps label side, hint text, states and disabled when small", async () => {
      render(
        <>
          <Switch label="Right" size="small" labelSide="right" text="Hint" />
          <Switch label="Errored" size="small" state="error" text="Err" />
          <Switch label="Passed" size="small" state="success" text="Ok" />
          <Switch label="Off" size="small" disabled />
        </>,
      );
      const right = rootOf(screen.getByRole("checkbox", { name: "Right Hint" }));
      expect(right.classList).toContain("c__switch--right");
      for (const name of ["Right Hint", "Errored Err", "Passed Ok", "Off"]) {
        expect(
          rootOf(screen.getByRole("checkbox", { name })).classList,
        ).toContain("c__checkbox--small");
      }
      expect(document.querySelector(".c__field--error")).toBeInTheDocument();
      expect(document.querySelector(".c__field--success")).toBeInTheDocument();

      const off: HTMLInputElement = screen.getByRole("checkbox", {
        name: "Off",
      });
      expect(off).toBeDisabled();
      await userEvent.setup().click(off);
      expect(off.checked).toBe(false);
    });
  });
});

describe("forms-switch small tokens", () => {
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
    const variable = (key: string, value: string) =>
      new RegExp(`--c--components--forms-switch--${key}:\\s*${value};`);
    expect(body).toMatch(variable("small-rail-width", "2rem"));
    expect(body).toMatch(variable("small-rail-height", "1rem"));
    expect(body).toMatch(variable("small-handle-size", "0\\.75rem"));
    expect(body).toMatch(
      variable(
        "small-handle-offset",
        "var\\(--c--globals--spacings--4xs\\)",
      ),
    );
  });
});
