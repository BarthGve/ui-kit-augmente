import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from ":/components/button";
import { Modal, ModalSize } from ":/components/modal";
import { Stepper } from "./Stepper";

const STEPS = [{ label: "Details" }, { label: "Members" }, { label: "Review" }];

const meta: Meta<typeof Stepper> = {
  title: "Components/Stepper",
  component: Stepper,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          'Progress through a multi-step flow, a status display (not a control). The current step carries `aria-current="step"`; done and upcoming steps are also written in text for assistive technology. Pass it to a `Modal` through its `stepper` prop to show it in the header.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Stepper>;

export const Default: Story = {
  args: { "aria-label": "Progress", steps: STEPS, current: 1 },
};

export const InModal: Story = {
  render: () => {
    const [step, setStep] = useState(0);
    return (
      <Modal
        isOpen
        onClose={() => {}}
        size={ModalSize.MEDIUM}
        title="Create a space"
        stepper={<Stepper aria-label="Progress" steps={STEPS} current={step} />}
        rightActions={
          <>
            <Button
              color="neutral"
              variant="secondary"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
            >
              Previous
            </Button>
            <Button onClick={() => setStep(step + 1)} disabled={step === 2}>
              Next
            </Button>
          </>
        }
      >
        Step {step + 1} of {STEPS.length}
      </Modal>
    );
  },
};
