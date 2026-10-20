import { Gauge } from ":/components/gauge";

export type StorageGaugeBarProps = {
  used: number;
  total: number;
  "aria-label"?: string;
};

export const StorageGaugeBar = ({
  used,
  total,
  "aria-label": ariaLabel,
}: StorageGaugeBarProps) => (
  <Gauge
    className="c__storage-gauge__bar"
    value={used}
    max={total}
    label={ariaLabel ?? ""}
  />
);
