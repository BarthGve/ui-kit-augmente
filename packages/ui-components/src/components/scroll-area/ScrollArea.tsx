import clsx from "clsx";
import { HTMLAttributes, useEffect, useRef, useState } from "react";

export type ScrollAreaProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  /** Names the scrollable region. */
  "aria-label": string;
  orientation?: "vertical" | "horizontal" | "both";
};

/**
 * A scrollable box with thin scrollbars styled by CSS (the native scrolling is
 * untouched: wheel, touch, keyboard). When its content overflows, the region
 * becomes focusable so keyboard users can scroll it. Give it a height or a
 * width to constrain it.
 */
export const ScrollArea = ({
  orientation = "vertical",
  className,
  ...props
}: ScrollAreaProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () =>
      setScrolls(
        el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth,
      );
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    Array.from(el.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      {...props}
      ref={ref}
      role="region"
      tabIndex={scrolls ? 0 : undefined}
      className={clsx(
        "c__scroll-area",
        `c__scroll-area--${orientation}`,
        className,
      )}
    />
  );
};
