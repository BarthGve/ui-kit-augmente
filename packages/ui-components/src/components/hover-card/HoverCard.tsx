import clsx from "clsx";
import { ReactNode, useEffect, useId, useRef, useState } from "react";
import { Popover } from "react-aria-components";

export type HoverCardProps = {
  /** The element that reveals the card. It must be focusable (a link or a button). */
  trigger: ReactNode;
  /** The card's content. */
  content: ReactNode;
  /** Milliseconds before opening on hover or focus. Default 700. */
  openDelay?: number;
  /** Milliseconds before closing, so the pointer can reach the card. Default 300. */
  closeDelay?: number;
  placement?: "top" | "bottom" | "left" | "right";
  className?: string;
};

/**
 * A card shown after a delay when its trigger is hovered or focused. It
 * previews details, never essential information: it is not announced as a
 * dialog and does not exist on touch screens, so what it shows must also be
 * reachable some other way (the link behind the trigger, for example).
 */
export const HoverCard = ({
  trigger,
  content,
  openDelay = 700,
  closeDelay = 300,
  placement = "bottom",
  className,
}: HoverCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const anchor = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const id = useId();

  const schedule = (open: boolean, delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setIsOpen(open), delay);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const leaveFocus = (event: React.FocusEvent) => {
    // Focus moving between the trigger and the card keeps it open.
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      schedule(false, closeDelay);
    }
  };

  return (
    <span
      className={clsx("c__hover-card", className)}
      onPointerEnter={() => schedule(true, openDelay)}
      onPointerLeave={() => schedule(false, closeDelay)}
      onFocus={() => schedule(true, openDelay)}
      onBlur={leaveFocus}
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          clearTimeout(timer.current);
          setIsOpen(false);
        }
      }}
    >
      <span
        ref={anchor}
        className="c__hover-card__trigger"
        aria-describedby={isOpen ? id : undefined}
      >
        {trigger}
      </span>
      <Popover
        isOpen={isOpen}
        isNonModal
        triggerRef={anchor}
        placement={placement}
        offset={8}
        className="c__hover-card__popover"
        // Rendered next to the trigger, so Tab reaches the card in page order.
        UNSTABLE_portalContainer={anchor.current?.parentElement ?? undefined}
        onOpenChange={setIsOpen}
      >
        <div id={id} className="c__hover-card__card">
          {content}
        </div>
      </Popover>
    </span>
  );
};
