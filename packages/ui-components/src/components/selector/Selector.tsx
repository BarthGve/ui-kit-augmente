import clsx from "clsx";
import { HTMLAttributes, ReactNode, useId, useState } from "react";

export type SelectorOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

export type SelectorProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "onChange" | "defaultValue"
> & {
  options: SelectorOption[];
  /** Selected value when controlled. */
  value?: string;
  /** Selected value when uncontrolled. */
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Name shared by the radios, so the selection joins a form. */
  name?: string;
  size?: "medium" | "small";
  disabled?: boolean;
};

/**
 * Segmented selector: one option among a few, side by side. Built on native
 * radios, so arrow keys, the single tab stop, the checked state and disabled
 * options come from the browser.
 */
export const Selector = ({
  options,
  value,
  defaultValue,
  onChange,
  name,
  size = "medium",
  disabled = false,
  className,
  ...props
}: SelectorProps) => {
  const generatedName = useId();
  const [inner, setInner] = useState(defaultValue);
  const selected = value ?? inner;

  return (
    <div
      {...props}
      role="radiogroup"
      className={clsx(
        "c__selector",
        `c__selector--${size}`,
        { "c__selector--disabled": disabled },
        className,
      )}
    >
      {options.map((option) => (
        <label key={option.value} className="c__selector__option">
          <input
            type="radio"
            className="c__selector__input"
            name={name ?? generatedName}
            value={option.value}
            checked={selected === option.value}
            disabled={disabled || option.disabled}
            onChange={() => {
              if (value === undefined) {
                setInner(option.value);
              }
              onChange?.(option.value);
            }}
          />
          <span className="c__selector__label">{option.label}</span>
        </label>
      ))}
    </div>
  );
};
