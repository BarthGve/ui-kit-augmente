import classNames from "classnames";
import {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
  useId,
  useRef,
} from "react";
import { Field, FieldProps } from ":/components/forms/field";
import { ClassicLabel } from ":/components/forms/classic-label";

type ControlProps = Omit<
  InputHTMLAttributes<HTMLInputElement> &
    TextareaHTMLAttributes<HTMLTextAreaElement>,
  "className" | "disabled" | "size"
>;

export type InputGroupProps = FieldProps &
  ControlProps & {
    label: string;
    hideLabel?: boolean;
    /** Text or icon before the field. Decorative: hidden from assistive technology. */
    leading?: ReactNode;
    /** Text or icon after the field. Decorative: hidden from assistive technology. */
    trailing?: ReactNode;
    /** Interactive element (a `Button`) before the field, kept reachable. */
    leadingAction?: ReactNode;
    /** Interactive element (a `Button`) after the field, kept reachable. */
    trailingAction?: ReactNode;
    /** Wraps a `textarea` instead of an `input`. */
    multiline?: boolean;
  };

/**
 * An input with addons inside its border: a prefix, a suffix or an inline
 * action. One border and one focus ring surround the whole group, and the
 * `Field` states (error, success, disabled) apply to all of it.
 */
export const InputGroup = ({
  label,
  hideLabel,
  leading,
  trailing,
  leadingAction,
  trailingAction,
  multiline,
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
  ...controlProps
}: InputGroupProps) => {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const controlRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const Control = multiline ? "textarea" : "input";

  const addon = (
    side: "leading" | "trailing",
    decorative?: ReactNode,
    action?: ReactNode,
  ) => {
    if (!decorative && !action) {
      return null;
    }
    return (
      <>
        {decorative && (
          <span
            className={`c__input-group__addon c__input-group__addon--${side}`}
            aria-hidden="true"
            onClick={() => controlRef.current?.focus()}
          >
            {decorative}
          </span>
        )}
        {action && (
          <span
            className={`c__input-group__addon c__input-group__addon--${side} c__input-group__addon--action`}
          >
            {action}
          </span>
        )}
      </>
    );
  };

  return (
    <Field
      state={state}
      text={text}
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
        htmlFor={controlId}
      />
      <div
        className={classNames("c__input-group", {
          "c__input-group--multiline": multiline,
          "c__input-group--error": state === "error",
          "c__input-group--success": state === "success",
          "c__input-group--disabled": disabled,
        })}
      >
        {addon("leading", leading, leadingAction)}
        <Control
          {...(controlProps as object)}
          ref={controlRef}
          id={controlId}
          className="c__input-group__control"
          disabled={disabled}
          aria-invalid={state === "error" ? true : undefined}
        />
        {addon("trailing", trailing, trailingAction)}
      </div>
    </Field>
  );
};
