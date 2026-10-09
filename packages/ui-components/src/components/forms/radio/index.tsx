import React, {
  InputHTMLAttributes,
  PropsWithChildren,
  ReactNode,
  RefAttributes,
} from "react";
import classNames from "classnames";
import { Field, FieldProps } from ":/components/forms/field";

export type RadioOnlyProps = {
  label?: ReactNode;
};

// The inherited numeric HTML `size` is replaced by the control size.
export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> &
  RefAttributes<HTMLInputElement> &
  FieldProps &
  RadioOnlyProps & {
    size?: "medium" | "small";
  };

export const Radio = ({
  className,
  label,
  ref,
  size = "medium",
  ...props
}: RadioProps) => {
  const {
    compact,
    fullWidth,
    labelWidth,
    rightText,
    state,
    text,
    textItems,
    ...inputProps
  } = props;

  return (
    <label
      className={classNames("c__checkbox", "c__radio", className, {
        "c__checkbox--disabled": props.disabled,
        "c__checkbox--full-width": props.fullWidth,
        "c__checkbox--small": size === "small",
      })}
    >
      <Field compact={true} {...props}>
        <div className="c__checkbox__container">
          <input type="radio" {...inputProps} ref={ref} />
          {label && <div className="c__checkbox__label">{label}</div>}
        </div>
      </Field>
    </label>
  );
};

export const RadioGroup = ({
  className,
  children,
  style,
  ...props
}: PropsWithChildren & FieldProps & { style?: React.CSSProperties }) => {
  return (
    <Field
      className={classNames("c__radio__group c__checkbox__group", className)}
      compact={true}
      {...props}
    >
      <div className="c__checkbox__group__list" style={style}>
        {children}
      </div>
    </Field>
  );
};
