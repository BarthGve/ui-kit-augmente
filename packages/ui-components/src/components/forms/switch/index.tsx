import React, { InputHTMLAttributes, RefAttributes } from "react";
import classNames from "classnames";
import { Field, FieldProps } from ":/components/forms/field";

export type SwitchOnlyProps = {
  label?: string;
  labelSide?: "left" | "right";
};

// The inherited numeric HTML `size` is replaced by the control size.
export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> &
  RefAttributes<HTMLInputElement> &
  FieldProps &
  SwitchOnlyProps & {
    size?: "medium" | "small";
  };

export const Switch = ({
  label,
  labelSide = "left",
  ref,
  size = "medium",
  ...props
}: SwitchProps) => {
  const {
    compact,
    className,
    fullWidth,
    labelWidth,
    rightText,
    state,
    text,
    textItems,
    ...inputProps
  } = props;

  const { className: excludeClassName, ...fieldProps } = props;

  return (
    <label
      className={classNames(
        "c__checkbox",
        "c__switch",
        "c__switch--" + labelSide,
        className,
        {
          "c__checkbox--disabled": props.disabled,
          "c__switch--full-width": props.fullWidth,
          "c__checkbox--small": size === "small",
        },
      )}
    >
      <Field compact={true} {...fieldProps}>
        <div className="c__checkbox__container">
          {label && <div className="c__checkbox__label">{label}</div>}
          <div className="c__switch__rail__wrapper">
            <input type="checkbox" {...inputProps} ref={ref} />
            <div className="c__switch__rail" />
          </div>
        </div>
      </Field>
    </label>
  );
};
