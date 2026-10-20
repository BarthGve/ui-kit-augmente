import clsx from "clsx";
import { HTMLAttributes } from "react";

export type GaugeProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "role" | "aria-label"
> & {
  value: number;
  min?: number;
  max?: number;
  /** Accessible name of the meter. */
  label: string;
};

const WARNING_RATIO = 0.8;

export const Gauge = ({
  value,
  min = 0,
  max = 100,
  label,
  className,
  ...props
}: GaugeProps) => {
  const span = max - min;
  const clamped = Number.isFinite(value)
    ? Math.min(Math.max(value, min), max)
    : min;
  const ratio = span > 0 ? (clamped - min) / span : 0;

  return (
    <div
      {...props}
      className={clsx("c__gauge", className)}
      role="meter"
      aria-label={label || undefined}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={clamped}
    >
      <div
        className={clsx("c__gauge__fill", {
          "c__gauge__fill--warning": ratio >= WARNING_RATIO && ratio < 1,
          "c__gauge__fill--error": ratio >= 1,
        })}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
};
