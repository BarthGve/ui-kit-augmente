import clsx from "clsx";
import {
  KeyboardEvent,
  PointerEvent,
  ReactElement,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Button } from ":/components/button";
import { useCunningham } from ":/components/provider";
import {
  DASHES,
  MARKERS,
  nearestIndex,
  niceTicks,
  SERIES_COUNT,
} from "./utils";

export type ChartSeries = { key: string; label: string };
export type ChartDatum = Record<string, string | number>;

export type ChartProps = {
  /** Names the chart and captions its data table. */
  title: string;
  /** What the chart shows, in words: the text alternative. */
  summary: string;
  type?: "bar" | "line" | "area";
  data: ChartDatum[];
  /** Key of the category (x axis) in each datum. */
  xKey: string;
  /** Up to six series, each with its own colour, pattern, marker and dash. */
  series: ChartSeries[];
  height?: number;
  formatValue?: (value: number) => string;
  className?: string;
};

const MARGIN = { top: 12, right: 12, bottom: 32, left: 48 };
const DEFAULT_WIDTH = 480;

const Marker = ({
  shape,
  x,
  y,
  size = 4,
  className,
}: {
  shape: string;
  x: number;
  y: number;
  size?: number;
  className?: string;
}) => {
  const props = { className, fill: "currentColor", stroke: "none" };
  switch (shape) {
    case "square":
      return (
        <rect
          {...props}
          x={x - size}
          y={y - size}
          width={size * 2}
          height={size * 2}
        />
      );
    case "triangle":
      return (
        <polygon
          {...props}
          points={`${x},${y - size - 1} ${x + size + 1},${y + size} ${x - size - 1},${y + size}`}
        />
      );
    case "diamond":
      return (
        <polygon
          {...props}
          points={`${x},${y - size - 1} ${x + size + 1},${y} ${x},${y + size + 1} ${x - size - 1},${y}`}
        />
      );
    case "cross":
      return (
        <path
          {...props}
          d={`M${x - size},${y - 1}h${size * 2}v2h-${size * 2}zM${x - 1},${y - size}h2v${size * 2}h-2z`}
        />
      );
    default:
      return <circle {...props} cx={x} cy={y} r={size} />;
  }
};

// One pattern per series, so bars and areas differ by texture as well as colour.
const PATTERNS: ((id: string) => ReactElement)[] = [
  (id) => (
    <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="currentColor" opacity="0.25" />
    </pattern>
  ),
  (id) => (
    <pattern
      id={id}
      width="8"
      height="8"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(45)"
    >
      <rect width="8" height="8" fill="currentColor" opacity="0.1" />
      <line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="3" />
    </pattern>
  ),
  (id) => (
    <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="currentColor" opacity="0.1" />
      <circle cx="4" cy="4" r="1.6" fill="currentColor" />
    </pattern>
  ),
  (id) => (
    <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="currentColor" opacity="0.1" />
      <path d="M0 0H8M0 4H8" stroke="currentColor" strokeWidth="1.5" />
    </pattern>
  ),
  (id) => (
    <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="currentColor" opacity="0.1" />
      <path d="M0 0V8M4 0V8" stroke="currentColor" strokeWidth="1.5" />
    </pattern>
  ),
  (id) => (
    <pattern
      id={id}
      width="8"
      height="8"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(-45)"
    >
      <rect width="8" height="8" fill="currentColor" opacity="0.1" />
      <line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="3" />
    </pattern>
  ),
];

/**
 * Bar, line and area charts drawn in SVG from a data array, with axes, a
 * legend, a tooltip and a text alternative (name, summary, and the data as a
 * table). Series differ by colour, texture, marker and dash, never by colour
 * alone. The plot is a keyboard stop: arrow keys, Home and End walk through
 * the categories and announce their values.
 */
export const Chart = ({
  title,
  summary,
  type = "bar",
  data,
  xKey,
  series,
  height = 280,
  formatValue = String,
  className,
}: ChartProps) => {
  const { t } = useCunningham();
  const baseId = useId();
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [active, setActive] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const plot = useRef<HTMLDivElement>(null);
  const shown = series.slice(0, SERIES_COUNT);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const next = Math.round(entries[0]?.contentRect.width ?? 0);
      if (next > 0) setWidth(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const inner = {
    w: Math.max(width - MARGIN.left - MARGIN.right, 1),
    h: Math.max(height - MARGIN.top - MARGIN.bottom, 1),
  };
  const max = Math.max(
    0,
    ...data.flatMap((d) => shown.map((s) => Number(d[s.key]) || 0)),
  );
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] || 1;
  const band = inner.w / Math.max(data.length, 1);
  const y = (value: number) => MARGIN.top + inner.h - (value / top) * inner.h;
  const centre = (i: number) => MARGIN.left + band * (i + 0.5);
  const baseline = MARGIN.top + inner.h;
  const patternId = (n: number) => `${baseId}-pattern-${n}`;

  const onKeyDown = (event: KeyboardEvent) => {
    const last = data.length - 1;
    const next = {
      ArrowRight: Math.min((active ?? -1) + 1, last),
      ArrowLeft: Math.max((active ?? 1) - 1, 0),
      Home: 0,
      End: last,
    }[event.key];
    if (event.key === "Escape") {
      setActive(null);
    } else if (next !== undefined) {
      event.preventDefault();
      setActive(next);
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    const rect = plot.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = rect.width ? width / rect.width : 1;
    setActive(
      nearestIndex(
        (event.clientX - rect.left) * scale,
        MARGIN.left,
        inner.w,
        data.length,
      ),
    );
  };

  const swatch = (n: number) => (
    <svg
      className={clsx("c__chart__swatch", `c__chart__series--${n + 1}`)}
      width="28"
      height="14"
      aria-hidden="true"
    >
      {type === "bar" ? (
        <rect
          x="1"
          y="1"
          width="26"
          height="12"
          fill={`url(#${patternId(n)})`}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ) : (
        <>
          <line
            x1="0"
            y1="7"
            x2="28"
            y2="7"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={DASHES[n] || undefined}
          />
          <Marker shape={MARKERS[n]} x={14} y={7} />
        </>
      )}
    </svg>
  );

  const activeDatum = active !== null ? data[active] : undefined;

  return (
    <figure className={clsx("c__chart", className)} ref={box}>
      {/* Patterns live in one hidden SVG, shared by the plot and the legend. */}
      <svg width="0" height="0" aria-hidden="true" className="c__chart__defs">
        <defs>
          {shown.map((_, n) => (
            <g key={n} className={`c__chart__series--${n + 1}`}>
              {PATTERNS[n](patternId(n))}
            </g>
          ))}
        </defs>
      </svg>

      <figcaption id={`${baseId}-title`} className="c__chart__title">
        {title}
      </figcaption>
      <p id={`${baseId}-summary`} className="c__chart__summary">
        {summary}
      </p>

      {asTable ? (
        <table className="c__chart__table" aria-label={title}>
          <caption className="c__offscreen">{title}</caption>
          <thead>
            <tr>
              <th scope="col">{xKey}</th>
              {shown.map((s) => (
                <th scope="col" key={s.key}>
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <th scope="row">{String(d[xKey])}</th>
                {shown.map((s) => (
                  <td key={s.key}>{formatValue(Number(d[s.key]))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div
          ref={plot}
          className="c__chart__plot"
          role="group"
          tabIndex={0}
          aria-label={`${title}. ${t("components.chart.explore")}`}
          onKeyDown={onKeyDown}
          onFocus={() => setActive((a) => a ?? 0)}
          onBlur={() => setActive(null)}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setActive(null)}
        >
          <svg
            className="c__chart__svg"
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height={height}
            role="img"
            aria-labelledby={`${baseId}-title`}
            aria-describedby={`${baseId}-summary`}
          >
            {ticks.map((tick) => (
              <g key={tick} className="c__chart__y-tick">
                <line
                  className="c__chart__grid"
                  x1={MARGIN.left}
                  x2={width - MARGIN.right}
                  y1={y(tick)}
                  y2={y(tick)}
                />
                <text
                  className="c__chart__label"
                  x={MARGIN.left - 8}
                  y={y(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {formatValue(tick)}
                </text>
              </g>
            ))}
            <g className="c__chart__x-axis">
              {data.map((d, i) => (
                <text
                  key={i}
                  className="c__chart__label"
                  x={centre(i)}
                  y={baseline + 18}
                  textAnchor="middle"
                >
                  {String(d[xKey])}
                </text>
              ))}
            </g>

            {active !== null && (
              <rect
                className="c__chart__cursor"
                x={MARGIN.left + band * active}
                y={MARGIN.top}
                width={band}
                height={inner.h}
              />
            )}

            {shown.map((s, n) => {
              const values = data.map((d) => Number(d[s.key]) || 0);
              const points = values.map((v, i) => [centre(i), y(v)] as const);
              const path = points
                .map(([px, py], i) => `${i ? "L" : "M"}${px},${py}`)
                .join("");
              return (
                <g key={s.key} className={`c__chart__series--${n + 1}`}>
                  {type === "bar" &&
                    values.map((v, i) => {
                      const slot = (band * 0.8) / shown.length;
                      const x = MARGIN.left + band * i + band * 0.1 + slot * n;
                      return (
                        <rect
                          key={i}
                          className="c__chart__bar"
                          x={x}
                          y={y(v)}
                          width={slot}
                          height={baseline - y(v)}
                          fill={`url(#${patternId(n)})`}
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      );
                    })}
                  {type === "area" && points.length > 0 && (
                    <path
                      className="c__chart__area"
                      d={`${path}L${points[points.length - 1][0]},${baseline}L${points[0][0]},${baseline}Z`}
                      fill={`url(#${patternId(n)})`}
                      stroke="none"
                    />
                  )}
                  {type !== "bar" && (
                    <>
                      <path
                        className="c__chart__line"
                        d={path}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={DASHES[n] || undefined}
                      />
                      {points.map(([px, py], i) => (
                        <Marker
                          key={i}
                          className="c__chart__marker"
                          shape={MARKERS[n]}
                          x={px}
                          y={py}
                        />
                      ))}
                    </>
                  )}
                </g>
              );
            })}
          </svg>
          <div className="c__chart__live" aria-live="polite">
            {activeDatum && (
              <div className="c__chart__tooltip">
                <strong>{String(activeDatum[xKey])}</strong>
                {shown.map((s) => (
                  <span key={s.key} className="c__chart__tooltip-row">
                    {s.label}: {formatValue(Number(activeDatum[s.key]))}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!asTable && (
        <ul className="c__chart__legend">
          {shown.map((s, n) => (
            <li key={s.key} className="c__chart__legend-item">
              {swatch(n)}
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      )}

      <Button
        size="small"
        variant="tertiary"
        color="neutral"
        aria-expanded={asTable}
        onClick={() => setAsTable(!asTable)}
      >
        {asTable
          ? t("components.chart.view_chart")
          : t("components.chart.view_table")}
      </Button>
    </figure>
  );
};
