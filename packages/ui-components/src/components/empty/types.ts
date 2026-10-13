import { HTMLAttributes, ReactNode } from "react";

export type EmptyProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  /** Required: says why nothing is shown. Rendered as a heading. */
  title: ReactNode;
  /** Heading level of the title, chosen for the page outline. Default 3. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  description?: ReactNode;
  /** Icon or image. Decorative media is the caller's to hide (`aria-hidden`). */
  media?: ReactNode;
  /** Typically one or two `Button`s. */
  actions?: ReactNode;
  className?: string;
};
