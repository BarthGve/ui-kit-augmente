import classNames from "classnames";
import { ReactNode, SelectHTMLAttributes, useId } from "react";
import { Field, FieldProps } from ":/components/forms/field";
import { ClassicLabel } from ":/components/forms/classic-label";
import { Icon } from ":/components/icon";

export type NativeSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};
export type NativeSelectGroup = {
  group: string;
  options: NativeSelectOption[];
};

export type NativeSelectProps = FieldProps &
  Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "className" | "disabled" | "size"
  > & {
    label: string;
    hideLabel?: boolean;
    /** Options and groups; or pass `option` / `optgroup` as children. */
    options?: (NativeSelectOption | NativeSelectGroup)[];
    /** Text of a first, empty option. */
    placeholder?: string;
  };

const renderOption = (option: NativeSelectOption) => (
  <option key={option.value} value={option.value} disabled={option.disabled}>
    {option.label}
  </option>
);

/**
 * A native `select` with the `Field` look: the platform picker (best on
 * mobile and in simple forms). The custom `Select` stays for richer needs.
 */
export const NativeSelect = ({
  label,
  hideLabel,
  options,
  placeholder,
  children,
  state,
  text,
  textItems,
  rightText,
  fullWidth,
  compact,
  className,
  disabled,
  labelWidth,
  id,
  ...selectProps
}: NativeSelectProps) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hintId = `${selectId}-hint`;
  const content: ReactNode = options
    ? options.map((entry) =>
        "group" in entry ? (
          <optgroup key={entry.group} label={entry.group}>
            {entry.options.map(renderOption)}
          </optgroup>
        ) : (
          renderOption(entry)
        ),
      )
    : children;

  return (
    <Field
      state={state}
      text={text}
      textId={hintId}
      textItems={textItems}
      rightText={rightText}
      fullWidth={fullWidth}
      compact={compact}
      disabled={disabled}
      labelWidth={labelWidth}
      className={className}
    >
      <ClassicLabel
        label={label}
        hideLabel={hideLabel}
        disabled={disabled}
        className="c__input__label"
        disabledClassName="c__input__label--disabled"
        htmlFor={selectId}
      />
      <div
        className={classNames("c__native-select", {
          "c__native-select--error": state === "error",
          "c__native-select--success": state === "success",
          "c__native-select--disabled": disabled,
        })}
      >
        <select
          {...selectProps}
          id={selectId}
          className="c__native-select__control"
          disabled={disabled}
          aria-invalid={state === "error" ? true : undefined}
          aria-describedby={text ? hintId : undefined}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {content}
        </select>
        <Icon
          name="expand_more"
          className="c__native-select__icon"
          aria-hidden="true"
        />
      </div>
    </Field>
  );
};
