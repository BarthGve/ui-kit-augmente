import clsx from "clsx";
import {
  Label,
  Slider as AriaSlider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
} from "react-aria-components";

export type SliderValue = number | [number, number];

export type SliderProps = {
  /** Visible label. Without it, pass `aria-label`. */
  label?: string;
  "aria-label"?: string;
  min?: number;
  max?: number;
  step?: number;
  /** Selected value when controlled: a number, or `[min, max]` for a range. */
  value?: SliderValue;
  /** Selected value when uncontrolled. */
  defaultValue?: SliderValue;
  onChange?: (value: SliderValue) => void;
  disabled?: boolean;
  /** Accessible names of the two thumbs of a range, e.g. `["Minimum", "Maximum"]`. */
  thumbLabels?: [string, string];
  /** Shows the current value next to the label. */
  showValue?: boolean;
  className?: string;
};

/**
 * Slider to pick a number, or a range with two thumbs, between `min` and
 * `max`. Built on react-aria's `Slider`: arrow keys move by `step`, Home and
 * End jump to the bounds, PageUp and PageDown move by a larger step.
 */
export const Slider = ({
  label,
  "aria-label": ariaLabel,
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  onChange,
  disabled,
  thumbLabels,
  showValue = false,
  className,
}: SliderProps) => {
  const isRange = Array.isArray(value ?? defaultValue);
  const initial = defaultValue ?? (isRange ? [min, max] : min);

  return (
    <AriaSlider
      className={clsx("c__slider", className)}
      aria-label={label ? undefined : ariaLabel}
      minValue={min}
      maxValue={max}
      step={step}
      value={value}
      defaultValue={value === undefined ? initial : undefined}
      onChange={(next) => onChange?.(next as SliderValue)}
      isDisabled={disabled}
    >
      {(label || showValue) && (
        <div className="c__slider__header">
          {label && <Label className="c__slider__label">{label}</Label>}
          {showValue && <SliderOutput className="c__slider__output" />}
        </div>
      )}
      <SliderTrack className="c__slider__track">
        {({ state }) => (
          <>
            <div
              className="c__slider__fill"
              style={{
                left: `${isRange ? state.getThumbPercent(0) * 100 : 0}%`,
                width: `${
                  (isRange
                    ? state.getThumbPercent(1) - state.getThumbPercent(0)
                    : state.getThumbPercent(0)) * 100
                }%`,
              }}
            />
            {(isRange ? [0, 1] : [0]).map((index) => (
              <SliderThumb
                key={index}
                index={index}
                className="c__slider__thumb"
                // A range names its thumbs; a single thumb takes the slider's name.
                aria-label={isRange ? thumbLabels?.[index] : undefined}
              />
            ))}
          </>
        )}
      </SliderTrack>
    </AriaSlider>
  );
};
