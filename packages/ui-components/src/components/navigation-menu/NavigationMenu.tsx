import clsx from "clsx";
import {
  FocusEvent,
  KeyboardEvent,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useCunningham } from ":/components/provider";

export type NavigationMenuItem = {
  id: string;
  label: string;
  /** A plain link. Without `href`, the item opens `content` in a panel. */
  href?: string;
  /** Marks the link of the page being shown (`aria-current="page"`). */
  current?: boolean;
  /** Content of the fly-out panel, usually a list of links. */
  content?: ReactNode;
};

export type NavigationMenuProps = {
  /** Names the navigation landmark. */
  "aria-label": string;
  items: NavigationMenuItem[];
  className?: string;
};

/**
 * Site navigation: links, and triggers whose fly-out panels hold more links
 * (the "disclosure navigation" pattern, so the panels are not `menu` roles).
 * Click, Enter, Space or ArrowDown open a panel, Escape closes it and gives
 * the focus back, and the left and right arrows move between the items. On
 * narrow screens the list collapses behind a button. For application commands
 * use the `Menubar`.
 */
export const NavigationMenu = ({
  items,
  className,
  ...props
}: NavigationMenuProps) => {
  const { t } = useCunningham();
  const [openId, setOpenId] = useState<string>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const baseId = useId();

  useEffect(() => {
    if (openId === undefined) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpenId(undefined);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [openId]);

  const tops = () =>
    Array.from(
      root.current?.querySelectorAll<HTMLElement>("[data-navigation-item]") ??
        [],
    );

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (event.key === "Escape" && openId !== undefined) {
      event.preventDefault();
      const trigger = root.current?.querySelector<HTMLElement>(
        `[data-navigation-item="${openId}"]`,
      );
      setOpenId(undefined);
      trigger?.focus();
      return;
    }
    if (!target.hasAttribute("data-navigation-item")) return;
    const list = tops();
    const index = list.indexOf(target);
    const jump = {
      ArrowRight: (index + 1) % list.length,
      ArrowLeft: (index - 1 + list.length) % list.length,
      Home: 0,
      End: list.length - 1,
    }[event.key];
    if (jump !== undefined) {
      event.preventDefault();
      list[jump].focus();
    } else if (event.key === "ArrowDown" && target.tagName === "BUTTON") {
      event.preventDefault();
      setOpenId(target.getAttribute("data-navigation-item")!);
    }
  };

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    // Focus leaving the whole menu closes the open panel.
    if (
      openId !== undefined &&
      !event.currentTarget.contains(event.relatedTarget as Node | null)
    ) {
      setOpenId(undefined);
    }
  };

  return (
    <nav
      {...props}
      ref={root}
      className={clsx("c__navigation-menu", className)}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      <button
        type="button"
        className="c__navigation-menu__toggle"
        aria-expanded={mobileOpen}
        aria-controls={`${baseId}-list`}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {t("components.navigationMenu.toggle")}
      </button>
      <ul
        id={`${baseId}-list`}
        className={clsx("c__navigation-menu__list", {
          "c__navigation-menu__list--open": mobileOpen,
        })}
      >
        {items.map((item) => {
          const panelId = `${baseId}-panel-${item.id}`;
          const open = openId === item.id;
          return (
            <li key={item.id} className="c__navigation-menu__entry">
              {item.content === undefined ? (
                <a
                  href={item.href}
                  className="c__navigation-menu__link"
                  data-navigation-item={item.id}
                  aria-current={item.current ? "page" : undefined}
                >
                  {item.label}
                </a>
              ) : (
                <>
                  <button
                    type="button"
                    className="c__navigation-menu__trigger"
                    data-navigation-item={item.id}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenId(open ? undefined : item.id)}
                  >
                    {item.label}
                  </button>
                  {open && (
                    <div id={panelId} className="c__navigation-menu__panel">
                      {item.content}
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
