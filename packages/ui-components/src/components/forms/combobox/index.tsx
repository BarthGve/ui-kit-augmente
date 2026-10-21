import classNames from "classnames";
import { ReactNode, useState } from "react";
import {
  Button as AriaButton,
  ComboBox as AriaComboBox,
  Input as AriaInput,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
} from "react-aria-components";
import { Field, FieldProps } from ":/components/forms/field";
import { ClassicLabel } from ":/components/forms/classic-label";
import type { StackedFieldVariant } from ":/components/forms/types";
import { useCunningham } from ":/components/provider";

export type ComboboxOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type ComboboxProps = FieldProps & {
  label: string;
  hideLabel?: boolean;
  variant?: StackedFieldVariant;
  placeholder?: string;
  name?: string;
  options: ComboboxOption[];
  /** Selected option, when controlled; `null` for none. */
  value?: string | null;
  /** Selected option, when uncontrolled. */
  defaultValue?: string;
  /** Called with the chosen option's value, or `null` when the selection is cleared. */
  onChange?: (value: string | null) => void;
  /** Typed text, when controlled. */
  inputValue?: string;
  onInputChange?: (text: string) => void;
  /**
   * Keep the text that matches no option. Off by default: on blur the input
   * goes back to the selected option. Read the text through `onInputChange`.
   */
  allowsCustomValue?: boolean;
  /**
   * Filter `options` by the typed text (default). Turn it off when the options
   * already come filtered from an asynchronous source.
   */
  filterOptions?: boolean;
  /** Shows the loading state in the list. */
  isLoading?: boolean;
  /** Replaces the empty state text. */
  emptyText?: ReactNode;
};

export const Combobox = ({
  label,
  hideLabel,
  variant = "floating",
  placeholder,
  name,
  options,
  value,
  defaultValue,
  onChange,
  inputValue,
  onInputChange,
  allowsCustomValue = false,
  filterOptions = true,
  isLoading = false,
  emptyText,
  state,
  text,
  textItems,
  rightText,
  fullWidth,
  compact,
  className,
  disabled,
  labelWidth,
}: ComboboxProps) => {
  const { t } = useCunningham();
  const [focused, setFocused] = useState(false);
  const [typed, setTyped] = useState(
    options.find((o) => o.value === (value ?? defaultValue))?.label ?? "",
  );
  const isClassic = variant === "classic";
  const text_ = inputValue ?? typed;
  const items = { [filterOptions ? "defaultItems" : "items"]: options };

  const labelNode = (
    <Label
      className={classNames("labelled-box__label", {
        placeholder: !isClassic && !focused && !text_,
        c__offscreen: hideLabel,
      })}
    >
      <span>{label}</span>
    </Label>
  );

  return (
    <AriaComboBox
      {...items}
      className={classNames("c__combobox", className)}
      name={name}
      isDisabled={disabled}
      allowsCustomValue={allowsCustomValue}
      allowsEmptyCollection
      selectedKey={value === undefined ? undefined : value}
      defaultSelectedKey={defaultValue}
      onSelectionChange={(key) => onChange?.(key === null ? null : String(key))}
      inputValue={inputValue}
      defaultInputValue={inputValue === undefined ? typed : undefined}
      onInputChange={(next) => {
        setTyped(next);
        onInputChange?.(next);
      }}
      onFocusChange={setFocused}
      menuTrigger="focus"
    >
      <Field
        state={state}
        text={text}
        textItems={textItems}
        rightText={rightText}
        fullWidth={fullWidth}
        compact={compact}
        disabled={disabled}
        labelWidth={labelWidth}
      >
        {isClassic && (
          <ClassicLabel
            label={label}
            hideLabel={hideLabel}
            disabled={disabled}
            className="c__input__label"
            disabledClassName="c__input__label--disabled"
          />
        )}
        <div
          className={classNames(
            "c__input__wrapper",
            "c__combobox__wrapper",
            state && "c__input__wrapper--" + state,
            {
              "c__input__wrapper--disabled": disabled,
              "c__input__wrapper--classic": isClassic,
            },
          )}
        >
          {isClassic ? (
            <AriaInput className="c__input" placeholder={placeholder} />
          ) : (
            <div
              className={classNames("labelled-box", {
                "labelled-box--no-label": hideLabel,
                "labelled-box--disabled": disabled,
              })}
            >
              {labelNode}
              <div className="labelled-box__children">
                <AriaInput className="c__input" />
              </div>
            </div>
          )}
          <AriaButton
            className="c__combobox__trigger"
            aria-label={t("components.combobox.toggle_aria")}
          >
            <span className="material-icons" aria-hidden="true">
              keyboard_arrow_down
            </span>
          </AriaButton>
        </div>
      </Field>
      <Popover className="c__combobox__popover">
        <ListBox
          className="c__combobox__list"
          renderEmptyState={() => (
            <div className="c__combobox__empty" role="status">
              {isLoading
                ? t("components.combobox.loading")
                : (emptyText ?? t("components.combobox.no_results"))}
            </div>
          )}
        >
          {(option: ComboboxOption) => (
            <ListBoxItem
              id={option.value}
              textValue={option.label}
              isDisabled={option.disabled}
              className="c__combobox__option"
            >
              {option.label}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </AriaComboBox>
  );
};
