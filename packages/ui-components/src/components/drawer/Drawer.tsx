import clsx from "clsx";
import { PointerEvent, useRef, useState } from "react";
import { Sheet, SheetProps } from ":/components/sheet";

export type DrawerProps = Omit<SheetProps, "side" | "handle" | "style"> & {
  /**
   * Heights the drawer can rest at, as fractions of the viewport height in
   * ascending order (for example `[0.4, 0.9]`). Without them it is as tall as
   * its content.
   */
  snapPoints?: number[];
  /** Index in `snapPoints` the drawer opens at. Default 0. */
  defaultSnap?: number;
  /** Drag distance, in pixels, beyond which the drawer closes. Default 100. */
  closeThreshold?: number;
};

/**
 * Bottom drawer for touch screens: a `Sheet` from the bottom with a drag
 * handle. Dragging the handle down past `closeThreshold` closes it, or lowers
 * it to the previous snap point. Keyboard and screen reader users close it
 * with Escape or the labelled close button, like any `Sheet`.
 */
export const Drawer = ({
  snapPoints,
  defaultSnap = 0,
  closeThreshold = 100,
  className,
  onClose,
  ...props
}: DrawerProps) => {
  const [snap, setSnap] = useState(defaultSnap);
  const start = useRef<number | undefined>(undefined);
  const panel = (el: Element) => el.closest<HTMLElement>(".c__sheet");

  const down = (event: PointerEvent<HTMLDivElement>) => {
    start.current = event.clientY;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const dialog = panel(event.currentTarget);
    if (start.current === undefined || !dialog) {
      return;
    }
    // Only downwards: the drawer never lifts off its resting position.
    dialog.style.transform = `translateY(${Math.max(0, event.clientY - start.current)}px)`;
  };
  const up = (event: PointerEvent<HTMLDivElement>) => {
    const dialog = panel(event.currentTarget);
    if (start.current === undefined || !dialog) {
      return;
    }
    const distance = event.clientY - start.current;
    start.current = undefined;
    dialog.style.transform = "";
    if (distance < closeThreshold) {
      return;
    }
    if (snapPoints && snap > 0) {
      setSnap(snap - 1);
    } else {
      onClose();
    }
  };

  return (
    <Sheet
      {...props}
      onClose={onClose}
      side="bottom"
      className={clsx("c__drawer", className)}
      style={
        snapPoints ? { height: `${snapPoints[snap] * 100}dvh` } : undefined
      }
      handle={
        <div
          className="c__drawer__handle-area"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={() => {
            start.current = undefined;
            // An aborted drag leaves the drawer where it was.
          }}
        >
          <div className="c__drawer__handle" aria-hidden="true" />
        </div>
      }
    />
  );
};
