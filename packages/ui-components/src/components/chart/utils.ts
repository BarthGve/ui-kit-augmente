/** A readable step for an axis: 1, 2 or 5 times a power of ten. */
const niceStep = (range: number, ticks: number) => {
  const rough = range / Math.max(ticks, 1);
  const power = Math.pow(10, Math.floor(Math.log10(rough)));
  const fraction = rough / power;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * power;
};

/**
 * Ticks of a value axis from 0 up to the first tick at or above `max`.
 * `max <= 0` (or not finite) gives a 0 to 1 axis.
 */
export const niceTicks = (max: number, count = 5): number[] => {
  if (!Number.isFinite(max) || max <= 0) return [0, 1];
  const step = niceStep(max, count);
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top + step / 2; value += step) {
    ticks.push(Number(value.toFixed(10)));
  }
  return ticks;
};

/** Index of the category nearest to an x position, for `count` evenly spaced bands. */
export const nearestIndex = (
  x: number,
  left: number,
  width: number,
  count: number,
) => {
  if (count <= 0 || width <= 0) return 0;
  const index = Math.floor(((x - left) / width) * count);
  return Math.min(Math.max(index, 0), count - 1);
};

export const MARKERS = [
  "circle",
  "square",
  "triangle",
  "diamond",
  "cross",
  "circle",
] as const;
export const DASHES = ["", "6 4", "2 3", "10 3 2 3", "1 3", "6 4"] as const;
export const SERIES_COUNT = 6;
