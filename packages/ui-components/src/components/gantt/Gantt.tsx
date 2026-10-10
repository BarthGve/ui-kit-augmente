import clsx from "clsx";
import {
  CSSProperties,
  FocusEvent,
  KeyboardEvent,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import {
  CalendarDate,
  DateFormatter,
  startOfMonth,
  startOfYear,
} from "@internationalized/date";
import { Button } from ":/components/button";
import { useCunningham } from ":/components/provider";
import { useControllableState } from ":/hooks/useControllableState";
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

export const Gantt = ({
  tasks,
  zoom: zoomProp,
  defaultZoom = "week",
  onZoomChange,
  today,
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
  // narrowed, the old offset is already clamped.
  const anchor = useRef<{
    zoom: GanttZoom;
    date: CalendarDate;
    left: number;
  } | null>(null);
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
    if (el && !anchorStale && anchor.current?.zoom === zoom) {
      el.scrollLeft =
        dayIndex(scale.origin, anchor.current.date) * px(scale.dayWidth);
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

  const rowLabel = (task: GanttTask, dates: ReturnType<typeof formatDates>) => {
    if (!dates)
      return t("components.gantt.row_no_dates_aria", { name: task.name });
    if (dates.start === dates.end) {
      return t("components.gantt.row_date_aria", {
        name: task.name,
        date: dates.start,
      });
    }
    return t("components.gantt.row_dates_aria", { name: task.name, ...dates });
  };

  return (
    <div {...props} className={clsx("c__gantt", className)} data-zoom={zoom}>
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
          {tasks.map((task, i) => {
            // "No dates" follows the dates; the bar can also be absent when
            // the task lies outside a bounded window (MAX_DAYS).
            const dates = formatDates(task, locale);
            const position = scale.positionOf(task);
            return (
              <div
                key={task.id}
                role="row"
                aria-rowindex={i + 2}
                aria-label={rowLabel(task, dates)}
                // A single tab stop, so Tab leaves the chart (roving).
                tabIndex={i === stopIndex ? 0 : -1}
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
                <div role="gridcell" className="c__gantt__track">
                  {position && (
                    <div
                      className="c__gantt__bar"
                      data-task-id={task.id}
                      aria-hidden="true"
                      style={place(position.start, position.span)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {tasks.length === 0 && (
          <p className="c__gantt__empty">{t("components.gantt.empty")}</p>
        )}
      </div>
    </div>
  );
};
