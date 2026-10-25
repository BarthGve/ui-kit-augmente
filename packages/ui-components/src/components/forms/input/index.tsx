import React, {
  InputHTMLAttributes,
  ReactNode,
  RefAttributes,
  useEffect,
  useRef,
  useState,
} from "react";
import classNames from "classnames";
import { randomString } from ":/utils";
import { Field, FieldProps } from ":/components/forms/field";
import { LabelledBox } from ":/components/forms/labelled-box";
import { ClassicLabel } from ":/components/forms/classic-label";
import type { FieldVariant } from ":/components/forms/types";

export type InputOnlyProps = {
  label?: string;
  /**
   * Secondary text displayed under the label. Only rendered by the "classic" and
   * "inline" variants: the floating label is an overlay with no room for a second line.
   */
  labelDescription?: string;
  variant?: FieldVariant;
  hideLabel?: boolean;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  charCounter?: boolean;
  charCounterMax?: number;
};

export type InputProps = InputHTMLAttributes<HTMLInputElement> &
  RefAttributes<HTMLInputElement> &
  FieldProps &
  InputOnlyProps;

export const Input = ({
  className,
  defaultValue,
  label,
  labelDescription,
  variant = "floating",
  hideLabel,
  id,
  icon,
  rightIcon,
  charCounter,
  charCounterMax,
  ref,
  ...props
}: InputProps) => {
  const isClassic = variant === "classic";
  const isInline = variant === "inline";
  // Both variants render the label outside the box and rely on the native placeholder.
  const isStatic = isClassic || isInline;
  const classes = ["c__input"];
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [inputFocus, setInputFocus] = useState(false);
  const [value, setValue] = useState<string | number | readonly string[]>(
    defaultValue ?? props.value ?? "",
  );
  const [labelAsPlaceholder, setLabelAsPlaceholder] = useState(!value);
  const idToUse = useRef(id || randomString());
  const descriptionId = labelDescription
    ? `${idToUse.current}-description`
    : undefined;
  const rightTextToUse = charCounter
    ? `${String(value).length}/${charCounterMax}`
    : props.rightText;

  useEffect(() => {
    if (inputFocus) {
      setLabelAsPlaceholder(false);
      return;
    }
    setLabelAsPlaceholder(!value);
  }, [inputFocus, value]);

  // Controlled: mirror props.value. Uncontrolled (react-hook-form register(), defaultValue):
  // the DOM owns the value, so mirror it after each render to catch reset()/setValue(),
  // which write to the element without firing onChange.
  // No dependency list on purpose: reset() changes neither props nor state, so only
  // running after every render catches it. setValue bails out on an unchanged value.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (props.value !== undefined) {
      setValue(props.value);
      return;
    }
    const domValue = inputRef.current?.value;
    if (domValue !== undefined) {
      setValue(domValue);
    }
  });

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

  const inputElement = (
    <input
      type="text"
      className={classes.join(" ")}
      {...inputProps}
      aria-describedby={
        [inputProps["aria-describedby"], descriptionId]
          .filter(Boolean)
          .join(" ") || undefined
      }
      placeholder={isStatic ? props.placeholder : undefined}
      id={idToUse.current}
      defaultValue={defaultValue}
      onFocus={(e) => {
        setInputFocus(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setInputFocus(false);
        props.onBlur?.(e);
      }}
      onChange={(e) => {
        setValue(e.target.value);
        props.onChange?.(e);
      }}
      ref={(inputTextRef) => {
        if (ref) {
          if (typeof ref === "function") {
            ref(inputTextRef);
          } else {
            ref.current = inputTextRef;
          }
        }
        inputRef.current = inputTextRef;
      }}
    />
  );

  return (
    <Field
      {...props}
      rightText={rightTextToUse}
      className={classNames({ "c__field--inline": isInline }, className)}
    >
      {isStatic && (
        <ClassicLabel
          label={label}
          description={labelDescription}
          descriptionId={descriptionId}
          withContainer={isInline}
          hideLabel={hideLabel}
          disabled={props.disabled}
          className="c__input__label"
          disabledClassName="c__input__label--disabled"
          htmlFor={idToUse.current}
        />
      )}
      {/* We disabled linting for this specific line because we consider that the onClick props is only used for */}
      {/* mouse users, so this do not engender any issue for accessibility. */}
      <div
        className={classNames(
          "c__input__wrapper",
          props.state && "c__input__wrapper--" + props.state,
          {
            "c__input__wrapper--disabled": props.disabled,
            "c__input__wrapper--classic": isClassic,
            "c__input__wrapper--inline": isInline,
          },
        )}
        onClick={() => {
          inputRef.current?.focus();
        }}
      >
        {!!icon && <div className="c__input__icon-left">{icon}</div>}
        {isStatic ? (
          inputElement
        ) : (
          <LabelledBox
            label={label}
            variant="floating"
            hideLabel={hideLabel}
            htmlFor={idToUse.current}
            labelAsPlaceholder={labelAsPlaceholder}
            disabled={props.disabled}
          >
            {inputElement}
          </LabelledBox>
        )}
        {!!rightIcon && <div className="c__input__icon-right">{rightIcon}</div>}
      </div>
    </Field>
  );
};
