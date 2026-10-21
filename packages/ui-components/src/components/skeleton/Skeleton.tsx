import clsx from "clsx";
import { HTMLAttributes } from "react";

export type SkeletonShape = "line" | "block" | "circle";

export type SkeletonProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  shape?: SkeletonShape;
  /** A number is read as pixels, a string is used as is (`"50%"`, `"4rem"`). */
  width?: number | string;
  height?: number | string;
};

const size = (value?: number | string) =>
  typeof value === "number" ? `${value}px` : value;

export const Skeleton = ({
  shape = "line",
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) => (
  <div
    {...props}
    aria-hidden="true"
    className={clsx("c__skeleton", `c__skeleton--${shape}`, className)}
    style={{
      width: size(width),
      // A circle with a single side given stays round.
      height: size(height ?? (shape === "circle" ? width : undefined)),
      ...style,
    }}
  />
);
