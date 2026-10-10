import { HTMLAttributes, ReactNode } from "react";
import type { Key } from "react-aria-components";

export type AccordionProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "className"
> & {
  children: ReactNode;
  /** Several panels may be open at once. Default: one at a time. */
  allowsMultipleExpanded?: boolean;
  /** Open item ids (controlled). */
  expandedKeys?: Iterable<Key>;
  /** Initially open item ids (uncontrolled). */
  defaultExpandedKeys?: Iterable<Key>;
  onExpandedChange?: (keys: Set<Key>) => void;
  /** Disables every item. */
  isDisabled?: boolean;
  className?: string;
};

export type AccordionItemProps = {
  /** Key of the item in `expandedKeys`. */
  id: Key;
  /** Trigger label, also the panel's accessible name. */
  title: ReactNode;
  children: ReactNode;
  /** Level of the heading wrapping the trigger. Default: 3. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  isDisabled?: boolean;
  className?: string;
};
