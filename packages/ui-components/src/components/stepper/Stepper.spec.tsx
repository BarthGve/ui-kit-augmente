import { readFileSync } from "fs";
import { resolve } from "path";
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { Button } from ":/components/button";
import { Modal, ModalSize } from ":/components/modal";
import { Stepper } from "./Stepper";

// Vitest stubs stylesheets, so the source is read from disk.
const scss = readFileSync(resolve(__dirname, "index.scss"), "utf8");

const STEPS = [{ label: "Details" }, { label: "Members" }, { label: "Review" }];

const setup = (current = 1) =>
  render(
    <CunninghamProvider>
      <Stepper aria-label="Progress" steps={STEPS} current={current} />
    </CunninghamProvider>,
  );

const item = (label: string) => screen.getByText(label).closest("li")!;

describe("Stepper", () => {
  it("lists the steps in an ordered list with an accessible label", () => {
    setup();
    const list = screen.getByRole("list", { name: "Progress" });
    expect(list.tagName).toBe("OL");
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
  });

  it("marks done, current and upcoming steps", () => {
    setup(1);
    expect(item("Details")).toHaveClass("c__stepper__step--done");
    expect(item("Members")).toHaveClass("c__stepper__step--current");
    expect(item("Review")).toHaveClass("c__stepper__step--upcoming");
  });

  it("exposes the current step to assistive technology", () => {
    setup(1);
    expect(item("Members")).toHaveAttribute("aria-current", "step");
    expect(item("Details")).not.toHaveAttribute("aria-current");
    expect(item("Review")).not.toHaveAttribute("aria-current");
  });

  it("states done and upcoming steps in text, not by colour alone", () => {
    setup(1);
    expect(within(item("Details")).getByText("completed")).toBeInTheDocument();
    expect(within(item("Review")).getByText("upcoming")).toBeInTheDocument();
    expect(
      within(item("Members")).queryByText(/completed|upcoming/),
    ).toBeNull();
  });

  it("numbers the steps and hides the number marker from assistive technology", () => {
    const { container } = setup();
    const markers = container.querySelectorAll(".c__stepper__marker");
    expect(markers).toHaveLength(3);
    markers.forEach((m) => expect(m).toHaveAttribute("aria-hidden", "true"));
    expect(markers[2]).toHaveTextContent("3");
  });

  it("is not focusable", () => {
    const { container } = setup();
    expect(container.querySelectorAll("[tabindex], a, button")).toHaveLength(0);
  });

  it("has no current step when current is outside the range", () => {
    setup(5);
    expect(document.querySelector("[aria-current]")).toBeNull();
    expect(item("Review")).toHaveClass("c__stepper__step--done");
  });

  it("holds no literal colour or length in its stylesheet", () => {
    expect(scss.replace(/\/\/.*$/gm, "")).not.toMatch(
      /#[0-9a-f]{3,8}\b|\d+(px|rem)\b/i,
    );
  });
});

describe("Stepper in a Modal", () => {
  const Flow = ({ variant }: { variant?: "tab" }) => {
    const [step, setStep] = useState(0);
    const stepper = (
      <Stepper aria-label="Progress" steps={STEPS} current={step} />
    );
    const actions = (
      <>
        <Button onClick={() => setStep(step - 1)} disabled={step === 0}>
          Previous
        </Button>
        <Button onClick={() => setStep(step + 1)} disabled={step === 2}>
          Next
        </Button>
      </>
    );
    return variant === "tab" ? (
      <Modal
        isOpen
        onClose={() => {}}
        size={ModalSize.MEDIUM}
        variant="tab"
        tabs={[
          { id: "a", label: "A", title: "Tab title", content: "Tab body" },
        ]}
        stepper={stepper}
        rightActions={actions}
      />
    ) : (
      <Modal
        isOpen
        onClose={() => {}}
        size={ModalSize.MEDIUM}
        title="Create"
        stepper={stepper}
        rightActions={actions}
      >
        Body
      </Modal>
    );
  };

  const renderFlow = (variant?: "tab") =>
    render(
      <CunninghamProvider>
        <Flow variant={variant} />
      </CunninghamProvider>,
    );

  it("shows the stepper in the header of the default layout", async () => {
    renderFlow();
    const slot = await screen.findByRole("list", { name: "Progress" });
    expect(slot.closest(".c__modal__stepper")).not.toBeNull();
    expect(screen.getByText("Create")).toBeVisible();
  });

  it("shows the stepper in the header of the tab layout", async () => {
    renderFlow("tab");
    const slot = await screen.findByRole("list", { name: "Progress" });
    expect(slot.closest(".c__modal__stepper")).not.toBeNull();
    expect(screen.getByText("Tab body")).toBeVisible();
  });

  it("updates the stepper when moving between steps and keeps focus in the modal", async () => {
    renderFlow();
    await screen.findByRole("list", { name: "Progress" });
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(item("Details")).toHaveClass("c__stepper__step--done");
    expect(item("Members")).toHaveAttribute("aria-current", "step");
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(item("Review")).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("dialog")).toContainElement(
      document.activeElement as HTMLElement,
    );
    await userEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(item("Members")).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("dialog")).toContainElement(
      document.activeElement as HTMLElement,
    );
  });

  it("renders no stepper wrapper when none is given", async () => {
    render(
      <CunninghamProvider>
        <Modal isOpen onClose={() => {}} size={ModalSize.MEDIUM} title="Plain">
          Body
        </Modal>
      </CunninghamProvider>,
    );
    await screen.findByText("Plain");
    expect(document.querySelector(".c__modal__stepper")).toBeNull();
  });
});
