import clsx from "clsx";
import { HTMLAttributes, ReactNode } from "react";

export type MarkerProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  /** `separator` draws a rule on each side of the label. Default `default`. */
  variant?: "default" | "border" | "separator";
  icon?: ReactNode;
  /** Announces the marker as a status, for a note that reports progress. */
  status?: boolean;
};

/**
 * An inline note between messages or events: a system line, a divider such as
 * "Yesterday". It is presentational unless it is a `status`; a marker with an
 * icon and no text needs an `aria-label`.
 */
export const Marker = ({
  variant = "default",
  icon,
  status,
  className,
  children,
  ...props
}: MarkerProps) => {
  const iconOnly = !!icon && !children;
  return (
    <div
      {...props}
      role={
        status ? "status" : iconOnly && props["aria-label"] ? "img" : undefined
      }
      className={clsx("c__marker", `c__marker--${variant}`, className)}
    >
      {variant === "separator" && (
        <span className="c__marker__rule" aria-hidden="true" />
      )}
      {icon && (
        <span className="c__marker__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children && <span className="c__marker__label">{children}</span>}
      {variant === "separator" && (
        <span className="c__marker__rule" aria-hidden="true" />
      )}
    </div>
  );
};
