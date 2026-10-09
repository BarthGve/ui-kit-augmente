import { HTMLAttributes, ReactNode } from "react";
import type { PressEvent } from "react-aria";
import type { LinkProps } from "react-aria-components";

type CardSlots = {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

export type StaticCardProps = HTMLAttributes<HTMLDivElement> &
  CardSlots & { href?: never; onPress?: never };

/** The whole card is a link (`<a href>`). */
export type LinkCardProps = Omit<
  LinkProps,
  "children" | "className" | "style" | "onPress"
> &
  CardSlots & { href: string; onPress?: never };

/** The whole card is a button (`<div role="button">`). */
export type ButtonCardProps = HTMLAttributes<HTMLDivElement> &
  CardSlots & { onPress: (event: PressEvent) => void; href?: never };

/** `href` and `onPress` are mutually exclusive; neither = a static card. */
export type CardProps = StaticCardProps | LinkCardProps | ButtonCardProps;
