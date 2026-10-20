import clsx from "clsx";
import { HTMLAttributes } from "react";
import { useCunningham } from ":/components/provider";

export type StepperStep = { label: string };

export type StepperProps = Omit<
  HTMLAttributes<HTMLOListElement>,
  "children"
> & {
  steps: StepperStep[];
  /** Index (0-based) of the current step; the ones before it are done. */
  current: number;
};

/**
 * Progress through a multi-step flow. It is a status display, not a control:
 * the current step carries `aria-current="step"` and the state of the others
 * is written in text, not only shown by colour.
 */
export const Stepper = ({
  steps,
  current,
  className,
  ...props
}: StepperProps) => {
  const { t } = useCunningham();
  return (
    <ol {...props} className={clsx("c__stepper", className)}>
      {steps.map((step, index) => {
        const state =
          index < current ? "done" : index === current ? "current" : "upcoming";
        return (
          <li
            key={`${index}-${step.label}`}
            className={clsx("c__stepper__step", `c__stepper__step--${state}`)}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span className="c__stepper__marker" aria-hidden="true">
              {index + 1}
            </span>
            <span className="c__stepper__label">{step.label}</span>
            {state === "done" && (
              <span className="c__offscreen">
                {t("components.stepper.completed")}
              </span>
            )}
            {state === "upcoming" && (
              <span className="c__offscreen">
                {t("components.stepper.upcoming")}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
};
