import clsx from "clsx";
import { ElementType, HTMLAttributes, OlHTMLAttributes } from "react";

type Box<T> = HTMLAttributes<T> & { className?: string };

export type HeadingProps = Box<HTMLHeadingElement> & {
  /** Visual style. Default `h2`. */
  variant?: "h1" | "h2" | "h3" | "h4";
  /** Element, which sets the document outline, independent of the style. Default: the element of `variant`. */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div" | "p" | "span";
};

/**
 * A heading. The style (`variant`) and the level (`as`) are separate: pick
 * the level from the page's outline and the style from the design, so the
 * styling never makes a heading skip a level.
 */
export const Heading = ({
  variant = "h2",
  as,
  className,
  ...props
}: HeadingProps) => {
  const Tag: ElementType = as ?? variant;
  return (
    <Tag
      {...props}
      className={clsx("c__typography", `c__typography--${variant}`, className)}
    />
  );
};

export type TextProps = Box<HTMLParagraphElement> & {
  variant?: "body" | "lead" | "large" | "small" | "muted";
  as?: "p" | "span" | "div";
};

/** Body text and its variants: lead, large, small and muted. */
export const Text = ({
  variant = "body",
  as: Tag = "p",
  className,
  ...props
}: TextProps) => (
  <Tag
    {...props}
    className={clsx("c__typography", `c__typography--${variant}`, className)}
  />
);

export const Blockquote = ({ className, ...props }: Box<HTMLQuoteElement>) => (
  <blockquote
    {...props}
    className={clsx("c__typography", "c__typography--blockquote", className)}
  />
);

export const InlineCode = ({ className, ...props }: Box<HTMLElement>) => (
  <code
    {...props}
    className={clsx("c__typography", "c__typography--code", className)}
  />
);

export type TypographyListProps = Box<HTMLUListElement> &
  Pick<OlHTMLAttributes<HTMLOListElement>, "start"> & { ordered?: boolean };

export const TypographyList = ({
  ordered,
  className,
  ...props
}: TypographyListProps) => {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag
      {...props}
      className={clsx("c__typography", "c__typography--list", className)}
    />
  );
};
