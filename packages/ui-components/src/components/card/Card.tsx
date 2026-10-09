import clsx from "clsx";
import { ReactNode, useRef } from "react";
import { mergeProps, useButton } from "react-aria";
import { Link } from "react-aria-components";
import {
  ButtonCardProps,
  CardProps,
  LinkCardProps,
  StaticCardProps,
} from "./types";

const Sections = ({
  header,
  footer,
  children,
}: {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) => (
  <>
    {header != null && <div className="c__card__header">{header}</div>}
    <div className="c__card__body">{children}</div>
    {footer != null && <div className="c__card__footer">{footer}</div>}
  </>
);

const ButtonCard = ({
  header,
  footer,
  children,
  className,
  onPress,
  ...props
}: ButtonCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { buttonProps } = useButton({ elementType: "div", onPress }, ref);
  return (
    <div
      {...mergeProps(props, buttonProps)}
      ref={ref}
      className={clsx("c__card", "c__card--interactive", className)}
    >
      <Sections header={header} footer={footer}>
        {children}
      </Sections>
    </div>
  );
};

const LinkCard = ({
  header,
  footer,
  children,
  className,
  ...props
}: LinkCardProps) => (
  <Link
    {...props}
    className={clsx("c__card", "c__card--interactive", className)}
  >
    <Sections header={header} footer={footer}>
      {children}
    </Sections>
  </Link>
);

const StaticCard = ({
  header,
  footer,
  children,
  className,
  ...props
}: StaticCardProps) => (
  <div className={clsx("c__card", className)} {...props}>
    <Sections header={header} footer={footer}>
      {children}
    </Sections>
  </div>
);

export const Card = (props: CardProps) => {
  if (props.onPress !== undefined) return <ButtonCard {...props} />;
  if (props.href !== undefined) return <LinkCard {...props} />;
  return <StaticCard {...props} />;
};
