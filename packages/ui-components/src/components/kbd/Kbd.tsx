import clsx from "clsx";
import { Children, Fragment, HTMLAttributes, ReactNode } from "react";
import { useCunningham } from ":/components/provider";

export const Kbd = ({ className, ...props }: HTMLAttributes<HTMLElement>) => (
  <kbd {...props} className={clsx("c__kbd", className)} />
);

export type KbdGroupProps = HTMLAttributes<HTMLSpanElement> & {
  /** Drawn between the keys, decorative. Default `+`. */
  separator?: ReactNode;
};

/** Several keys of one shortcut, joined by a separator. */
export const KbdGroup = ({
  separator = "+",
  className,
  children,
  ...props
}: KbdGroupProps) => (
  <span {...props} className={clsx("c__kbd-group", className)}>
    {Children.toArray(children).map((child, index) => (
      <Fragment key={index}>
        {index > 0 && (
          <span className="c__kbd-group__separator" aria-hidden="true">
            {separator}
          </span>
        )}
        {child}
      </Fragment>
    ))}
  </span>
);

/** Whether the browser runs on an Apple platform (⌘ rather than Ctrl). */
export const isMacPlatform = () =>
  typeof navigator !== "undefined" &&
  /mac|iphone|ipad|ipod/i.test(navigator.platform);

export type ModKbdProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  /** Force the platform instead of detecting it. */
  platform?: "mac" | "other";
};

/**
 * The platform's main modifier key: ⌘ on macOS (named "Command" for screen
 * readers, as the symbol alone is not read as a key), Ctrl elsewhere.
 */
export const ModKbd = ({ platform, ...props }: ModKbdProps) => {
  const { t } = useCunningham();
  const mac = platform ? platform === "mac" : isMacPlatform();
  return mac ? (
    <Kbd {...props} aria-label={t("components.kbd.command")}>
      ⌘
    </Kbd>
  ) : (
    <Kbd {...props}>Ctrl</Kbd>
  );
};
