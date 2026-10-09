import clsx from "clsx";
import { CardProps } from "./types";

export const Card = ({
  header,
  footer,
  children,
  className,
  ...props
}: CardProps) => (
  <div className={clsx("c__card", className)} {...props}>
    {header != null && <div className="c__card__header">{header}</div>}
    <div className="c__card__body">{children}</div>
    {footer != null && <div className="c__card__footer">{footer}</div>}
  </div>
);
