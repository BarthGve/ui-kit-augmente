import clsx from "clsx";
import { Icon } from ":/components/icon";
import { useCunningham } from ":/components/provider";
import { TimelineProps } from "./types";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// `new Date("2026-10-13")` is UTC midnight: a date-only string is formatted
// in UTC, or a negative-offset zone would show the previous day.
const formatDate = (
  date: Date | string,
  locale: string,
  format: Intl.DateTimeFormatOptions,
) => {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) {
    return { text: String(date), iso: undefined };
  }
  const isDateOnly = typeof date === "string" && DATE_ONLY.test(date);
  return {
    text: new Intl.DateTimeFormat(locale, {
      ...(isDateOnly && { timeZone: "UTC" }),
      ...format,
    }).format(value),
    iso: typeof date === "string" ? date : value.toISOString(),
  };
};

export const Timeline = ({
  events,
  orientation = "vertical",
  dateFormat = { dateStyle: "medium" },
  className,
  ...props
}: TimelineProps) => {
  const { t, currentLocale } = useCunningham();
  const list = (
    <ol
      role="list"
      className={clsx(
        "c__timeline",
        orientation === "horizontal" && "c__timeline--horizontal",
        className,
      )}
      {...props}
    >
      {events.map(({ id, date, title, content, state }) => {
        const { text, iso } = formatDate(date, currentLocale, dateFormat);
        return (
          <li
            key={id}
            className={clsx(
              "c__timeline__item",
              state && `c__timeline__item--${state}`,
            )}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span
              className={clsx(
                "c__timeline__marker",
                state && `c__timeline__marker--${state}`,
              )}
              aria-hidden="true"
            >
              {state === "done" && <Icon name="check" />}
            </span>
            <time className="c__timeline__date" dateTime={iso}>
              {text}
            </time>
            <div className="c__timeline__title">
              {title}
              {state && (
                <span className="c__offscreen">
                  {" "}
                  {t(`components.timeline.state.${state}`)}
                </span>
              )}
            </div>
            {content != null && (
              <div className="c__timeline__content">{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
  if (orientation === "vertical") return list;
  // A focusable, named region lets keyboard users scroll the row.
  return (
    <div
      role="region"
      tabIndex={0}
      className="c__timeline-region"
      aria-label={props["aria-label"] ?? t("components.timeline.region")}
    >
      {list}
    </div>
  );
};
