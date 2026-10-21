import classNames from "classnames";
import { ChangeEvent, ClipboardEvent, useId, useRef, useState } from "react";
import { Field, FieldProps } from ":/components/forms/field";
import { ClassicLabel } from ":/components/forms/classic-label";

export type InputOTPProps = FieldProps & {
  label: string;
  hideLabel?: boolean;
  /** Number of characters. Default 6. */
  length?: number;
  /** Sizes of the visual groups, e.g. `[3, 3]`; a separator sits between them. */
  groups?: number[];
  /** `digits` (default) keeps only digits; `text` keeps any character. */
  type?: "digits" | "text";
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Called once each time all the slots become filled. */
  onComplete?: (value: string) => void;
  name?: string;
  autoFocus?: boolean;
};

/**
 * One-time-code input. It is a single text field (so autofill, paste and
 * screen readers work as for any input) drawn as `length` slots.
 */
export const InputOTP = ({
  label,
  hideLabel,
  length = 6,
  groups,
  type = "digits",
  value,
  defaultValue = "",
  onChange,
  onComplete,
  name,
  autoFocus,
  state,
  text,
  textItems,
  rightText,
  fullWidth,
  compact,
  className,
  disabled,
  labelWidth,
}: InputOTPProps) => {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inner, setInner] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const current = value ?? inner;

  const sanitize = (raw: string) =>
    (type === "digits" ? raw.replace(/\D/g, "") : raw).slice(0, length);

  const commit = (next: string) => {
    if (value === undefined) {
      setInner(next);
    }
    onChange?.(next);
    if (next.length === length && current.length < length) {
      onComplete?.(next);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) =>
    commit(sanitize(event.target.value));

  // The browser would cut a pasted text to `maxLength` before it can be
  // cleaned: clean it first, so "12-34 56" still fills six slots.
  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    commit(sanitize(event.clipboardData.getData("text")));
  };

  const sizes = groups ?? [length];
  let offset = 0;
  const activeIndex = Math.min(current.length, length - 1);

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
        htmlFor={id}
      />
      <div
        className={classNames("c__input-otp", {
          "c__input-otp--error": state === "error",
          "c__input-otp--success": state === "success",
          "c__input-otp--disabled": disabled,
        })}
        onClick={() => inputRef.current?.focus()}
      >
        <input
          ref={inputRef}
          id={id}
          name={name}
          className="c__input-otp__input"
          type="text"
          inputMode={type === "digits" ? "numeric" : "text"}
          autoComplete="one-time-code"
          maxLength={length}
          value={current}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-invalid={state === "error" ? true : undefined}
          onChange={handleChange}
          onPaste={handlePaste}
          onFocus={(event) => {
            setFocused(true);
            // The caret always sits after the last character.
            const end = event.target.value.length;
            event.target.setSelectionRange(end, end);
          }}
          onBlur={() => setFocused(false)}
        />
        <div className="c__input-otp__slots" aria-hidden="true">
          {sizes.map((size, group) => {
            const start = offset;
            offset += size;
            return (
              <div className="c__input-otp__group" key={group}>
                {group > 0 && (
                  <span className="c__input-otp__separator">–</span>
                )}
                {Array.from({ length: size }, (_, i) => {
                  const index = start + i;
                  return (
                    <span
                      key={index}
                      className={classNames("c__input-otp__slot", {
                        "c__input-otp__slot--active":
                          focused && index === activeIndex,
                      })}
                    >
                      {current[index] ?? ""}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </Field>
  );
};
