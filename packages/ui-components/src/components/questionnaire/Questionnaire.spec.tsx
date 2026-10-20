import { readFileSync } from "fs";
import { resolve } from "path";
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import {
  Questionnaire,
  QuestionnaireItem,
  QuestionnaireProps,
} from "./Questionnaire";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const ITEMS: QuestionnaireItem[] = [
  {
    id: "role",
    type: "single",
    label: "What is your role?",
    required: true,
    options: [
      { value: "dev", label: "Developer" },
      { value: "design", label: "Designer" },
    ],
  },
  {
    id: "tools",
    type: "multiple",
    label: "Which tools do you use?",
    options: [
      { value: "figma", label: "Figma" },
      { value: "git", label: "Git" },
    ],
  },
  { id: "notes", type: "text", label: "Anything else?", required: true },
];

const setup = (props: Partial<QuestionnaireProps> = {}) => {
  const onSubmit = vi.fn();
  render(
    <CunninghamProvider currentLocale="en-US">
      <Questionnaire
        aria-label="Survey"
        items={ITEMS}
        onSubmit={onSubmit}
        {...props}
      />
    </CunninghamProvider>,
  );
  return { onSubmit };
};
const next = () => screen.getByRole("button", { name: "Next" });
const legend = (text: string) => screen.getByText(text);
const group = (name: string) => screen.getByRole("group", { name });

describe("Questionnaire", () => {
  it("shows one item at a time, each a fieldset with a legend", () => {
    setup();
    expect(group("What is your role?").tagName).toBe("FIELDSET");
    expect(
      screen.queryByRole("group", { name: "Which tools do you use?" }),
    ).toBeNull();
    expect(screen.getByRole("radio", { name: "Developer" })).toBeVisible();
  });

  it("names the progress bar and keeps it up to date", async () => {
    setup();
    const bar = screen.getByRole("progressbar", { name: "Progress" });
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "3");
    expect(bar).toHaveAttribute("aria-valuenow", "1");
    expect(bar).toHaveAttribute("aria-valuetext", "Question 1 of 3");
    await userEvent.click(screen.getByRole("radio", { name: "Developer" }));
    await userEvent.click(next());
    expect(bar).toHaveAttribute("aria-valuenow", "2");
    expect(bar).toHaveAttribute("aria-valuetext", "Question 2 of 3");
  });

  it("blocks next on a required question without an answer, and says so", async () => {
    setup();
    await userEvent.click(next());
    expect(group("What is your role?")).toBeVisible();
    const error = screen.getByRole("alert");
    expect(error).toHaveTextContent("Please answer this question");
    const first = screen.getByRole("radio", { name: "Developer" });
    expect(first).toHaveAttribute("aria-invalid", "true");
    expect(first).toHaveFocus();
    expect(first).toHaveAccessibleDescription("Please answer this question");
  });

  it("clears the error once answered and moves on, focusing the new item", async () => {
    setup();
    await userEvent.click(next());
    await userEvent.click(screen.getByRole("radio", { name: "Designer" }));
    await userEvent.click(next());
    expect(screen.queryByRole("alert")).toBeNull();
    expect(group("Which tools do you use?")).toBeVisible();
    expect(legend("Which tools do you use?")).toHaveFocus();
  });

  it("goes back with Previous, keeping the answer", async () => {
    setup();
    await userEvent.click(screen.getByRole("radio", { name: "Designer" }));
    await userEvent.click(next());
    await userEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByRole("radio", { name: "Designer" })).toBeChecked();
    expect(legend("What is your role?")).toHaveFocus();
  });

  it("has no Previous on the first question", () => {
    setup();
    expect(screen.queryByRole("button", { name: "Previous" })).toBeNull();
  });

  it("lets an optional question be skipped", async () => {
    setup();
    await userEvent.click(screen.getByRole("radio", { name: "Developer" }));
    await userEvent.click(next());
    await userEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(group("Anything else?")).toBeVisible();
  });

  it("does not offer Skip on a required question", () => {
    setup();
    expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
  });

  it("accepts several answers for a multiple choice", async () => {
    const { onSubmit } = setup();
    await userEvent.click(screen.getByRole("radio", { name: "Developer" }));
    await userEvent.click(next());
    await userEvent.click(screen.getByRole("checkbox", { name: "Figma" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Git" }));
    await userEvent.click(next());
    await userEvent.type(
      screen.getByRole("textbox", { name: "Anything else?" }),
      "All good",
    );
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      role: "dev",
      tools: ["figma", "git"],
      notes: "All good",
    });
  });

  it("replaces Next with Submit on the last question, and validates it", async () => {
    const { onSubmit } = setup();
    await userEvent.click(screen.getByRole("radio", { name: "Developer" }));
    await userEvent.click(next());
    await userEvent.click(next());
    expect(screen.queryByRole("button", { name: "Next" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).not.toHaveBeenCalled();
    const field = screen.getByRole("textbox", { name: "Anything else?" });
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveFocus();
  });

  it("reports an empty answer as an empty list or string for skipped questions", async () => {
    const { onSubmit } = setup();
    await userEvent.click(screen.getByRole("radio", { name: "Developer" }));
    await userEvent.click(next());
    await userEvent.click(screen.getByRole("button", { name: "Skip" }));
    await userEvent.type(
      screen.getByRole("textbox", { name: "Anything else?" }),
      "x",
    );
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).toHaveBeenCalledWith({
      role: "dev",
      tools: [],
      notes: "x",
    });
  });

  it("keeps the inactive questions in the page but inert, so they never take the focus", async () => {
    const { container } = render(
      <CunninghamProvider currentLocale="en-US">
        <Questionnaire aria-label="Survey" items={ITEMS} onSubmit={() => {}} />
      </CunninghamProvider>,
    );
    const fieldsets = container.querySelectorAll("fieldset");
    expect(fieldsets).toHaveLength(3);
    expect(fieldsets[0]).not.toHaveAttribute("inert");
    expect(fieldsets[1]).toHaveAttribute("inert");
    expect(fieldsets[1]).toHaveAttribute("hidden");
  });

  it("supports a controlled step", async () => {
    const Controlled = () => {
      const [step, setStep] = useState(0);
      return (
        <CunninghamProvider currentLocale="en-US">
          <Questionnaire
            aria-label="Survey"
            items={ITEMS}
            step={step}
            onStepChange={setStep}
            onSubmit={() => {}}
          />
          <output>{step}</output>
        </CunninghamProvider>
      );
    };
    render(<Controlled />);
    await userEvent.click(screen.getByRole("radio", { name: "Developer" }));
    await userEvent.click(next());
    expect(screen.getByRole("status")).toHaveTextContent("1");
    expect(group("Which tools do you use?")).toBeVisible();
  });

  it("stays on the step the parent holds when it ignores the change", async () => {
    setup({ step: 0, onStepChange: () => {} });
    await userEvent.click(screen.getByRole("radio", { name: "Developer" }));
    await userEvent.click(next());
    expect(group("What is your role?")).toBeVisible();
  });

  it("has a progress bar and spacing from tokens, with no literal", () => {
    expect(scss).toContain(
      "--c--components--questionnaire--progress-fill-color",
    );
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });

  it("shows nothing but the form chrome for an empty list", () => {
    setup({ items: [] });
    expect(
      within(screen.getByRole("form", { name: "Survey" })).queryByRole("group"),
    ).toBeNull();
  });
});
