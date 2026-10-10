import clsx from "clsx";
import {
  CSSProperties,
  FocusEvent,
  KeyboardEvent,
  memo,
  PointerEvent,
  useEffect,
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
  GanttUnitSpan,
  isNoop,
  moveSpan,
  toChange,
  unitsFromPixels,
} from "./edit";
import { buildScale, dayIndex, formatDates, GanttScale, toDay } from "./scale";
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

/** What the dragged row draws instead of the task's dates. */
type Preview = GanttUnitSpan & { clamped: boolean };

type RowProps = {
  task: GanttTask;
  index: number;
  tabIndex: number;
  scale: GanttScale;
  locale: string;
  preview?: Preview;
};

// Memoised: a drag re-renders the dragged row only.
const GanttRow = memo(function GanttRow({
  task,
  index,
  tabIndex,
  scale,
  locale,
  preview,
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
  return (
    <div
      role="row"
      aria-rowindex={index + 2}
      aria-label={label}
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
            data-clamped={preview?.clamped || undefined}
            aria-hidden="true"
            style={place(position.start, position.span)}
          />
        )}
        {position && previewDates && (
          <div
            className="c__gantt__tip"
            aria-hidden="true"
            // Beside the bar, on its wider side of the track.
            data-side={
              position.start > scale.days - position.start - position.span
                ? "start"
                : "end"
            }
            style={place(position.start, position.span)}
          >
            {preview.clamped
              ? t("components.gantt.limit_axis")
              : t("components.gantt.tooltip_dates", previewDates)}
          </div>
        )}
      </div>
    </div>
  );
});

/** A pointer edit in progress (refs: read synchronously by every exit). */
type Drag = {
  id: string;
  name: string;
  bar: HTMLElement;
  pointerId: number;
  x: number;
  pxPerDay: number;
  original: GanttUnitSpan;
  unitDelta: number;
  clamped: boolean;
  unlisten: () => void;
};

export const Gantt = ({
  tasks,
  zoom: zoomProp,
  defaultZoom = "week",
  onZoomChange,
  today,
  editable = false,
  onTaskChange,
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
    const rows = taskRows();
    const from = rows.indexOf(event.target as HTMLElement);
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

  // Pointer edit (s23): `drag` drives it, `preview` only draws it.
  const drag = useRef<Drag | null>(null);
  const [preview, setPreview] = useState<(Preview & { id: string }) | null>(
    null,
  );
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => () => drag.current?.unlisten(), []);

  const say = (key: string, name: string, span: GanttUnitSpan) => {
    const dates = formatDates({ id: "", name, ...span }, locale);
    setAnnouncement(t(`components.gantt.${key}`, { name, ...dates }));
  };

  // Every exit closes the session first, so a later event finds none.
  // `commit` renders in the same pass, so an applied change never shows the
  // original dates in between.
  const close = (commit?: () => void) => {
    const current = drag.current;
    drag.current = null;
    if (!current) return null;
    current.unlisten();
    // The bar jumps to its final place: the zoom tween stays off until the
    // jump is laid out.
    current.bar.style.setProperty("transition", "none");
    flushSync(() => {
      setPreview(null);
      commit?.();
    });
    void current.bar.offsetWidth;
    current.bar.style.removeProperty("transition");
    return current;
  };

  const cancel = () => {
    const current = close();
    if (!current) return;
    if (current.bar.hasPointerCapture(current.pointerId)) {
      current.bar.releasePointerCapture(current.pointerId);
    }
    say("announce_cancelled", current.name, current.original);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const bar = (event.target as HTMLElement).closest<HTMLElement>(
      ".c__gantt__bar",
    );
    if (
      !editable ||
      event.button !== 0 ||
      drag.current ||
      !bar ||
      bar.closest('[role="grid"]') !== gridRef.current
    )
      return;
    const task = tasks.find((item) => item.id === bar.dataset.taskId);
    const start = toDay(task?.start);
    const end = toDay(task?.end);
    // A bar clipped by the window has no real geometry to drag.
    if (
      !task ||
      !start ||
      !end ||
      start.compare(scale.origin) < 0 ||
      end.compare(scale.end) > 0
    )
      return;
    // Measured, never the rem constant; unmeasured geometry starts nothing.
    const pxPerDay =
      bar.parentElement!.getBoundingClientRect().width / scale.days;
    if (!Number.isFinite(pxPerDay) || pxPerDay <= 0) return;
    bar.setPointerCapture(event.pointerId);
    const onKey = (key: globalThis.KeyboardEvent) => {
      if (key.key !== "Escape") return;
      // Ours while the session runs: an enclosing dialog stays open.
      key.stopPropagation();
      key.preventDefault();
      cancel();
    };
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("blur", cancel);
    drag.current = {
      id: task.id,
      name: task.name,
      bar,
      pointerId: event.pointerId,
      x: event.clientX,
      pxPerDay,
      original: { start, end },
      unitDelta: 0,
      clamped: false,
      unlisten: () => {
        document.removeEventListener("keydown", onKey, true);
        window.removeEventListener("blur", cancel);
      },
    };
    setPreview({ id: task.id, start, end, clamped: false });
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || event.pointerId !== current.pointerId) return;
    const wanted = unitsFromPixels(
      event.clientX - current.x,
      current.pxPerDay,
      zoom,
      current.original.start,
    );
    const n = clampToAxis(current.original, scale, wanted, zoom, "move");
    const clamped = n !== wanted;
    // Once per snapped step, not per pixel.
    if (n === current.unitDelta && clamped === current.clamped) return;
    current.unitDelta = n;
    current.clamped = clamped;
    const span = moveSpan(current.original, zoom, n);
    setPreview({ id: current.id, ...span, clamped });
    if (clamped) setAnnouncement(t("components.gantt.limit_axis"));
    else say("announce_preview", current.name, span);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerId !== drag.current?.pointerId) return;
    const { id, name, original, unitDelta, pxPerDay } = drag.current;
    const span = moveSpan(original, zoom, unitDelta);
    const report = isNoop(original, span) ? undefined : onTaskChange;
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
            report(id, toChange(span));
          }
        : undefined,
    );
    if (report) say("announce_changed", name, span);
  };

  // Released elsewhere than by pointerup (which closes the session first).
  const onPointerLost = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerId === drag.current?.pointerId) cancel();
  };

  return (
    <div
      {...props}
      className={clsx("c__gantt", className)}
      data-zoom={zoom}
      data-editable={editable || undefined}
      data-editing={preview ? "move" : undefined}
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
          }}
          onKeyDown={onKeyDown}
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
              preview={preview?.id === task.id ? preview : undefined}
            />
          ))}
        </div>
        {tasks.length === 0 && (
          <p className="c__gantt__empty">{t("components.gantt.empty")}</p>
        )}
      </div>
      {editable && (
        <VisuallyHidden role="status" className="c__gantt__live">
          {announcement}
        </VisuallyHidden>
      )}
    </div>
  );
};
