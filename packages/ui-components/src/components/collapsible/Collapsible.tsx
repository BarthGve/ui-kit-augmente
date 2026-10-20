import clsx from "clsx";
import { ReactNode } from "react";
import { Button, Disclosure, DisclosurePanel } from "react-aria-components";
import { Icon } from ":/components/icon";

export type CollapsibleProps = {
  /** Content of the button that shows or hides the region. */
  trigger: ReactNode;
  children: ReactNode;
  /** Open state, when controlled. */
  open?: boolean;
  /** Open state, when uncontrolled. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * A single collapsible region: a button that shows or hides a block of
 * content. Built on react-aria's `Disclosure`, like the `Accordion` (which
 * holds several of them). The collapsed content is hidden from assistive
 * technology and cannot be focused.
 */
export const Collapsible = ({
  trigger,
  children,
  open,
  defaultOpen,
  onOpenChange,
  disabled,
  className,
}: CollapsibleProps) => (
  <Disclosure
    className={clsx("c__collapsible", className)}
    isExpanded={open}
    defaultExpanded={defaultOpen}
    onExpandedChange={onOpenChange}
    isDisabled={disabled}
  >
    <Button slot="trigger" className="c__collapsible__trigger">
      <span className="c__collapsible__label">{trigger}</span>
      <Icon
        name="expand_more"
        className="c__collapsible__icon"
        aria-hidden="true"
      />
    </Button>
    <DisclosurePanel className="c__collapsible__panel">
      <div className="c__collapsible__content">{children}</div>
    </DisclosurePanel>
  </Disclosure>
);
