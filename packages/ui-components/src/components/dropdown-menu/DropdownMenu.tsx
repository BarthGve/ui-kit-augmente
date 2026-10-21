import {
  Menu,
  MenuItem,
  Popover,
  Separator,
  SubmenuTrigger,
} from "react-aria-components";
import { useInteractOutside } from "react-aria";
import { MenuItemAction, MenuItemSeparator } from "../menu/types";
import { MenuItemBody } from "../menu/MenuItemBody";
import { DropdownMenuItem } from "./types";
import {
  Children,
  cloneElement,
  ComponentProps,
  Fragment,
  isValidElement,
  PropsWithChildren,
  ReactNode,
  useId,
  useRef,
} from "react";
import clsx from "clsx";
import { useCunningham } from ":/components/provider";

const isSeparator = (item: DropdownMenuItem): item is MenuItemSeparator => {
  return "type" in item && item.type === "separator";
};

const hasChildren = (item: MenuItemAction): boolean => {
  return Array.isArray(item.children) && item.children.length > 0;
};

export type DropdownMenuProps = {
  options: DropdownMenuItem[];
  onOpenChange?: (isOpen: boolean) => void;
  selectedValues?: string[];
  onSelectValue?: (value: string) => void;
  isOpen?: boolean;
  bottomMessage?: ReactNode;
  topMessage?: ReactNode;
  shouldCloseOnInteractOutside?: (element: Element) => boolean;
  variant?: "default" | "tiny";
};

export const DropdownMenu = ({
  options,
  isOpen = false,
  onOpenChange,
  children,
  selectedValues,
  onSelectValue,
  topMessage,
  bottomMessage,
  shouldCloseOnInteractOutside,
  variant = "default",
}: PropsWithChildren<DropdownMenuProps>) => {
  const id = useId();
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLElement>(null);
  const { t } = useCunningham();
  const menuClassName = `c__dropdown-menu${
    variant === "tiny" ? " c__dropdown-menu--tiny" : ""
  }`;
  const onOpenChangeHandler = (isOpen: boolean) => {
    onOpenChange?.(isOpen);
  };

  // `isNonModal` (no dialog wrapper, Tab can leave) also drops React Aria's
  // outside-click dismissal: restore it. The trigger is excluded because
  // every caller toggles `isOpen` from it; submenus are portaled outside the
  // root popover (any open submenu counts: fine while one menu is open at a
  // time).
  const shouldCloseOnOutside = (element: Element) =>
    !triggerRef.current?.contains(element) &&
    !element.closest?.('[data-trigger="SubmenuTrigger"]') &&
    (shouldCloseOnInteractOutside?.(element) ?? true);

  useInteractOutside({
    ref: popoverRef,
    isDisabled: !isOpen,
    onInteractOutside: (e) => {
      if (shouldCloseOnOutside(e.target as Element)) {
        onOpenChangeHandler(false);
      }
    },
  });

  // The name comes from the content (label + subText); an aria-label is only
  // needed to append the new-window suffix, so it repeats the subText.
  const getAriaLabel = (option: MenuItemAction): string | undefined => {
    if (!option.opensInNewWindow) {
      return undefined;
    }
    return (
      [option.label, option.subText].filter(Boolean).join(" ") +
      t("components.menu.newWindowLabelSuffix")
    );
  };

  // ADR 003: only checkable options get a checked state; the others stay
  // plain menuitems. `value` alone is not enough: some callers use it as an
  // action id without `selectedValues`.
  const getCheckedState = (option: MenuItemAction & { value?: string }) => {
    if (option.isChecked !== undefined) {
      return option.isChecked || isSelectedValue(option.value);
    }
    if (selectedValues && option.value) {
      return isSelectedValue(option.value);
    }
    return undefined;
  };
  const isSelectedValue = (value?: string) =>
    !!value && !!selectedValues?.includes(value);

  const renderMenuItems = (items: DropdownMenuItem[]) =>
    items.map((option, index) => {
      if (isSeparator(option)) {
        return <Separator key={`separator-${index}`} />;
      }

      if (option.isHidden) {
        return null;
      }

      const itemKey = option.id || option.label;

      if (hasChildren(option)) {
        return (
          <SubmenuTrigger key={itemKey}>
            <MenuItem
              className={clsx("c__dropdown-menu-item", {
                "c__dropdown-menu-item--danger": option.variant === "danger",
              })}
              aria-label={getAriaLabel(option)}
              isDisabled={option.isDisabled}
              data-testid={option.testId}
            >
              <MenuItemBody
                icon={option.icon}
                label={option.label}
                subText={option.subText}
                hasSubmenu
              />
            </MenuItem>
            <Popover offset={-4} shouldFlip containerPadding={16}>
              <Menu className={menuClassName}>
                {renderMenuItems(option.children!)}
              </Menu>
            </Popover>
          </SubmenuTrigger>
        );
      }

      const isChecked = getCheckedState(option);

      return (
        <Fragment key={itemKey}>
          <MenuItem
            className={clsx("c__dropdown-menu-item", {
              "c__dropdown-menu-item--danger": option.variant === "danger",
            })}
            aria-label={getAriaLabel(option)}
            render={
              isChecked === undefined
                ? undefined
                : (props) => (
                    <div
                      // No `href` on these items: always the div branch.
                      {...(props as ComponentProps<"div">)}
                      role="menuitemcheckbox"
                      aria-checked={isChecked}
                    />
                  )
            }
            onAction={() => {
              if (option.value) {
                onSelectValue?.(option.value);
              }
              option.callback?.();
              if (!option.keepOpen) {
                onOpenChangeHandler(false);
              }
            }}
            isDisabled={option.isDisabled}
            data-testid={option.testId}
          >
            <MenuItemBody
              icon={option.icon}
              label={option.label}
              subText={option.subText}
              isChecked={isChecked}
            />
          </MenuItem>
          {/* @deprecated: use { type: "separator" } instead */}
          {option.showSeparator && <Separator />}
        </Fragment>
      );
    });

  // The interactive trigger is the child, not the wrapper below: give it the
  // menu state unless it already sets it (a trigger nested in a wrapper sets
  // the attributes itself).
  const onlyChild = Children.count(children) === 1 ? children : undefined;
  const trigger =
    isValidElement<Record<string, unknown>>(onlyChild) &&
    (typeof onlyChild.type !== "string" ||
      onlyChild.type === "button" ||
      onlyChild.type === "a")
      ? cloneElement(onlyChild, {
          "aria-haspopup": onlyChild.props["aria-haspopup"] ?? "menu",
          "aria-expanded": onlyChild.props["aria-expanded"] ?? isOpen,
        })
      : children;

  return (
    <>
      <div
        className="c__dropdown-menu-trigger"
        ref={triggerRef}
        id={id}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {trigger}
      </div>

      <Popover
        ref={popoverRef}
        triggerRef={triggerRef}
        style={{
          marginTop: "0px",
        }}
        isOpen={isOpen}
        isNonModal
        shouldFlip
        containerPadding={16}
        shouldCloseOnInteractOutside={shouldCloseOnOutside}
        onOpenChange={onOpenChangeHandler}
      >
        <div className={menuClassName}>
          {topMessage && (
            <div className="c__dropdown-menu-item-top-message">
              {topMessage}
            </div>
          )}
          <Menu
            className="c__dropdown-menu__list"
            aria-labelledby={id}
            autoFocus="first"
          >
            {renderMenuItems(options)}
          </Menu>
          {bottomMessage && (
            <div className="c__dropdown-menu-item-bottom-message">
              {bottomMessage}
            </div>
          )}
        </div>
      </Popover>
    </>
  );
};
