import clsx from "clsx";
import { Fragment, HTMLAttributes, MouseEventHandler, useState } from "react";
import { useCunningham } from ":/components/provider";

export type BreadcrumbItem = {
  label: string;
  /** Without `href`, the item is plain text (usually the current page). */
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export type BreadcrumbProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  items: BreadcrumbItem[];
  /**
   * Above this many items, the middle ones collapse behind a button: the
   * first item and the last `maxItems - 1` stay visible.
   */
  maxItems?: number;
};

const Item = ({
  item,
  current,
}: {
  item: BreadcrumbItem;
  current: boolean;
}) => {
  const props = {
    className: "c__breadcrumb__item",
    "aria-current": current ? ("page" as const) : undefined,
  };
  return item.href ? (
    <a {...props} href={item.href} onClick={item.onClick}>
      {item.label}
    </a>
  ) : (
    <span {...props}>{item.label}</span>
  );
};

export const Breadcrumb = ({
  items,
  maxItems = 4,
  className,
  ...props
}: BreadcrumbProps) => {
  const { t } = useCunningham();
  const [expanded, setExpanded] = useState(false);
  const tail = Math.max(maxItems - 1, 1);
  const collapsed = !expanded && items.length > maxItems;
  const visible = collapsed
    ? [items[0], null, ...items.slice(items.length - tail)]
    : items;

  return (
    <nav {...props} className={clsx("c__breadcrumb", className)}>
      <ol className="c__breadcrumb__list">
        {visible.map((item, index) => (
          <Fragment key={item ? `${index}-${item.label}` : "collapsed"}>
            {index > 0 && (
              <li className="c__breadcrumb__separator" aria-hidden="true">
                /
              </li>
            )}
            <li className="c__breadcrumb__entry">
              {item ? (
                <Item item={item} current={item === items[items.length - 1]} />
              ) : (
                <button
                  type="button"
                  className="c__breadcrumb__expand"
                  aria-expanded="false"
                  aria-label={t("components.breadcrumb.expand_aria")}
                  onClick={() => setExpanded(true)}
                >
                  …
                </button>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
};
