import clsx from "clsx";
import { CSSProperties, useMemo } from "react";
import {
  CalendarDate,
  DateFormatter,
  startOfMonth,
  startOfYear,
} from "@internationalized/date";
import { useCunningham } from ":/components/provider";
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

export const Gantt = ({
  tasks,
  zoom = "week",
  today,
  "aria-label": ariaLabel,
  className,
  ...props
}: GanttProps) => {
  const { t, currentLocale: locale } = useCunningham();
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
      <div className="c__gantt__scroller">
        <div
          role="grid"
          aria-label={ariaLabel}
          aria-rowcount={tasks.length + 1}
          aria-colcount={2}
          className="c__gantt__grid"
          style={{ "--gantt-days": scale.days } as CSSProperties}
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
                // The first row is the chart's tab stop, so the scroll box is
                // keyboard reachable; t04 adds the arrow keys (roving).
                tabIndex={i === 0 ? 0 : -1}
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
