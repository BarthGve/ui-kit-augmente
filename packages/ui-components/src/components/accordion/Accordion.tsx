import clsx from "clsx";
import {
  Button,
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  Heading,
} from "react-aria-components";
import { Icon } from ":/components/icon";
import { AccordionItemProps, AccordionProps } from "./types";

const TRIGGER = ".c__accordion__trigger";

// React Aria gives no arrow navigation between disclosure triggers (AC3), and
// `DisclosureGroup` drops keyboard props from its root, hence a native
// listener. Only triggers owned by this root are visited, so nested
// accordions and fields inside panels keep their own keys.
const arrowKeys = (root: HTMLDivElement | null) => {
  if (!root) return;
  const onKeyDown = (event: KeyboardEvent) => {
    const current = (event.target as Element).closest(TRIGGER);
    if (!current || current.closest(".c__accordion") !== root) return;
    const triggers = Array.from(
      root.querySelectorAll<HTMLButtonElement>(`${TRIGGER}:not(:disabled)`),
    ).filter((trigger) => trigger.closest(".c__accordion") === root);
    const index = triggers.indexOf(current as HTMLButtonElement);
    const last = triggers.length - 1;
    const next = {
      ArrowDown: index === last ? 0 : index + 1,
      ArrowUp: index <= 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined || !triggers[next]) return;
    event.preventDefault();
    triggers[next].focus();
  };
  root.addEventListener("keydown", onKeyDown);
  return () => root.removeEventListener("keydown", onKeyDown);
};

export const Accordion = ({ className, ...props }: AccordionProps) => (
  <DisclosureGroup
    {...props}
    ref={arrowKeys}
    className={clsx("c__accordion", className)}
  />
);

export const AccordionItem = ({
  id,
  title,
  children,
  headingLevel = 3,
  isDisabled,
  className,
}: AccordionItemProps) => (
  <Disclosure
    id={id}
    isDisabled={isDisabled}
    className={clsx("c__accordion__item", className)}
  >
    <Heading level={headingLevel} className="c__accordion__heading">
      <Button slot="trigger" className="c__accordion__trigger">
        <span className="c__accordion__title">{title}</span>
        <Icon
          name="expand_more"
          className="c__accordion__icon"
          aria-hidden="true"
        />
      </Button>
    </Heading>
    <DisclosurePanel className="c__accordion__panel">
      <div className="c__accordion__panel-content">{children}</div>
    </DisclosurePanel>
  </Disclosure>
);
