import React, {
  RefAttributes,
  TextareaHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from "react";
import classNames from "classnames";
import { Field, FieldProps } from ":/components/forms/field";
import { LabelledBox } from ":/components/forms/labelled-box";
import { ClassicLabel } from ":/components/forms/classic-label";
import { randomString } from ":/utils";
import type { FieldVariant } from ":/components/forms/types";

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> &
  RefAttributes<HTMLTextAreaElement> &
  FieldProps & {
    label?: string;
    /**
     * Secondary text displayed under the label. Only rendered by the "classic" and
     * "inline" variants: the floating label is an overlay with no room for a second line.
     */
    labelDescription?: string;
    variant?: FieldVariant;
    hideLabel?: boolean;
    charCounter?: boolean;
    charCounterMax?: number;
  };

export const TextArea = ({
  label,
  labelDescription,
  variant = "floating",
  hideLabel,
  id,
  defaultValue,
  charCounter,
  charCounterMax,
  ref,
  ...props
}: TextAreaProps) => {
  const isClassic = variant === "classic";
  const isInline = variant === "inline";
  // Both variants render the label outside the box and rely on the native placeholder.
  const isStatic = isClassic || isInline;
  const areaRef = useRef<HTMLTextAreaElement | null>(null);
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
  useEffect(() => {
    if (props.value !== undefined) {
      setValue(props.value);
      return;
    }
    const domValue = areaRef.current?.value;
    if (domValue !== undefined) {
      setValue(domValue);
    }
  });

  const {
    fullWidth,
    labelWidth,
    rightText,
    text,
    textItems,
    className,
    ...areaProps
  } = props;

  const textareaElement = (
    <textarea
      className="c__textarea"
      {...areaProps}
      aria-describedby={
        [areaProps["aria-describedby"], descriptionId]
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
      ref={(nativeRef) => {
        if (ref) {
          if (typeof ref === "function") {
            ref(nativeRef);
          } else {
            ref.current = nativeRef;
          }
        }
        areaRef.current = nativeRef;
      }}
    />
  );

  return (
    <Field
      {...props}
      className={classNames(
        "c__field--textarea",
        { "c__field--inline": isInline },
        className,
      )}
      rightText={rightTextToUse}
    >
      {isStatic && (
        <ClassicLabel
          label={label}
          description={labelDescription}
          descriptionId={descriptionId}
          withContainer={isInline}
          hideLabel={hideLabel}
          disabled={props.disabled}
          className="c__textarea__label"
          disabledClassName="c__textarea__label--disabled"
          htmlFor={idToUse.current}
        />
      )}
      {/* We disabled linting for this specific line because we consider that the onClick props is only used for */}
      {/* mouse users, so this do not engender any issue for accessibility. */}
      <div
        className={classNames("c__textarea__wrapper", {
          "c__textarea__wrapper--disabled": props.disabled,
          "c__textarea__wrapper--classic": isClassic,
          "c__textarea__wrapper--inline": isInline,
        })}
        onClick={() => areaRef.current?.focus()}
      >
        {isStatic ? (
          textareaElement
        ) : (
          <LabelledBox
            label={label}
            variant="floating"
            hideLabel={hideLabel}
            htmlFor={idToUse.current}
            labelAsPlaceholder={labelAsPlaceholder}
            disabled={props.disabled}
          >
            {textareaElement}
          </LabelledBox>
        )}
      </div>
    </Field>
  );
};
