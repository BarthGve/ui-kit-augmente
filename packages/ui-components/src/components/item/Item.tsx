import clsx from "clsx";
import {
  createContext,
  HTMLAttributes,
  ReactNode,
  useContext,
  useRef,
} from "react";
import { mergeProps, useButton } from "react-aria";
import { Link } from "react-aria-components";

const InGroup = createContext(false);

export type ItemProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  media?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Controls at the end of the row. They stay outside any link or button. */
  actions?: ReactNode;
  variant?: "default" | "outlined" | "muted";
  size?: "medium" | "small";
  /** Makes the item a link. */
  href?: string;
  /** Makes the item a button. */
  onPress?: () => void;
};

const Content = ({
  media,
  title,
  description,
}: Pick<ItemProps, "media" | "title" | "description">) => (
  <>
    {media != null && <div className="c__item__media">{media}</div>}
    <div className="c__item__text">
      <div className="c__item__title">{title}</div>
      {description != null && (
        <div className="c__item__description">{description}</div>
      )}
    </div>
  </>
);

const ButtonMain = ({
  onPress,
  ...content
}: Pick<ItemProps, "onPress" | "media" | "title" | "description">) => {
  const ref = useRef<HTMLDivElement>(null);
  const { buttonProps } = useButton({ elementType: "div", onPress }, ref);
  return (
    <div
      {...mergeProps(buttonProps)}
      ref={ref}
      className="c__item__main c__item__main--interactive"
    >
      <Content {...content} />
    </div>
  );
};

/**
 * A row for lists: optional media, a title, a description and an actions area.
 * With `href` it is a link, with `onPress` a button (same pattern as `Card`),
 * otherwise static. The actions sit beside that link or button, never inside
 * it. Group items with `ItemGroup`.
 */
export const Item = ({
  media,
  title,
  description,
  actions,
  variant = "default",
  size = "medium",
  href,
  onPress,
  className,
  ...props
}: ItemProps) => {
  const inGroup = useContext(InGroup);
  const Tag = inGroup ? "li" : "div";
  const content = { media, title, description };

  return (
    <Tag
      {...(props as HTMLAttributes<HTMLElement>)}
      className={clsx(
        "c__item",
        `c__item--${variant}`,
        `c__item--${size}`,
        className,
      )}
    >
      {href !== undefined ? (
        <Link href={href} className="c__item__main c__item__main--interactive">
          <Content {...content} />
        </Link>
      ) : onPress ? (
        <ButtonMain onPress={onPress} {...content} />
      ) : (
        <div className="c__item__main">
          <Content {...content} />
        </div>
      )}
      {actions != null && <div className="c__item__actions">{actions}</div>}
    </Tag>
  );
};

export type ItemGroupProps = HTMLAttributes<HTMLUListElement>;

/** A list of items. */
export const ItemGroup = ({ className, ...props }: ItemGroupProps) => (
  <InGroup.Provider value>
    <ul {...props} className={clsx("c__item-group", className)} />
  </InGroup.Provider>
);
