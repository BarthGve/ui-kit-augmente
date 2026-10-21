import clsx from "clsx";
import {
  ComponentProps,
  Fragment,
  KeyboardEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Menu,
  MenuItem,
  Popover,
  Separator,
  SubmenuTrigger,
} from "react-aria-components";
import { Kbd, KbdGroup, ModKbd } from ":/components/kbd";
import { MenuItemBody } from "../menu/MenuItemBody";
import type {
  MenuItem as SharedMenuItem,
  MenuItemAction,
  MenuItemSeparator,
} from "../menu/types";

export type MenubarItemAction = Omit<MenuItemAction, "children"> & {
  /** Keys of the shortcut, shown with `Kbd`; `"Mod"` is ⌘ on macOS and Ctrl elsewhere. */
  shortcut?: string[];
  /** The item is one choice among several: `menuitemradio` instead of `menuitemcheckbox`. */
  radio?: boolean;
  /** Sub-menu. */
  children?: SharedMenuItem[];
};
export type MenubarItem = MenubarItemAction | MenuItemSeparator;
export type MenubarMenu = { id?: string; label: string; items: MenubarItem[] };

export type MenubarProps = {
  /** Names the menubar. */
  "aria-label": string;
  menus: MenubarMenu[];
  className?: string;
};

const isSeparator = (
  item: MenubarItem | SharedMenuItem,
): item is MenuItemSeparator => "type" in item && item.type === "separator";

const shortcutKeys = (shortcut: string[]): ReactNode => (
  <KbdGroup className="c__menubar__shortcut">
    {shortcut.map((key, i) =>
      key === "Mod" ? <ModKbd key={i} /> : <Kbd key={i}>{key}</Kbd>,
    )}
  </KbdGroup>
);

/**
 * Persistent bar of menus, as in a desktop application. Arrow keys move
 * between the menus, Enter, Space or ArrowDown open one, Escape closes it,
 * and while one is open the pointer or the horizontal arrows switch to the
 * neighbouring menu. The items are those of `DropdownMenu`: checkable
 * entries, sub-menus, and shortcuts drawn with `Kbd`.
 */
export const Menubar = ({ menus, className, ...props }: MenubarProps) => {
  const [openIndex, setOpenIndex] = useState<number>();
  const [focusIndex, setFocusIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const count = menus.length;

  useEffect(() => {
    if (openIndex === undefined) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element;
      if (
        !root.current?.contains(target) &&
        !target.closest(".c__menubar__popover")
      ) {
        setOpenIndex(undefined);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [openIndex]);

  const focusTrigger = (index: number) => {
    const target = (index + count) % count;
    setFocusIndex(target);
    triggers.current[target]?.focus();
    return target;
  };

  const close = (restoreFocus: boolean) => {
    const was = openIndex;
    setOpenIndex(undefined);
    if (restoreFocus && was !== undefined) triggers.current[was]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return;
    const target = event.target as HTMLElement;
    const key = event.key;
    const onTrigger = target.hasAttribute("data-menubar-trigger");
    const inTopMenu = target
      .closest('[role="menu"]')
      ?.hasAttribute("data-menubar-top-menu");
    if (!onTrigger && !inTopMenu) return;
    const current = onTrigger
      ? Number(target.getAttribute("data-menubar-trigger"))
      : openIndex!;

    if (key === "ArrowRight" || key === "ArrowLeft") {
      // A sub-menu trigger keeps its own ArrowRight.
      if (
        !onTrigger &&
        key === "ArrowRight" &&
        target.hasAttribute("aria-haspopup")
      )
        return;
      event.preventDefault();
      const next = focusTrigger(current + (key === "ArrowRight" ? 1 : -1));
      if (openIndex !== undefined) setOpenIndex(next);
    } else if (onTrigger && (key === "Home" || key === "End")) {
      event.preventDefault();
      focusTrigger(key === "Home" ? 0 : count - 1);
    } else if (
      onTrigger &&
      (key === "ArrowDown" || key === "Enter" || key === " ")
    ) {
      event.preventDefault();
      setFocusIndex(current);
      setOpenIndex(current);
    }
  };

  const renderItems = (items: (MenubarItem | SharedMenuItem)[]) =>
    items.map((item, index) => {
      if (isSeparator(item)) return <Separator key={`separator-${index}`} />;
      if (item.isHidden) return null;
      const key = item.id ?? item.label;
      const action = item as MenubarItemAction;
      if (item.children?.length) {
        return (
          <SubmenuTrigger key={key}>
            <MenuItem
              className="c__menubar__item"
              isDisabled={item.isDisabled}
              textValue={item.label}
            >
              <MenuItemBody
                icon={item.icon}
                label={item.label}
                subText={item.subText}
                hasSubmenu
              />
            </MenuItem>
            <Popover
              offset={-4}
              shouldFlip
              containerPadding={16}
              className="c__menubar__popover"
            >
              <Menu className="c__menubar__menu">
                {renderItems(item.children)}
              </Menu>
            </Popover>
          </SubmenuTrigger>
        );
      }
      const checkable = item.isChecked !== undefined || action.radio;
      return (
        <Fragment key={key}>
          <MenuItem
            className={clsx("c__menubar__item", {
              "c__menubar__item--danger": item.variant === "danger",
            })}
            textValue={item.label}
            isDisabled={item.isDisabled}
            data-testid={item.testId}
            render={
              checkable
                ? (renderProps) => (
                    <div
                      {...(renderProps as ComponentProps<"div">)}
                      role={action.radio ? "menuitemradio" : "menuitemcheckbox"}
                      aria-checked={!!item.isChecked}
                    />
                  )
                : undefined
            }
            onAction={() => {
              item.callback?.();
              if (!item.keepOpen) close(true);
            }}
          >
            <MenuItemBody
              icon={item.icon}
              label={item.label}
              subText={item.subText}
              isChecked={item.isChecked}
            />
            {action.shortcut && shortcutKeys(action.shortcut)}
          </MenuItem>
        </Fragment>
      );
    });

  return (
    <div
      {...props}
      ref={root}
      role="menubar"
      className={clsx("c__menubar", className)}
      onKeyDown={onKeyDown}
    >
      {menus.map((menu, index) => (
        <Fragment key={menu.id ?? menu.label}>
          <button
            ref={(el) => {
              triggers.current[index] = el;
            }}
            type="button"
            role="menuitem"
            className="c__menubar__trigger"
            data-menubar-trigger={index}
            aria-haspopup="menu"
            aria-expanded={openIndex === index}
            tabIndex={focusIndex === index ? 0 : -1}
            onFocus={() => setFocusIndex(index)}
            onClick={() =>
              setOpenIndex(openIndex === index ? undefined : index)
            }
            onPointerEnter={() => {
              // While a menu is open, pointing at another one switches to it.
              if (openIndex !== undefined && openIndex !== index)
                setOpenIndex(index);
            }}
          >
            {menu.label}
          </button>
          <Popover
            isOpen={openIndex === index}
            isNonModal
            triggerRef={{ current: triggers.current[index] }}
            placement="bottom start"
            offset={4}
            shouldFlip
            containerPadding={16}
            className="c__menubar__popover"
            onOpenChange={(open) => {
              if (!open) close(true);
            }}
          >
            <Menu
              aria-label={menu.label}
              autoFocus="first"
              className="c__menubar__menu"
              data-menubar-top-menu=""
            >
              {renderItems(menu.items)}
            </Menu>
          </Popover>
        </Fragment>
      ))}
    </div>
  );
};
