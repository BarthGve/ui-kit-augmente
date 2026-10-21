import clsx from "clsx";
import {
  Toolbar as AriaToolbar,
  ToolbarProps as AriaToolbarProps,
} from "react-aria-components";

export type ToolbarProps = Omit<AriaToolbarProps, "orientation">;

/**
 * Toolbar of actions: a single tab stop, left and right arrow keys move
 * between the controls. Compose it with `Button` and `VerticalSeparator`;
 * controls that do not fit wrap onto a new line.
 */
export const Toolbar = ({ className, ...props }: ToolbarProps) => (
  <AriaToolbar
    {...props}
    orientation="horizontal"
    className={clsx(
      "c__toolbar",
      typeof className === "string" ? className : undefined,
    )}
  />
);
