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

export const Accordion = ({ className, ...props }: AccordionProps) => (
  <DisclosureGroup {...props} className={clsx("c__accordion", className)} />
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
