import clsx from "clsx";
import {
  CSSProperties,
  FocusEvent,
  KeyboardEvent,
  memo,
  MouseEvent,
  PointerEvent,
  Ref,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { VisuallyHidden } from "react-aria";
import {
  CalendarDate,
  DateFormatter,
  startOfMonth,
  startOfYear,
} from "@internationalized/date";
import { Button } from ":/components/button";
import { useCunningham } from ":/components/provider";
import { useControllableState } from ":/hooks/useControllableState";
import {
  clampToAxis,
  GanttEditMode,
  GanttUnitSpan,
  isNoop,
  moveSpan,
  resizeEnd,
  resizeStart,
  toChange,
  unitsFromPixels,
} from "./edit";
import {
  checkLink,
  conflictsOf,
  type LinkPair,
  linkKey,
  type LinkRefusal,
  MAX_LINKS,
  type LinkSpan,
  neighboursOf,
  normalizeLinks,
  type RoutePoint,
  routeOf,
} from "./links";
import {
  buildScale,
  dayIndex,
  formatDates,
  GanttScale,
  Position,
  toDay,
} from "./scale";
import { GanttProps, GanttTask, GanttZoom } from "./types";

type Segment = { key: string; label: string; start: number; span: number };

const place = (start: number, span?: number) =>
  ({
    "--gantt-start": start,
    ...(span === undefined ? {} : { "--gantt-span": span }),
  }) as CSSProperties;

const format = (locale: string, options: Intl.DateTimeFormatOptions) => {
  const formatter = new DateFormatter(locale, { ...options, timeZone: "UTC" });
  return (date: CalendarDate) => formatter.format(date.toDate("UTC"));
};

// Upper tier: months (years in month zoom), the first one cut at the origin.
const upperTier = (
  scale: GanttScale,
  zoom: GanttZoom,
  locale: string,
): Segment[] => {
  const byYear = zoom === "month";
  const label = format(
    locale,
    byYear ? { year: "numeric" } : { month: "long", year: "numeric" },
  );
  const step = byYear ? { years: 1 } : { months: 1 };
  const segments: Segment[] = [];
  let date = scale.origin;
  while (date.compare(scale.end) <= 0) {
    const next = (byYear ? startOfYear(date) : startOfMonth(date)).add(step);
    const start = dayIndex(scale.origin, date);
    const stop = Math.min(dayIndex(scale.origin, next), scale.days);
    segments.push({
      key: date.toString(),
      label: label(date),
      start,
      span: stop - start,
    });
    date = next;
  }
  return segments;
};

// Lower tier: one label per scale tick, spanning to the next tick.
const lowerTier = (
  scale: GanttScale,
  zoom: GanttZoom,
  locale: string,
): Segment[] => {
  const label = format(
    locale,
    zoom === "month" ? { month: "short" } : { day: "numeric" },
  );
  return scale.ticks.map((tick, i) => ({
    key: tick.date.toString(),
    label: label(tick.date),
    start: tick.index,
    span: (scale.ticks[i + 1]?.index ?? scale.days) - tick.index,
  }));
};

const ZOOMS: GanttZoom[] = ["day", "week", "month"];
const KEYS: Record<string, (from: number, last: number) => number> = {
  ArrowDown: (from) => from + 1,
  ArrowUp: (from) => from - 1,
  Home: () => 0,
  End: (_, last) => last,
};
const noop = () => {};
// Keyboard editing (s23): Alt moves, Shift changes the end, one zoom unit.
const CHORDS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };
const EDIT_SHORTCUTS =
  "Alt+ArrowLeft Alt+ArrowRight Shift+ArrowLeft Shift+ArrowRight";
// Linking (s24): Alt+Shift+Right, this task first; Left, this task after.
const LINK_CHORDS: Record<string, boolean> = {
  ArrowRight: true,
  ArrowLeft: false,
};
const LINK_SHORTCUTS = "Alt+Shift+ArrowLeft Alt+Shift+ArrowRight";

/** The limit an edit ran into: its key under `components.gantt`. */
type Limit = "limit_axis" | "limit_end_before_start";

/** What the dragged row draws instead of the task's dates. */
type Preview = GanttUnitSpan & { limit?: Limit };

// The real dates of a task whose bar lies whole on the axis: the only ones
// an edit can start from (a clipped bar has no real geometry).
const editableSpan = (
  task: GanttTask | undefined,
  scale: GanttScale,
): GanttUnitSpan | null => {
  const start = toDay(task?.start);
  const end = toDay(task?.end);
  return start &&
    end &&
    start.compare(scale.origin) >= 0 &&
    end.compare(scale.end) <= 0
    ? { start, end }
    : null;
};

// `n` zoom units of `mode` from the original span, with the limit it hit.
const editSpan = (
  mode: GanttEditMode,
  span: GanttUnitSpan,
  zoom: GanttZoom,
  n: number,
): Preview => {
  if (mode === "move") return moveSpan(span, zoom, n);
  const next = (mode === "resize-end" ? resizeEnd : resizeStart)(span, zoom, n);
  return {
    start: next.start,
    end: next.end,
    limit: next.clamped ? "limit_end_before_start" : undefined,
  };
};

// The 24px minimum target (WCAG 2.5.8): `handle-hit-size`, in px at a 16px
// root like `scale.dayWidth`, so the ratio holds at any root font size.
// ponytail: a consumer overriding the day-width tokens shifts the threshold.
const HANDLE_MIN = 24;
// Auto-scroll: zone at each visible track edge, and top speed per frame.
const EDGE = 48;
const MAX_SPEED = 20;

type RowProps = {
  task: GanttTask;
  index: number;
  tabIndex: number;
  scale: GanttScale;
  locale: string;
  editable: boolean;
  /** Id of the editing instructions, described by every editable row. */
  instructions: string;
  /** Id of the linking instructions, described by every linkable row. */
  linkInstructions: string;
  /** Id of the row's dependency description, when it has links. */
  description?: string;
  preview?: Preview;
  /** Link editing on: a row with a bar offers a connector after it. */
  linkable: boolean;
  /** The row a link session starts from (its bar is outlined). */
  linkSource?: boolean;
  /** A link session's sentence for this row (drawn here when the row has no
   * bar, in the link overlay otherwise), and whether it refuses. */
  linkTip?: string;
  linkRefused?: boolean;
  /** Accessible name of the Remove button of the selected link ending here. */
  removeLabel?: string;
};

// Memoised: a drag re-renders the dragged row only.
const GanttRow = memo(function GanttRow({
  task,
  index,
  tabIndex,
  scale,
  locale,
  editable,
  instructions,
  linkInstructions,
  description,
  preview,
  linkable,
  linkSource,
  linkTip,
  linkRefused,
  removeLabel,
}: RowProps) {
  const { t } = useCunningham();
  // "No dates" follows the dates; the bar can also be absent when the task
  // lies outside a bounded window (MAX_DAYS).
  const dates = formatDates(task, locale);
  const original = scale.positionOf(task);
  const position = preview
    ? scale.positionOf({ ...task, start: preview.start, end: preview.end })
    : original;
  const label = !dates
    ? t("components.gantt.row_no_dates_aria", { name: task.name })
    : dates.start === dates.end
      ? t("components.gantt.row_date_aria", {
          name: task.name,
          date: dates.start,
        })
      : t("components.gantt.row_dates_aria", { name: task.name, ...dates });
  const previewDates = preview && formatDates({ ...task, ...preview }, locale);
  const editableRow = editable && editableSpan(task, scale) !== null;
  // Linking needs a bar, clipped or not (as `hasBar`).
  const linkRow = linkable && original !== null;
  const shortcuts = [
    editableRow && EDIT_SHORTCUTS,
    linkRow && LINK_SHORTCUTS,
  ].filter(Boolean);
  // Edge handles: a bar narrower than one target has none (moving only).
  const handles =
    editableRow && position && position.span * scale.dayWidth >= HANDLE_MIN;
  // Tips stand beside the bar, on its wider side of the track.
  const side =
    position && position.start > scale.days - position.start - position.span
      ? "start"
      : "end";
  return (
    <div
      role="row"
      aria-rowindex={index + 2}
      aria-label={label}
      aria-keyshortcuts={
        shortcuts.length ? [...shortcuts, "Enter Escape"].join(" ") : undefined
      }
      aria-describedby={
        [editableRow && instructions, linkRow && linkInstructions, description]
          .filter(Boolean)
          .join(" ") || undefined
      }
      // A single tab stop, so Tab leaves the chart (roving).
      tabIndex={tabIndex}
      className="c__gantt__row"
      data-no-dates={dates ? undefined : true}
    >
      <div role="rowheader" className="c__gantt__task">
        <span className="c__gantt__task-name">{task.name}</span>
        {!dates && (
          <span className="c__gantt__no-dates">
            {t("components.gantt.no_dates")}
          </span>
        )}
        {/* No bar to stand beside: the sentence sits on the name. */}
        {linkTip && !position && (
          <span
            className="c__gantt__tip"
            aria-hidden="true"
            data-refused={linkRefused || undefined}
            style={place(0, 0)}
          >
            {linkTip}
          </span>
        )}
      </div>
      {/* Fixed child slots: the bar node holds the pointer capture and must
          survive every preview render. */}
      <div role="gridcell" className="c__gantt__track">
        {preview && original && (
          <div
            className="c__gantt__ghost"
            aria-hidden="true"
            style={place(original.start, original.span)}
          />
        )}
        {position && (
          <div
            className="c__gantt__bar"
            data-task-id={task.id}
            data-preview={preview ? true : undefined}
            data-clamped={preview?.limit ? true : undefined}
            data-link-source={linkSource || undefined}
            data-refused={(linkTip && linkRefused) || undefined}
            aria-hidden="true"
            style={place(position.start, position.span)}
          >
            {handles && (
              <>
                <div className="c__gantt__handle" data-edge="start" />
                <div className="c__gantt__handle" data-edge="end" />
              </>
            )}
          </div>
        )}
        {/* A track child, not a bar child: pressing it never starts a
            move. A fixed slot: it holds the pointer capture of a link. */}
        {linkable && position && (
          <div
            className="c__gantt__connector"
            aria-hidden="true"
            style={place(position.start, position.span)}
          />
        )}
        {position && previewDates && (
          <div
            className="c__gantt__tip"
            aria-hidden="true"
            data-side={side}
            style={place(position.start, position.span)}
          >
            {preview.limit
              ? t(`components.gantt.${preview.limit}`)
              : t("components.gantt.tooltip_dates", previewDates)}
          </div>
        )}
        {/* In the gridcell (the link overlay is aria-hidden); its clicks and
            keys are handled by the grid. */}
        {position && removeLabel && (
          <Button
            type="button"
            className="c__gantt__remove"
            color="neutral"
            variant="tertiary"
            size="nano"
            icon={
              <span className="material-icons" aria-hidden="true">
                close
              </span>
            }
            aria-label={removeLabel}
            style={place(position.start)}
          />
        )}
      </div>
    </div>
  );
});

/** Where a link end is drawn: its row and its (clipped) bar. */
type LinkEnd = Position & { row: number };

const corner = (
  n: 1 | 2,
  { day, gutters, leads, row, centre }: RoutePoint,
) => ({
  [`--gantt-x${n}`]: day,
  [`--gantt-g${n}`]: gutters,
  [`--gantt-l${n}`]: leads,
  [`--gantt-y${n}`]: row,
  [`--gantt-c${n}`]: centre ? 1 : 0,
});

type LinkProps = {
  from: string;
  to: string;
  // Primitives, so a drag re-renders only the links of the dragged task.
  predRow: number;
  predStart: number;
  predSpan: number;
  succRow: number;
  succStart: number;
  succSpan: number;
  conflict: boolean;
  dayWidth: number;
  /** Link editing on: the middle segments take the pointer (selection). */
  interactive?: boolean;
  selected?: boolean;
  /** The prospective link of a pointer session. */
  creating?: boolean;
};

// Boxes placed in CSS from the route's corners (days, gutters, leads, rows),
// like the bars: no px mirror for alignment. The arrowhead is the last
// segment's `::after`.
const GanttLink = memo(function GanttLink({
  from,
  to,
  predRow,
  predStart,
  predSpan,
  succRow,
  succStart,
  succSpan,
  conflict,
  dayWidth,
  interactive,
  selected,
  creating,
}: LinkProps) {
  const route = routeOf(
    { row: predRow, start: predStart, span: predSpan },
    { row: succRow, start: succStart, span: succSpan },
    { dayWidth },
  );
  return (
    <div
      className="c__gantt__link"
      data-from={from}
      data-to={to}
      data-conflict={conflict || undefined}
      data-selected={selected || undefined}
      data-state={creating ? "creating" : undefined}
    >
      {route.map(([a, b], i) => {
        const axis = a.row === b.row && a.centre === b.centre ? "x" : "y";
        return (
          <div
            key={i}
            className="c__gantt__link-segment"
            data-axis={axis}
            data-end={i === route.length - 1 || undefined}
            style={{ ...corner(1, a), ...corner(2, b) } as CSSProperties}
          >
            {/* A 24px strip on the middle vertical segments only: the end
                stubs leave the resize handles reachable, and a U route's
                run along a row line would cover the connector above it. */}
            {interactive && axis === "y" && i > 0 && i < route.length - 1 && (
              <div className="c__gantt__link-hit" />
            )}
          </div>
        );
      })}
      {conflict && (
        <span
          className="c__gantt__link-flag"
          style={
            { "--gantt-x": succStart, "--gantt-y": succRow } as CSSProperties
          }
        >
          !
        </span>
      )}
    </div>
  );
});

type LinksProps = {
  layerRef: Ref<HTMLDivElement>;
  links: LinkPair[];
  ends: ReadonlyMap<string, LinkEnd | null>;
  conflicts: ReadonlySet<string>;
  dayWidth: number;
  rows: number;
  interactive: boolean;
  /** Key of the selected link. */
  selected: string | null;
  /** Ends of the prospective link of a pointer session. */
  creatingFrom?: string;
  creatingTo?: string;
  days: number;
  /** A link session's sentence beside a bar (row, start and span in days):
   * here, so that no link paints over it. */
  tipId?: string;
  tipText?: string;
  tipRefused?: boolean;
  tipRow?: number;
  tipStart?: number;
  tipSpan?: number;
};

const NO_ENDS: ReadonlyMap<string, LinkEnd | null> = new Map();
const NO_CONFLICTS: ReadonlySet<string> = new Set();

// Above the rows, inert and hidden from assistive technology (the rows
// describe their links); clipped to the visible track by `--gantt-scroll`.
const GanttLinks = memo(function GanttLinks({
  layerRef,
  links,
  ends,
  conflicts,
  dayWidth,
  rows,
  interactive,
  selected,
  creatingFrom,
  creatingTo,
  days,
  tipId,
  tipText,
  tipRefused,
  tipRow,
  tipStart = 0,
  tipSpan = 0,
}: LinksProps) {
  const pred = creatingFrom === undefined ? null : ends.get(creatingFrom);
  const succ = creatingTo === undefined ? null : ends.get(creatingTo);
  return (
    <div
      ref={layerRef}
      className="c__gantt__links"
      aria-hidden="true"
      style={{ "--gantt-rows": rows } as CSSProperties}
    >
      {links.map((link) => {
        const pred = ends.get(link.from);
        const succ = ends.get(link.to);
        if (!pred || !succ) return null;
        const key = linkKey(link);
        return (
          <GanttLink
            key={key}
            from={link.from}
            to={link.to}
            predRow={pred.row}
            predStart={pred.start}
            predSpan={pred.span}
            succRow={succ.row}
            succStart={succ.start}
            succSpan={succ.span}
            conflict={conflicts.has(key)}
            dayWidth={dayWidth}
            interactive={interactive}
            selected={key === selected}
          />
        );
      })}
      {pred && succ && (
        <GanttLink
          key="creating"
          from={creatingFrom!}
          to={creatingTo!}
          predRow={pred.row}
          predStart={pred.start}
          predSpan={pred.span}
          succRow={succ.row}
          succStart={succ.start}
          succSpan={succ.span}
          conflict={false}
          dayWidth={dayWidth}
          creating
        />
      )}
      {/* Last: above every line. Beside the bar, on its wider side. */}
      {tipText !== undefined && (
        <div
          className="c__gantt__tip"
          data-task-id={tipId}
          data-side={tipStart > days - tipStart - tipSpan ? "start" : "end"}
          data-refused={tipRefused || undefined}
          style={
            {
              "--gantt-start": tipStart,
              "--gantt-span": tipSpan,
              "--gantt-y": tipRow,
            } as CSSProperties
          }
        >
          {tipText}
        </div>
      )}
    </div>
  );
});

// `Intl.ListFormat` (every supported browser) is outside the package's
// TypeScript lib (no es2021.intl).
const ListFormat = (
  Intl as unknown as {
    ListFormat: new (
      locale: string,
      options: { type: "unit"; style: "short" },
    ) => { format: (items: string[]) => string };
  }
).ListFormat;

// The provider's `t` fills each variable once; a sentence naming a task
// twice needs the rest filled too.
const fill = (message: string, vars: Record<string, string>) =>
  Object.entries(vars).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    message,
  );

/** An edit in progress (refs: read synchronously by every exit). */
type Session = {
  id: string;
  name: string;
  mode: GanttEditMode;
  bar: HTMLElement;
  zoom: GanttZoom;
  axis: GanttScale;
  original: GanttUnitSpan;
  // Units of `mode` from the original (keyboard: of the move).
  unitDelta: number;
  limit?: Limit;
  unlisten: () => void;
};

/** From the keyboard, on a focused row: a move, then an end change. */
type KeyEdit = Session & {
  row: HTMLElement;
  endDelta: number;
  span: GanttUnitSpan;
};

/** A link dragged from a connector onto a target row (s24). */
type LinkSession = {
  from: string;
  pointerId: number;
  connector: HTMLElement;
  // The pointer now: a scroll re-targets a still pointer.
  x: number;
  y: number;
  // The row under the pointer (the source included) and its verdict.
  over: string | null;
  refusal: LinkRefusal | null;
  unlisten: () => void;
};

/** From the keyboard (s24): the focused row and a candidate row. */
type KeyLink = {
  source: string;
  sourceRow: HTMLElement;
  // Alt+Shift+Right: the source is the predecessor.
  predecessor: boolean;
  candidate: string;
  unlisten: () => void;
};

/** From the pointer. */
type Drag = Session & {
  pointerId: number;
  // Pointer and scroll offset at the start, and the pointer now: the dates
  // follow both, so an auto-scroll moves them with a still pointer.
  x: number;
  scroll: number;
  lastX: number;
  // Visible track, in client px (sticky column excluded); null: too narrow
  // for two auto-scroll zones.
  edges: { left: number; right: number } | null;
  frame: number;
  pxPerDay: number;
};

// The keyboard span: `move` units of a move, then `end` units of the end,
// both from the original. Null when it leaves the axis (whole units only).
const keySpan = (
  { original, zoom, axis }: Session,
  move: number,
  end: number,
): (GanttUnitSpan & { clamped: boolean }) | null => {
  if (clampToAxis(original, axis, move, zoom, "move") !== move) return null;
  const moved = moveSpan(original, zoom, move);
  if (clampToAxis(moved, axis, end, zoom, "resize-end") !== end) return null;
  return resizeEnd(moved, zoom, end);
};

export const Gantt = ({
  tasks,
  zoom: zoomProp,
  defaultZoom = "week",
  onZoomChange,
  today,
  editable = false,
  onTaskChange,
  dependencies,
  onDependencyChange,
  "aria-label": ariaLabel,
  className,
  ...props
}: GanttProps) => {
  const { t, currentLocale: locale } = useCunningham();
  const controlled = zoomProp !== undefined;
  // The hook only syncs from the prop when it gets a callback, and never
  // updates itself when it has one: hand it one only when controlled.
  const [zoom, setZoom] = useControllableState<GanttZoom>(
    defaultZoom,
    zoomProp,
    controlled ? (onZoomChange ?? noop) : undefined,
  );
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Leftmost visible day, taken before a requested zoom: once the grid has
  // narrowed, the old offset is already clamped. After a committed edit, the
  // origin it was taken against instead: the edit may move the axis origin.
  const anchor = useRef<
    | ({ zoom: GanttZoom; left: number } & (
        | { date: CalendarDate }
        | { origin: CalendarDate; pxPerDay: number }
      ))
    | null
  >(null);
  const todayKey = today?.toString();
  const scale = useMemo(
    () =>
      buildScale({
        tasks,
        zoom,
        locale,
        today: toDay(today) ?? undefined,
      }),
    // `today` is compared by value: a fresh CalendarDate must not rebuild.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, zoom, locale, todayKey],
  );
  const tiers = useMemo(
    () => [upperTier(scale, zoom, locale), lowerTier(scale, zoom, locale)],
    [scale, zoom, locale],
  );

  // ponytail: day widths are rem tokens, assumed at the root font size; a
  // consumer overriding them would anchor approximately.
  const px = (dayWidth: number) =>
    (dayWidth *
      parseFloat(getComputedStyle(document.documentElement).fontSize)) /
    16;

  const requestZoom = (next: GanttZoom) => {
    const el = scrollerRef.current;
    if (el && next !== zoom) {
      const day = Math.floor(el.scrollLeft / px(scale.dayWidth));
      anchor.current = {
        zoom: next,
        date: scale.origin.add({ days: day }),
        left: el.scrollLeft,
      };
    }
    setZoom(next);
    if (!controlled) onZoomChange?.(next);
  };

  // A controlled parent may refuse a request (no render follows): once the
  // view has scrolled, that anchor is stale. Read before the DOM changes,
  // so a narrower grid has not clamped the offset yet.
  const anchorStale =
    anchor.current !== null &&
    scrollerRef.current?.scrollLeft !== anchor.current.left;

  // Before paint, so the new zoom is never drawn at the old offset.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    const kept = anchor.current;
    if (el && !anchorStale && kept?.zoom === zoom) {
      el.scrollLeft =
        "date" in kept
          ? dayIndex(scale.origin, kept.date) * px(scale.dayWidth)
          : kept.left + dayIndex(scale.origin, kept.origin) * kept.pxPerDay;
    }
    anchor.current = null;
  }, [zoom, scale, anchorStale]);

  // Roving tab stop over the task rows: the task id, with its index as the
  // fallback when that task goes. A ref, so a key press does not rerender.
  const gridRef = useRef<HTMLDivElement>(null);
  const focusedId = useRef<string | undefined>(undefined);
  const stop = useRef<{ id?: string; index: number }>({ index: 0 });
  const found = tasks.findIndex((task) => task.id === stop.current.id);
  const stopIndex =
    found >= 0 ? found : Math.min(stop.current.index, tasks.length - 1);
  const taskRows = () =>
    Array.from(
      gridRef.current?.querySelectorAll<HTMLElement>(
        ":scope > .c__gantt__row",
      ) ?? [],
    );

  useLayoutEffect(() => {
    const id = tasks[stopIndex]?.id;
    const lost =
      focusedId.current !== undefined &&
      focusedId.current === stop.current.id &&
      stop.current.id !== id;
    stop.current = { id, index: Math.max(stopIndex, 0) };
    // The focused row was removed: its neighbour takes the focus.
    if (lost && document.activeElement === document.body) {
      taskRows()[stopIndex]?.focus();
    }
  });

  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const index = taskRows().indexOf(event.target);
    if (index < 0) return;
    for (const row of taskRows()) row.tabIndex = row === event.target ? 0 : -1;
    stop.current = { id: tasks[index].id, index };
    focusedId.current = tasks[index].id;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(".c__gantt__remove")) {
      return onRemoveKey(event);
    }
    const rows = taskRows();
    const from = rows.indexOf(event.target as HTMLElement);
    if (
      from >= 0 &&
      (onLinkKey(event, rows[from], from) || onEditKey(event, rows[from], from))
    )
      return;
    const move = KEYS[event.key];
    // Modified keys are left to the browser and to s23 (move/resize).
    if (
      from < 0 ||
      !move ||
      event.altKey ||
      event.shiftKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const next = rows[move(from, rows.length - 1)];
    if (!next || next === event.target) return;
    event.preventDefault();
    next.focus();
    // The row is as wide as the timeline: bring its bar into view.
    next
      .querySelector(".c__gantt__bar")
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  // Editing is off right-to-left: the dates would run against the pointer
  // and the arrows. ponytail: reads the `dir` attribute once, at mount; a
  // CSS-only `direction` or a later change is not seen.
  const rootRef = useRef<HTMLDivElement>(null);
  const [rtl, setRtl] = useState(false);
  useLayoutEffect(() => {
    setRtl(rootRef.current?.closest("[dir]")?.getAttribute("dir") === "rtl");
  }, []);
  const canEdit = editable && !rtl;
  const canLink = canEdit && !!onDependencyChange;
  const instructions = useId();
  const linkInstructions = useId();

  // Edit (s23), pointer or keyboard: `session` drives it, `preview` only
  // draws it. One session at a time.
  const session = useRef<Drag | KeyEdit | LinkSession | KeyLink | null>(null);
  const dragOf = () => {
    const current = session.current;
    return current && "edges" in current ? current : null;
  };
  const linkOf = () => {
    const current = session.current;
    return current && "connector" in current ? current : null;
  };
  const keyEditOf = () => {
    const current = session.current;
    return current && "row" in current ? current : null;
  };
  const keyLinkOf = () => {
    const current = session.current;
    return current && "candidate" in current ? current : null;
  };
  const [preview, setPreview] = useState<
    (Preview & { id: string; mode: GanttEditMode }) | null
  >(null);
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => () => session.current?.unlisten(), []);

  // Link editing (s24): what a link session shows (its source, the
  // prospective link, a row's sentence); a refusal's sentence outlives the
  // pointer session.
  const [linkView, setLinkView] = useState<{
    source?: string;
    from?: string;
    to?: string;
    tip?: { id: string; text: string; refused: boolean };
  } | null>(null);
  const [selected, setSelected] = useState<LinkPair | null>(null);
  const taskOf = (id: string) => tasks.find((task) => task.id === id);

  // Dependencies (s24): valid links (bounded), drawn from the dates shown,
  // the dragged task's preview included, so a move shows a conflict live.
  const links = useMemo(
    () => normalizeLinks(dependencies, new Set(tasks.map((task) => task.id))),
    [dependencies, tasks],
  );
  // A prospective link needs the ends even before the first link exists.
  const creatingTo = linkView?.to;
  const shown = useMemo(
    () =>
      links.length === 0 && creatingTo === undefined
        ? null
        : tasks.map((task) =>
            preview?.id === task.id
              ? { ...task, start: preview.start, end: preview.end }
              : task,
          ),
    [links, tasks, preview, creatingTo],
  );
  const linkState = useMemo(() => {
    if (!shown) return null;
    const ends = new Map<string, LinkEnd | null>();
    const spans = new Map<string, LinkSpan | null>();
    const byId = new Map<string, GanttTask>();
    shown.forEach((task, row) => {
      const position = scale.positionOf(task);
      ends.set(task.id, position && { row, ...position });
      const start = toDay(task.start);
      const end = toDay(task.end);
      spans.set(task.id, start && end ? { start, end } : null);
      byId.set(task.id, task);
    });
    return { ends, byId, conflicts: conflictsOf(links, spans) };
  }, [shown, scale, links]);

  // The live region names a conflict once, when a session creates it.
  const heardConflicts = useRef<ReadonlySet<string>>(new Set());
  useEffect(() => {
    const conflicts = linkState?.conflicts ?? new Set<string>();
    const fresh = preview
      ? links.filter(
          (link) =>
            conflicts.has(linkKey(link)) &&
            !heardConflicts.current.has(linkKey(link)),
        )
      : [];
    heardConflicts.current = conflicts;
    if (!fresh.length || !linkState) return;
    const name = (id: string) => linkState.byId.get(id)!.name;
    setAnnouncement((said) =>
      [
        said,
        ...fresh.map((link) =>
          t("components.gantt.announce_conflict", {
            from: name(link.from),
            to: name(link.to),
          }),
        ),
      ].join(" "),
    );
  }, [linkState, links, preview, t]);

  // What a row says about its links (aria-describedby), and the list.
  const descriptionId = useId();
  const linkTexts = useMemo(() => {
    if (!linkState || links.length === 0) return null;
    const { byId, conflicts } = linkState;
    const name = (id: string) => byId.get(id)!.name;
    const listFormat = new ListFormat(locale, {
      type: "unit",
      style: "short",
    });
    const names = (ids: string[]) => {
      const list = listFormat.format(ids.slice(0, 5).map(name));
      return ids.length > 5
        ? t("components.gantt.names_more", {
            names: list,
            count: ids.length - 5,
          })
        : list;
    };
    const clashes = new Map<string, string[]>();
    const items = links.map((link) => {
      const key = linkKey(link);
      const vars = { from: name(link.from), to: name(link.to) };
      if (!conflicts.has(key)) {
        return { key, text: t("components.gantt.dependency_item", vars) };
      }
      for (const [id, other] of [
        [link.from, link.to],
        [link.to, link.from],
      ]) {
        clashes.set(id, [...(clashes.get(id) ?? []), other]);
      }
      const succ = formatDates(byId.get(link.to)!, locale)!;
      const pred = formatDates(byId.get(link.from)!, locale)!;
      const conflictVars = { ...vars, start: succ.start, end: pred.end };
      return {
        key,
        text: fill(
          t("components.gantt.dependency_item_conflict", conflictVars),
          conflictVars,
        ),
      };
    });
    const rows = new Map<string, string>();
    for (const [id, { after, before }] of neighboursOf(links)) {
      rows.set(
        id,
        [
          after.length > 0 &&
            t("components.gantt.row_starts_after", { names: names(after) }),
          before.length > 0 &&
            t("components.gantt.row_required_by", { names: names(before) }),
          clashes.has(id) &&
            t("components.gantt.row_conflict", {
              names: names(clashes.get(id)!),
            }),
        ]
          .filter(Boolean)
          .map((sentence) => `${sentence}.`)
          .join(" "),
      );
    }
    return { items, rows };
  }, [linkState, links, locale, t]);

  // Links are not drawn right-to-left (the clip assumes ltr); still listed.
  const linksRef = useRef<HTMLDivElement>(null);
  // A link session's sentence beside a bar is drawn in the overlay.
  const tipTask = linkView?.tip && taskOf(linkView.tip.id);
  const tipPlace = tipTask ? scale.positionOf(tipTask) : null;
  const drawLinks =
    (links.length > 0 || creatingTo !== undefined || tipPlace !== null) && !rtl;
  // The clip follows the scroll offset: one passive listener, one write per
  // frame, straight on the overlay (no render).
  useEffect(() => {
    const el = scrollerRef.current;
    if (!drawLinks || !el) return;
    let frame = 0;
    const write = () => {
      frame = 0;
      linksRef.current?.style.setProperty(
        "--gantt-scroll",
        `${el.scrollLeft}px`,
      );
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(write);
    };
    write();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [drawLinks]);

  const say = (key: string, name: string, span: GanttUnitSpan) => {
    const dates = formatDates({ id: "", name, ...span }, locale);
    setAnnouncement(t(`components.gantt.${key}`, { name, ...dates }));
  };

  // Every exit closes the session first, so a later event finds none.
  // `commit` renders in the same pass, so an applied change never shows the
  // original dates in between.
  const close = (commit?: () => void) => {
    const current = session.current;
    if (!current || !("bar" in current)) return null;
    session.current = null;
    current.unlisten();
    // The bar jumps to its final place: the zoom tween stays off until the
    // jump is laid out. Its links jump with it.
    const layer = linksRef.current;
    current.bar.style.setProperty("transition", "none");
    layer?.setAttribute("data-settling", "");
    flushSync(() => {
      setPreview(null);
      commit?.();
    });
    void current.bar.offsetWidth;
    current.bar.style.removeProperty("transition");
    layer?.removeAttribute("data-settling");
    return current;
  };

  const cancel = () => {
    if (linkOf() || keyLinkOf()) return cancelLink();
    const current = close();
    if (!current) return;
    if (
      "pointerId" in current &&
      current.bar.hasPointerCapture(current.pointerId)
    ) {
      current.bar.releasePointerCapture(current.pointerId);
    }
    say("announce_cancelled", current.name, current.original);
  };

  // Escape and leaving the window cancel any session; returns the undo.
  const listen = () => {
    const onKey = (key: globalThis.KeyboardEvent) => {
      if (key.key !== "Escape") return;
      // Ours while the session runs: an enclosing dialog stays open.
      key.stopPropagation();
      key.preventDefault();
      cancel();
    };
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("blur", cancel);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("blur", cancel);
    };
  };

  // The one commit of a session: reported unless nothing changed. `pxPerDay`
  // keeps the leftmost visible day if the change moves the axis origin.
  const finish = (span: GanttUnitSpan, pxPerDay: number) => {
    const current = dragOf() ?? keyEditOf();
    if (!current) return;
    const report = isNoop(current.original, span) ? undefined : onTaskChange;
    close(
      report
        ? () => {
            const el = scrollerRef.current;
            if (el) {
              anchor.current = {
                zoom,
                left: el.scrollLeft,
                origin: scale.origin,
                pxPerDay,
              };
            }
            report(current.id, toChange(span));
          }
        : undefined,
    );
    if (report) say("announce_changed", current.name, span);
  };

  // One keyboard step of `mode`, counted from the original dates. Refused
  // past the axis or once the end sits on the start, so it stays bounded.
  const step = (edit: KeyEdit, mode: "move" | "resize-end", dir: number) => {
    const move = edit.unitDelta + (mode === "move" ? dir : 0);
    const end = edit.endDelta + (mode === "move" ? 0 : dir);
    const next = keySpan(edit, move, end);
    if (next && !isNoop(edit.span, next)) {
      edit.unitDelta = move;
      edit.endDelta = end;
      edit.span = { start: next.start, end: next.end };
    }
    edit.mode = mode;
    edit.limit = !next
      ? "limit_axis"
      : next.clamped
        ? "limit_end_before_start"
        : undefined;
    setPreview({ id: edit.id, mode, ...edit.span, limit: edit.limit });
    if (edit.limit) setAnnouncement(t(`components.gantt.${edit.limit}`));
    else say("announce_preview", edit.name, edit.span);
  };

  // In front of the row navigation: Alt/Shift+Left/Right edit the focused
  // row, Enter commits, a navigation key cancels first. True when consumed
  // (only then is the key kept from the browser: Alt+Arrow is history
  // back/forward on Windows and Linux).
  const onEditKey = (
    event: KeyboardEvent<HTMLDivElement>,
    row: HTMLElement,
    index: number,
  ) => {
    const keyEdit = keyEditOf();
    if (keyEdit && event.key === "Enter") {
      event.preventDefault();
      finish(keyEdit.span, px(scale.dayWidth));
      keyEdit.bar.scrollIntoView({ block: "nearest", inline: "nearest" });
      return true;
    }
    if (keyEdit && KEYS[event.key]) {
      cancel();
      return false;
    }
    const dir = CHORDS[event.key];
    if (
      !canEdit ||
      !dir ||
      event.altKey === event.shiftKey ||
      event.ctrlKey ||
      event.metaKey ||
      (session.current && !keyEdit)
    )
      return false;
    const edit = keyEdit ?? startKeyEdit(row, index);
    if (!edit) return false;
    event.preventDefault();
    step(edit, event.altKey ? "move" : "resize-end", dir);
    return true;
  };

  const startKeyEdit = (row: HTMLElement, index: number) => {
    const task = tasks[index];
    const original = editableSpan(task, scale);
    const bar = row.querySelector<HTMLElement>(".c__gantt__bar");
    if (!original || !bar) return null;
    const edit: KeyEdit = {
      id: task.id,
      name: task.name,
      mode: "move",
      bar,
      row,
      zoom,
      axis: scale,
      original,
      span: original,
      unitDelta: 0,
      endDelta: 0,
      unlisten: listen(),
    };
    session.current = edit;
    return edit;
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const connector = (event.target as HTMLElement).closest<HTMLElement>(
      ".c__gantt__connector",
    );
    if (connector) {
      if (
        canLink &&
        event.button === 0 &&
        !session.current &&
        connector.closest('[role="grid"]') === gridRef.current
      )
        startLink(event, connector);
      return;
    }
    const bar = (event.target as HTMLElement).closest<HTMLElement>(
      ".c__gantt__bar",
    );
    if (
      !canEdit ||
      event.button !== 0 ||
      session.current ||
      !bar ||
      bar.closest('[role="grid"]') !== gridRef.current
    )
      return;
    const task = tasks.find((item) => item.id === bar.dataset.taskId);
    const original = editableSpan(task, scale);
    if (!task || !original) return;
    const edge = (event.target as HTMLElement).closest<HTMLElement>(
      ".c__gantt__handle",
    )?.dataset.edge;
    const mode: GanttEditMode =
      edge === "end" ? "resize-end" : edge ? "resize-start" : "move";
    // Measured, never the rem constant; unmeasured geometry starts nothing.
    const pxPerDay =
      bar.parentElement!.getBoundingClientRect().width / scale.days;
    if (!Number.isFinite(pxPerDay) || pxPerDay <= 0) return;
    const scroller = scrollerRef.current!;
    const box = scroller.getBoundingClientRect();
    const left = gridRef
      .current!.querySelector(":scope > .c__gantt__axis > .c__gantt__task")!
      .getBoundingClientRect().right;
    const right = box.left + scroller.clientLeft + scroller.clientWidth;
    bar.setPointerCapture(event.pointerId);
    const off = listen();
    const current: Drag = {
      id: task.id,
      name: task.name,
      mode,
      bar,
      pointerId: event.pointerId,
      x: event.clientX,
      scroll: scroller.scrollLeft,
      lastX: event.clientX,
      edges: right - left > 2 * EDGE ? { left, right } : null,
      frame: 0,
      pxPerDay,
      zoom,
      axis: scale,
      original,
      unitDelta: 0,
      unlisten: () => {
        off();
        cancelAnimationFrame(current.frame);
      },
    };
    session.current = current;
    setPreview({ id: task.id, mode, ...original });
  };

  // The preview from the pointer and the scroll, once per snapped step.
  const update = (current: Drag) => {
    const { mode, original, zoom } = current;
    const scrolled =
      (scrollerRef.current?.scrollLeft ?? current.scroll) - current.scroll;
    const wanted = unitsFromPixels(
      current.lastX - current.x + scrolled,
      current.pxPerDay,
      zoom,
      // The edited edge: months differ in length.
      mode === "resize-end" ? original.end : original.start,
    );
    const n = clampToAxis(original, current.axis, wanted, zoom, mode);
    const next = editSpan(mode, original, zoom, n);
    const limit = n !== wanted ? "limit_axis" : next.limit;
    if (n === current.unitDelta && limit === current.limit) return;
    current.unitDelta = n;
    current.limit = limit;
    setPreview({ id: current.id, mode, ...next, limit });
    if (limit) setAnnouncement(t(`components.gantt.${limit}`));
    else say("announce_preview", current.name, next);
  };

  // How far the pointer is into an edge zone of the visible track (signed).
  const edgeDepth = ({ edges, lastX }: Drag) =>
    !edges
      ? 0
      : lastX < edges.left + EDGE
        ? lastX - edges.left - EDGE
        : lastX > edges.right - EDGE
          ? lastX - edges.right + EDGE
          : 0;

  // One frame of auto-scroll, faster deeper into the zone (MAX_SPEED at
  // most); it stops out of the zone, at the end of the box, and with the
  // session (`unlisten` cancels the frame).
  const autoScroll = (current: Drag) => {
    const el = scrollerRef.current;
    current.frame = 0;
    if (!el) return;
    const depth = edgeDepth(current);
    if (!depth) return;
    const before = el.scrollLeft;
    el.scrollLeft +=
      Math.sign(depth) *
      Math.ceil(Math.min(1, Math.abs(depth) / EDGE) * MAX_SPEED);
    if (el.scrollLeft === before) return;
    update(current);
    current.frame = requestAnimationFrame(() => autoScroll(current));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const link = linkOf();
    if (link && event.pointerId === link.pointerId) {
      link.x = event.clientX;
      link.y = event.clientY;
      return retarget(link);
    }
    const current = dragOf();
    if (!current || event.pointerId !== current.pointerId) return;
    current.lastX = event.clientX;
    update(current);
    if (!current.frame && edgeDepth(current)) {
      current.frame = requestAnimationFrame(() => autoScroll(current));
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const link = linkOf();
    if (link && event.pointerId === link.pointerId) {
      return endLink(link, event.clientX, event.clientY);
    }
    const current = dragOf();
    if (event.pointerId !== current?.pointerId) return;
    const { mode, original, zoom, unitDelta, pxPerDay } = current;
    finish(editSpan(mode, original, zoom, unitDelta), pxPerDay);
  };

  // Released elsewhere than by pointerup (which closes the session first).
  const onPointerLost = (event: PointerEvent<HTMLDivElement>) => {
    const pointerId = (dragOf() ?? linkOf())?.pointerId;
    if (event.pointerId === pointerId) cancel();
  };

  // Link editing (s24). Sentences fill every variable (`fill`).
  const text = (key: string, vars: Record<string, string> = {}) =>
    fill(t(`components.gantt.${key}`, vars), vars);
  // A task without a bar (no dates, outside the window) cannot be linked.
  const hasBar = (id: string) => {
    const task = taskOf(id);
    return !!task && scale.positionOf(task) !== null;
  };
  const refusalText = (refusal: LinkRefusal, from: GanttTask, to: GanttTask) =>
    text(`link_refused_${refusal}`, {
      from: from.name,
      to: to.name,
      name: (hasBar(from.id) ? to : from).name,
      count: String(MAX_LINKS),
    });

  // The task row under a point of the visible box (not under the axis).
  const rowAt = (x: number, y: number) => {
    const box = scrollerRef.current?.getBoundingClientRect();
    const axis = gridRef.current
      ?.querySelector(":scope > .c__gantt__axis")
      ?.getBoundingClientRect();
    if (!box || x < box.left || x > box.right || y > box.bottom) return null;
    if (y < Math.max(box.top, axis?.bottom ?? box.top)) return null;
    const index = taskRows().findIndex((row) => {
      const rect = row.getBoundingClientRect();
      return y >= rect.top && y < rect.bottom;
    });
    return tasks[index] ?? null;
  };

  // The verdict on the row under the pointer, drawn and spoken only when it
  // changes (not per pixel).
  const retarget = (current: LinkSession) => {
    const over = rowAt(current.x, current.y);
    const source = taskOf(current.from);
    const target = over && over.id !== current.from ? over : null;
    const refusal = target && checkLink(links, current.from, target.id, hasBar);
    if ((over?.id ?? null) === current.over && refusal === current.refusal)
      return;
    current.over = over?.id ?? null;
    current.refusal = refusal;
    if (!target || !source) {
      setLinkView({
        source: current.from,
        tip: { id: current.from, text: text("link_tip_drop"), refused: false },
      });
    } else if (refusal) {
      const sentence = refusalText(refusal, source, target);
      setLinkView({
        source: current.from,
        tip: { id: target.id, text: sentence, refused: true },
      });
      setAnnouncement(sentence);
    } else {
      setLinkView({
        source: current.from,
        from: current.from,
        to: target.id,
        tip: {
          id: target.id,
          text: text("link_tip_target", {
            from: source.name,
            to: target.name,
          }),
          refused: false,
        },
      });
    }
  };

  const startLink = (event: PointerEvent<HTMLDivElement>, el: HTMLElement) => {
    const task = tasks[taskRows().indexOf(el.closest(".c__gantt__row")!)];
    const scroller = scrollerRef.current;
    if (!task || !scroller) return;
    el.setPointerCapture(event.pointerId);
    const off = listen();
    // The box may scroll (wheel) under a still pointer.
    const onScroll = () => {
      if (session.current === current) retarget(current);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    const current: LinkSession = {
      from: task.id,
      pointerId: event.pointerId,
      connector: el,
      x: event.clientX,
      y: event.clientY,
      over: task.id,
      refusal: null,
      unlisten: () => {
        off();
        scroller.removeEventListener("scroll", onScroll);
      },
    };
    session.current = current;
    setLinkView({
      source: task.id,
      tip: { id: task.id, text: text("link_tip_drop"), refused: false },
    });
  };

  const closeLink = () => {
    const current = linkOf() ?? keyLinkOf();
    if (!current) return null;
    session.current = null;
    current.unlisten();
    return current;
  };

  const cancelLink = () => {
    const current = closeLink();
    if (!current) return;
    if (
      "connector" in current &&
      current.connector.hasPointerCapture(current.pointerId)
    ) {
      current.connector.releasePointerCapture(current.pointerId);
    }
    setLinkView(null);
    setAnnouncement(text("announce_link_cancelled"));
  };

  // Released on a row: the one report of a session, or its refusal, which
  // stays until the next pointer down, key press or focus change.
  const endLink = (current: LinkSession, x: number, y: number) => {
    const over = rowAt(x, y);
    const source = taskOf(current.from);
    if (!over || !source) return cancelLink();
    closeLink();
    const refusal = checkLink(links, source.id, over.id, hasBar);
    if (refusal) {
      const sentence = refusalText(refusal, source, over);
      setLinkView({ tip: { id: over.id, text: sentence, refused: true } });
      setAnnouncement(sentence);
      return;
    }
    setLinkView(null);
    onDependencyChange?.({
      kind: "add",
      dependency: { from: source.id, to: over.id },
    });
    setAnnouncement(
      text("announce_link_added", { from: source.name, to: over.name }),
    );
  };

  const lingering = !!linkView?.tip && !linkView.source;
  useEffect(() => {
    if (!lingering) return;
    const clear = () => setLinkView(null);
    const events = ["pointerdown", "keydown", "focusin"];
    for (const type of events) document.addEventListener(type, clear, true);
    return () => {
      for (const type of events)
        document.removeEventListener(type, clear, true);
    };
  }, [lingering]);

  // The selected link, while it is still in the data.
  const selectedLink =
    canLink &&
    selected &&
    links.some((l) => l.from === selected.from && l.to === selected.to)
      ? selected
      : null;
  if (selected && !selectedLink) setSelected(null);
  const selectedKey = selectedLink && linkKey(selectedLink);

  // Remove takes the focus; a press anywhere else deselects.
  useLayoutEffect(() => {
    if (!selectedKey) return;
    gridRef.current?.querySelector<HTMLElement>(".c__gantt__remove")?.focus();
    const onDown = (event: Event) => {
      if (
        !(event.target instanceof Element) ||
        !event.target.closest(".c__gantt__remove")
      )
        setSelected(null);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [selectedKey]);

  // Back to the predecessor row (Remove leaves with the selection).
  const deselect = (link: LinkPair) => {
    taskRows()[tasks.findIndex((task) => task.id === link.from)]?.focus();
    setSelected(null);
  };

  const removeSelected = () => {
    if (!selectedLink) return;
    const from = taskOf(selectedLink.from)!;
    const to = taskOf(selectedLink.to)!;
    deselect(selectedLink);
    onDependencyChange?.({
      kind: "remove",
      dependency: { from: from.id, to: to.id },
    });
    setAnnouncement(
      text("announce_link_removed", { from: from.name, to: to.name }),
    );
  };

  // The keyboard link session (s24): the pair it would add or remove.
  const pairOf = ({ source, predecessor, candidate }: KeyLink): LinkPair =>
    predecessor
      ? { from: source, to: candidate }
      : { from: candidate, to: source };

  // Draws, says and shows the candidate, on every key of the session: an
  // unchanged sentence leaves the live region silent.
  const showCandidate = (current: KeyLink) => {
    // Into view as the row navigation does (the scroll padding keeps it
    // clear of the sticky column and axis); a row without a bar by its name.
    const row = taskRows()[tasks.findIndex((t) => t.id === current.candidate)];
    (
      row?.querySelector(".c__gantt__bar") ??
      row?.querySelector(".c__gantt__task")
    )?.scrollIntoView({ block: "nearest", inline: "nearest" });
    const pair = pairOf(current);
    const from = taskOf(pair.from)!;
    const to = taskOf(pair.to)!;
    const vars = { from: from.name, to: to.name };
    const refusal = checkLink(links, pair.from, pair.to, hasBar);
    const tip = (sentence: string, refused = false) => ({
      id: current.candidate,
      text: sentence,
      refused,
    });
    if (refusal === "exists") {
      const sentence = text("announce_link_exists", vars);
      setLinkView({ source: current.source, tip: tip(sentence) });
      setAnnouncement(sentence);
    } else if (refusal) {
      const sentence = refusalText(refusal, from, to);
      setLinkView({ source: current.source, tip: tip(sentence, true) });
      // Two refused candidates in a row must not sound the same.
      setAnnouncement(`${text("link_tip_target", vars)}. ${sentence}`);
    } else {
      setLinkView({
        source: current.source,
        ...pair,
        tip: tip(text("link_tip_target", vars)),
      });
      setAnnouncement(text("announce_link_target", vars));
    }
  };

  // The first candidate: the nearest dated row on the chord's side (below
  // for Right, above for Left), then on the other side, else the nearest
  // other row (refused: no dates). Bounded by the task count.
  const firstCandidate = (source: number, down: boolean) => {
    const side = (step: number) =>
      tasks.flatMap((_, i) => {
        const at = source + step * (i + 1);
        return at >= 0 && at < tasks.length ? [at] : [];
      });
    const order = [...side(down ? 1 : -1), ...side(down ? -1 : 1)];
    return order.find((i) => scale.positionOf(tasks[i]) !== null) ?? order[0];
  };

  // `next` (a navigation key's row), past the source and within the rows.
  const pickCandidate = (at: number, source: number, next: number) => {
    if (next === source) {
      const dir = Math.sign(next - at);
      next =
        next + dir >= 0 && next + dir < tasks.length
          ? next + dir
          : source - dir;
    }
    return next >= 0 && next < tasks.length ? next : at;
  };

  // Enter: the one report of the session; a refused candidate keeps it open.
  const applyKeyLink = (current: KeyLink) => {
    const pair = pairOf(current);
    const from = taskOf(pair.from);
    const to = taskOf(pair.to);
    if (!from || !to) return cancelLink();
    const refusal = checkLink(links, pair.from, pair.to, hasBar);
    if (refusal && refusal !== "exists") return showCandidate(current);
    closeLink();
    setLinkView(null);
    onDependencyChange?.({
      kind: refusal ? "remove" : "add",
      dependency: { from: from.id, to: to.id },
    });
    setAnnouncement(
      text(refusal ? "announce_link_removed" : "announce_link_added", {
        from: from.name,
        to: to.name,
      }),
    );
  };

  // In front of the s23 keys: Alt+Shift+Left/Right start a session on a
  // row with a bar; during it, the navigation keys move the candidate and
  // never leave the row, Enter applies. True when consumed (only then is
  // the key kept from the browser).
  const onLinkKey = (
    event: KeyboardEvent<HTMLDivElement>,
    row: HTMLElement,
    index: number,
  ) => {
    const modified =
      event.altKey || event.shiftKey || event.ctrlKey || event.metaKey;
    const current = keyLinkOf();
    if (current) {
      if (modified) return false;
      if (event.key === "Enter") {
        event.preventDefault();
        applyKeyLink(current);
        return true;
      }
      const move = KEYS[event.key];
      if (!move) return false;
      event.preventDefault();
      const at = tasks.findIndex((task) => task.id === current.candidate);
      const source = tasks.findIndex((task) => task.id === current.source);
      if (at < 0 || source < 0) {
        cancelLink();
        return true;
      }
      const next = pickCandidate(at, source, move(at, tasks.length - 1));
      // A clamped key says the same sentence: the live region stays silent.
      current.candidate = tasks[next].id;
      showCandidate(current);
      return true;
    }
    const predecessor = LINK_CHORDS[event.key];
    if (
      !canLink ||
      predecessor === undefined ||
      !event.altKey ||
      !event.shiftKey ||
      event.ctrlKey ||
      event.metaKey ||
      session.current ||
      scale.positionOf(tasks[index]) === null
    )
      return false;
    const at = firstCandidate(index, predecessor);
    if (at === undefined) return false;
    event.preventDefault();
    const started: KeyLink = {
      source: tasks[index].id,
      sourceRow: row,
      predecessor,
      candidate: tasks[at].id,
      unlisten: listen(),
    };
    session.current = started;
    showCandidate(started);
    return true;
  };

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest(".c__gantt__remove")) return removeSelected();
    const link = target
      .closest(".c__gantt__link-hit")
      ?.closest<HTMLElement>(".c__gantt__link");
    if (!canLink || !link || link.closest('[role="grid"]') !== gridRef.current)
      return;
    setSelected({ from: link.dataset.from!, to: link.dataset.to! });
  };

  // Remove's keys (Enter and Space click it).
  const onRemoveKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!selectedLink) return;
    if (event.key === "Escape") {
      // Ours: an enclosing dialog stays open.
      event.preventDefault();
      event.stopPropagation();
      deselect(selectedLink);
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      removeSelected();
    }
  };

  return (
    <div
      {...props}
      ref={rootRef}
      className={clsx("c__gantt", className)}
      data-zoom={zoom}
      data-editable={canEdit || undefined}
      data-linkable={canLink || undefined}
      data-editing={preview?.mode ?? (linkView?.source ? "link" : undefined)}
    >
      <div
        role="group"
        aria-label={t("components.gantt.zoom_aria_label")}
        className="c__gantt__zoom"
      >
        {ZOOMS.map((value) => (
          <Button
            key={value}
            type="button"
            size="small"
            variant={value === zoom ? "secondary" : "tertiary"}
            aria-pressed={value === zoom}
            onClick={() => requestZoom(value)}
          >
            {t(`components.gantt.zoom_${value}`)}
          </Button>
        ))}
      </div>
      <div ref={scrollerRef} className="c__gantt__scroller">
        <div
          ref={gridRef}
          role="grid"
          aria-label={ariaLabel}
          aria-rowcount={tasks.length + 1}
          aria-colcount={2}
          className="c__gantt__grid"
          style={{ "--gantt-days": scale.days } as CSSProperties}
          onFocus={onFocus}
          onBlur={(event) => {
            if (event.relatedTarget) focusedId.current = undefined;
            // Focus leaving the edited row cancels its keyboard session.
            const row = keyEditOf()?.row ?? keyLinkOf()?.sourceRow;
            if (event.target === row) cancel();
          }}
          onKeyDown={onKeyDown}
          onClick={onClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerLost}
          onLostPointerCapture={onPointerLost}
        >
          {scale.todayOffset !== null && (
            <div
              className="c__gantt__today"
              aria-hidden="true"
              style={place(scale.todayOffset)}
            />
          )}
          <div role="row" aria-rowindex={1} className="c__gantt__axis">
            <div role="columnheader" className="c__gantt__task">
              {t("components.gantt.task_column")}
            </div>
            <div
              role="columnheader"
              aria-label={t("components.gantt.schedule_column")}
              className="c__gantt__track"
            >
              {/* The months stay exposed: a header needs text (axe
                  empty-table-header); the dense lower tier is hidden. */}
              {tiers.map((tier, i) => (
                <div
                  key={i}
                  className="c__gantt__axis-tier"
                  aria-hidden={i > 0 || undefined}
                >
                  {tier.map((segment) => (
                    <span
                      key={segment.key}
                      className="c__gantt__axis-label"
                      style={place(segment.start, segment.span)}
                    >
                      {segment.label}
                    </span>
                  ))}
                </div>
              ))}
              {scale.todayOffset !== null && (
                <span
                  className="c__gantt__axis-label"
                  data-today
                  aria-hidden="true"
                  style={place(scale.todayOffset)}
                >
                  {t("components.gantt.today")}
                </span>
              )}
            </div>
          </div>
          {tasks.map((task, i) => (
            <GanttRow
              key={task.id}
              task={task}
              index={i}
              tabIndex={i === stopIndex ? 0 : -1}
              scale={scale}
              locale={locale}
              editable={canEdit}
              instructions={instructions}
              linkInstructions={linkInstructions}
              description={
                linkTexts?.rows.has(task.id)
                  ? `${descriptionId}-${i}`
                  : undefined
              }
              preview={preview?.id === task.id ? preview : undefined}
              linkable={canLink}
              linkSource={linkView?.source === task.id || undefined}
              linkTip={
                linkView?.tip?.id === task.id ? linkView.tip.text : undefined
              }
              linkRefused={
                linkView?.tip?.id === task.id ? linkView.tip.refused : undefined
              }
              removeLabel={
                selectedLink?.to === task.id
                  ? text("link_remove", {
                      from: taskOf(selectedLink.from)!.name,
                      to: task.name,
                    })
                  : undefined
              }
            />
          ))}
          {drawLinks && (
            <GanttLinks
              layerRef={linksRef}
              links={links}
              ends={linkState?.ends ?? NO_ENDS}
              conflicts={linkState?.conflicts ?? NO_CONFLICTS}
              dayWidth={scale.dayWidth}
              rows={tasks.length}
              interactive={canLink}
              selected={selectedKey}
              creatingFrom={
                creatingTo === undefined ? undefined : linkView?.from
              }
              creatingTo={creatingTo}
              days={scale.days}
              {...(tipPlace && {
                tipId: tipTask!.id,
                tipText: linkView!.tip!.text,
                tipRefused: linkView!.tip!.refused,
                tipRow: tasks.indexOf(tipTask!),
                tipStart: tipPlace.start,
                tipSpan: tipPlace.span,
              })}
            />
          )}
        </div>
        {tasks.length === 0 && (
          <p className="c__gantt__empty">{t("components.gantt.empty")}</p>
        )}
      </div>
      {linkTexts && (
        <>
          <VisuallyHidden
            elementType="ul"
            aria-label={t("components.gantt.dependencies_list_label")}
          >
            {linkTexts.items.map(({ key, text }) => (
              <li key={key}>{text}</li>
            ))}
          </VisuallyHidden>
          <VisuallyHidden>
            {tasks.map(
              (task, i) =>
                linkTexts.rows.has(task.id) && (
                  <div key={task.id} id={`${descriptionId}-${i}`}>
                    {linkTexts.rows.get(task.id)}
                  </div>
                ),
            )}
          </VisuallyHidden>
        </>
      )}
      {canEdit && (
        <>
          <VisuallyHidden role="status" className="c__gantt__live">
            {announcement}
          </VisuallyHidden>
          <VisuallyHidden id={instructions}>
            {t("components.gantt.edit_instructions")}
          </VisuallyHidden>
          {canLink && (
            <VisuallyHidden id={linkInstructions}>
              {t("components.gantt.link_instructions")}
            </VisuallyHidden>
          )}
        </>
      )}
    </div>
  );
};
