import clsx from "clsx";
import { HTMLAttributes } from "react";

export type AspectRatioProps = HTMLAttributes<HTMLDivElement> & {
  /** Width over height, e.g. `16 / 9`. Default 1; an invalid value is 1. */
  ratio?: number;
};

/** A box that keeps a fixed width-to-height ratio; its child fills it. */
export const AspectRatio = ({
  ratio = 1,
  className,
  style,
  ...props
}: AspectRatioProps) => (
  <div
    {...props}
    className={clsx("c__aspect-ratio", className)}
    style={{
      aspectRatio: String(Number.isFinite(ratio) && ratio > 0 ? ratio : 1),
      ...style,
    }}
  />
);
