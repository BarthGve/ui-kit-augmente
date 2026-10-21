import clsx from "clsx";
import { HTMLAttributes } from "react";

export type ButtonGroupProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
};

/**
 * Presentational wrapper that joins adjacent `Button`s into one control:
 * shared borders, radius only on the outer edges. It does not touch the
 * buttons themselves, so every variant, size and a split button (a button
 * next to a `DropdownMenu` trigger) work inside it. Give it an `aria-label`
 * to name the group.
 */
export const ButtonGroup = ({
  orientation = "horizontal",
  className,
  ...props
}: ButtonGroupProps) => (
  <div
    {...props}
    role="group"
    className={clsx(
      "c__button-group",
      `c__button-group--${orientation}`,
      className,
    )}
  />
);
