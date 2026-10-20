import clsx from "clsx";
import { ReactNode, useEffect, useRef } from "react";
import {
  Group,
  GroupImperativeHandle,
  Layout,
  Panel,
  PanelProps,
  Separator,
  SeparatorProps,
} from "react-resizable-panels";
import { useCunningham } from ":/components/provider";

export type ResizablePanelGroupProps = {
  /** Panels side by side (`horizontal`) or stacked (`vertical`). Default `horizontal`. */
  orientation?: "horizontal" | "vertical";
  /** Sizes of the panels by panel id, in percent, when controlled. */
  layout?: Layout;
  /** Sizes the panels start with, when uncontrolled. */
  defaultLayout?: Layout;
  /** Called with the new sizes after each resize. */
  onResize?: (layout: Layout) => void;
  className?: string;
  children: ReactNode;
};

/**
 * Panels with draggable handles, built on `react-resizable-panels` (the same
 * library as `MainLayout`). Each `ResizablePanel` takes an `id` and its
 * `minSize` / `maxSize`; place a `ResizableHandle` between two panels.
 */
export const ResizablePanelGroup = ({
  orientation = "horizontal",
  layout,
  defaultLayout,
  onResize,
  className,
  children,
}: ResizablePanelGroupProps) => {
  const handle = useRef<GroupImperativeHandle | null>(null);

  useEffect(() => {
    if (layout) handle.current?.setLayout(layout);
  }, [layout]);

  return (
    <Group
      groupRef={handle}
      orientation={orientation}
      defaultLayout={layout ?? defaultLayout}
      onLayoutChanged={onResize}
      className={clsx(
        "c__resizable",
        `c__resizable--${orientation}`,
        className,
      )}
    >
      {children}
    </Group>
  );
};

export type ResizablePanelProps = PanelProps & {
  /** Identifies the panel in the layout. Required. */
  id: string;
};

/** A panel of the group. Numbers are pixels; strings without unit are percent. */
export const ResizablePanel = ({
  className,
  ...props
}: ResizablePanelProps) => (
  <Panel {...props} className={clsx("c__resizable__panel", className)} />
);

export type ResizableHandleProps = SeparatorProps & {
  /** Accessible name of the handle. Default: "Resize". */
  "aria-label"?: string;
};

/**
 * The handle between two panels: a `separator` that the pointer drags and
 * the keyboard moves (arrows, Home and End), with its value exposed through
 * `aria-valuenow`. A double click puts the panels back to their default size.
 */
export const ResizableHandle = ({
  className,
  "aria-label": ariaLabel,
  ...props
}: ResizableHandleProps) => {
  const { t } = useCunningham();
  return (
    <Separator
      {...props}
      aria-label={ariaLabel ?? t("components.resizable.handle")}
      className={clsx(
        "c__resize-handle",
        "c__resize-handle--interactive",
        className,
      )}
    />
  );
};
