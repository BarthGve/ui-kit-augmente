import clsx from "clsx";
import { HTMLAttributes, ReactNode, useRef } from "react";
import { mergeProps, useButton } from "react-aria";
import { Link, LinkProps } from "react-aria-components";
import { useCunningham } from ":/components/provider";

export type BubbleVariant =
  | "default"
  | "secondary"
  | "muted"
  | "tinted"
  | "outline"
  | "ghost"
  | "destructive";

export type BubbleProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  children: ReactNode;
  variant?: BubbleVariant;
  /** Side of the conversation: `start` for others, `end` for the reader. */
  align?: "start" | "end";
  /** Makes the bubble a link. */
  href?: string;
  /** Makes the bubble a button. */
  onPress?: () => void;
  /** Text of the error shown with the `destructive` variant. */
  errorText?: ReactNode;
};

/**
 * A message bubble. With `href` it is a link, with `onPress` a button. The
 * `destructive` variant also says what went wrong in text, so the error is
 * not carried by colour alone.
 */
export const Bubble = ({
  children,
  variant = "default",
  align = "start",
  href,
  onPress,
  errorText,
  className,
  ...props
}: BubbleProps) => {
  const { t } = useCunningham();
  const buttonRef = useRef<HTMLDivElement>(null);
  const { buttonProps } = useButton({ elementType: "div", onPress }, buttonRef);
  const classes = clsx(
    "c__bubble",
    `c__bubble--${variant}`,
    `c__bubble--${align}`,
    className,
  );

  const body =
    href !== undefined ? (
      <Link
        {...(props as LinkProps)}
        href={href}
        className={clsx(classes, "c__bubble--interactive")}
      >
        {children}
      </Link>
    ) : onPress ? (
      <div
        {...mergeProps(props, buttonProps)}
        ref={buttonRef}
        className={clsx(classes, "c__bubble--interactive")}
      >
        {children}
      </div>
    ) : (
      <div {...props} className={classes}>
        {children}
      </div>
    );

  if (variant !== "destructive") return body;
  return (
    <div className={clsx("c__bubble-error", `c__bubble-error--${align}`)}>
      {body}
      <span className="c__bubble-error__text">
        {errorText ?? t("components.bubble.error")}
      </span>
    </div>
  );
};

export type BubbleGroupProps = HTMLAttributes<HTMLDivElement> & {
  align?: "start" | "end";
};

/** Consecutive bubbles of the same sender. */
export const BubbleGroup = ({
  align = "start",
  className,
  ...props
}: BubbleGroupProps) => (
  <div
    {...props}
    className={clsx("c__bubble-group", `c__bubble-group--${align}`, className)}
  />
);

export type Reaction = { emoji: string; count: number; label?: string };

export type BubbleReactionsProps = Omit<
  HTMLAttributes<HTMLUListElement>,
  "children"
> & {
  reactions: Reaction[];
  "aria-label"?: string;
};

/** The reactions of a message: each one read as "emoji, count". */
export const BubbleReactions = ({
  reactions,
  className,
  "aria-label": ariaLabel,
  ...props
}: BubbleReactionsProps) => {
  const { t } = useCunningham();
  return (
    <div
      role="group"
      aria-label={ariaLabel ?? t("components.bubble.reactions")}
    >
      <ul {...props} className={clsx("c__bubble-reactions", className)}>
        {reactions.map((reaction) => (
          <li
            key={reaction.emoji}
            className="c__bubble-reactions__item"
            aria-label={`${reaction.label ?? reaction.emoji}, ${reaction.count}`}
          >
            <span aria-hidden="true">
              {reaction.emoji} {reaction.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
