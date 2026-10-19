import clsx from "clsx";
import { ReactNode } from "react";
import { ToggleButton } from "react-aria-components";

export type ToggleProps = {
  children?: ReactNode;
  /** Leading icon. An icon-only toggle needs an `aria-label`. */
  icon?: ReactNode;
  "aria-label"?: string;
  /** Pressed state, when controlled. */
  pressed?: boolean;
  /** Pressed state, when uncontrolled. */
  defaultPressed?: boolean;
  onChange?: (pressed: boolean) => void;
  variant?: "default" | "outlined";
  size?: "medium" | "small" | "nano";
  disabled?: boolean;
  className?: string;
};

/**
 * Button that stays pressed: a tool or a format option. It is a native button
 * with `aria-pressed`; click, Enter and Space switch it. The pressed state
 * shows through a bar under the label and a heavier weight, not colour alone.
 */
export const Toggle = ({
  children,
  icon,
  pressed,
  defaultPressed,
  onChange,
  variant = "default",
  size = "medium",
  disabled,
  className,
  ...props
}: ToggleProps) => (
  <ToggleButton
    {...props}
    className={clsx(
      "c__toggle",
      `c__toggle--${variant}`,
      `c__toggle--${size}`,
      className,
    )}
    isSelected={pressed}
    defaultSelected={defaultPressed}
    onChange={onChange}
    isDisabled={disabled}
  >
    {icon && (
      <span className="c__toggle__icon" aria-hidden="true">
        {icon}
      </span>
    )}
    {children}
  </ToggleButton>
);
