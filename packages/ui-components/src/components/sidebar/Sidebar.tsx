import clsx from "clsx";
import { ReactNode, useEffect, useState } from "react";
import { Icon } from ":/components/icon";
import { useCunningham } from ":/components/provider";
import { Sheet } from ":/components/sheet";
import { Tooltip } from ":/components/tooltip";
import { useResponsive } from ":/hooks/useResponsive";

export type SidebarItem = {
  id: string;
  label: string;
  icon: ReactNode;
  href: string;
  /** Marks the item of the page being shown (`aria-current="page"`). */
  current?: boolean;
};

export type SidebarGroup = { label?: string; items: SidebarItem[] };

export type SidebarProps = {
  /** Names the navigation landmark. */
  "aria-label": string;
  groups: SidebarGroup[];
  header?: ReactNode;
  footer?: ReactNode;
  /** Collapsed (icons only) state, when controlled. */
  collapsed?: boolean;
  /** Collapsed state, when uncontrolled. */
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Open state of the off-canvas sheet shown on narrow screens. */
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  className?: string;
};

const isTyping = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  return (
    !!el &&
    (/^(input|textarea|select)$/i.test(el.tagName) || el.isContentEditable)
  );
};

/**
 * Application navigation: header, grouped links, footer, and a collapsed mode
 * that keeps only the icons (their names stay available to assistive
 * technology and as tooltips). A button and `Ctrl`/`⌘` + `B` toggle it. On
 * narrow screens it becomes an off-canvas `Sheet`. Place it in the left panel
 * of the layout.
 */
export const Sidebar = ({
  groups,
  header,
  footer,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  mobileOpen = false,
  onMobileOpenChange,
  className,
  ...props
}: SidebarProps) => {
  const { t } = useCunningham();
  const { isDesktop } = useResponsive();
  const [inner, setInner] = useState(defaultCollapsed);
  const isCollapsed = isDesktop && (collapsed ?? inner);

  const setCollapsed = (next: boolean) => {
    if (collapsed === undefined) setInner(next);
    onCollapsedChange?.(next);
  };

  useEffect(() => {
    if (!isDesktop) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "b" &&
        !isTyping(event.target)
      ) {
        event.preventDefault();
        setCollapsed(!isCollapsed);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  const content = (
    <nav
      aria-label={props["aria-label"]}
      className={clsx(
        "c__sidebar",
        { "c__sidebar--collapsed": isCollapsed },
        className,
      )}
    >
      {header && <div className="c__sidebar__header">{header}</div>}
      <div className="c__sidebar__groups">
        {groups.map((group, index) => (
          <div key={group.label ?? index} className="c__sidebar__group">
            {group.label && !isCollapsed && (
              <div className="c__sidebar__group-label">{group.label}</div>
            )}
            <ul className="c__sidebar__list">
              {group.items.map((item) => {
                const link = (
                  <a
                    href={item.href}
                    className="c__sidebar__link"
                    aria-current={item.current ? "page" : undefined}
                  >
                    <span className="c__sidebar__icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span
                      className={
                        isCollapsed ? "c__offscreen" : "c__sidebar__label"
                      }
                    >
                      {item.label}
                    </span>
                  </a>
                );
                return (
                  <li key={item.id}>
                    {isCollapsed ? (
                      <Tooltip content={item.label} placement="right">
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="c__sidebar__footer">
        {footer}
        {isDesktop && (
          <button
            type="button"
            className="c__sidebar__toggle"
            aria-expanded={!isCollapsed}
            aria-keyshortcuts="Control+B Meta+B"
            aria-label={
              isCollapsed
                ? t("components.sidebar.expand")
                : t("components.sidebar.collapse")
            }
            onClick={() => setCollapsed(!isCollapsed)}
          >
            <Icon
              name={isCollapsed ? "chevron_right" : "chevron_left"}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </nav>
  );

  if (isDesktop) return content;

  return (
    <Sheet
      isOpen={mobileOpen}
      onClose={() => onMobileOpenChange?.(false)}
      side="left"
      title={props["aria-label"]}
    >
      {content}
    </Sheet>
  );
};
