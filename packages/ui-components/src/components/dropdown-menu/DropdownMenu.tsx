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
import { Fragment, PropsWithChildren, ReactNode, useId, useRef } from "react";
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
  selectedValues = [],
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

  const getAriaLabel = (option: MenuItemAction): string => {
    if (option.opensInNewWindow) {
      return option.label + t("components.menu.newWindowLabelSuffix");
    }
    return option.label;
  };

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

      return (
        <Fragment key={itemKey}>
          <MenuItem
            className={clsx("c__dropdown-menu-item", {
              "c__dropdown-menu-item--danger": option.variant === "danger",
            })}
            aria-label={getAriaLabel(option)}
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
              isChecked={
                option.isChecked ||
                (!!option.value && selectedValues.includes(option.value))
              }
            />
          </MenuItem>
          {/* @deprecated: use { type: "separator" } instead */}
          {option.showSeparator && <Separator />}
        </Fragment>
      );
    });

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
        {children}
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
