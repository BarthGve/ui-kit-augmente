import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import { useCombobox } from "downshift";
import classNames from "classnames";
import { useCunningham } from ":/components/provider";
import {
  getOptionsFilter,
  optionToString,
  optionToValue,
  SelectMonoAux,
  SubProps,
} from ":/components/forms/select/mono-common";
import { isOptionWithRender } from ":/components/forms/select/utils";
import { useLatest } from ":/hooks/useLatest";

export const SelectMonoSearchable = ({
  showLabelWhenSelected = true,
  ref,
  ...props
}: SubProps) => {
  const { t } = useCunningham();
  const [optionsToDisplay, setOptionsToDisplay] = useState(props.options);
  const [hasInputFocused, setHasInputFocused] = useState(false);
  const [inputFilter, setInputFilter] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const downshiftReturn = useCombobox({
    ...props.downshiftProps,
    items: optionsToDisplay,
    itemToString: optionToString,
    onInputValueChange: (e) => {
      setInputFilter(e.inputValue);
      if (!e.inputValue) {
        downshiftReturn.selectItem(null);
      }
    },
  });
  // Stable across renders (useCallback on downshift's dispatch).
  const { selectItem } = downshiftReturn;
  const { options, value, onSearchInputChange } = props;
  const [labelAsPlaceholder, setLabelAsPlaceholder] = useState(
    !downshiftReturn.selectedItem,
  );
  useEffect(() => {
    if (hasInputFocused || downshiftReturn.inputValue) {
      setLabelAsPlaceholder(false);
      return;
    }
    setLabelAsPlaceholder(!downshiftReturn.selectedItem);
  }, [
    downshiftReturn.selectedItem,
    hasInputFocused,
    downshiftReturn.inputValue,
  ]);

  // Similar to: useKeepSelectedItemInSyncWithOptions ( see docs )
  // The only difference is that it does not apply when there is an inputFilter. ( See below why )
  useEffect(() => {
    // If there is an inputFilter, using selectItem will trigger onInputValueChange that will sets inputFilter to
    // empty, and then ignoring the existing filter and displaying all options.
    if (inputFilter) {
      return;
    }
    const optionToSelect = options.find(
      (option) => optionToValue(option) === value,
    );
    selectItem(optionToSelect ?? null);
  }, [selectItem, value, options, inputFilter]);

  // Even there is already a value selected, when opening the combobox menu we want to display all available choices.
  useEffect(() => {
    if (downshiftReturn.isOpen) {
      setOptionsToDisplay(
        inputFilter ? options.filter(getOptionsFilter(inputFilter)) : options,
      );
    } else {
      setInputFilter(undefined);
    }
  }, [downshiftReturn.isOpen, options, inputFilter]);

  useImperativeHandle(ref, () => ({
    blur: () => {
      downshiftReturn.closeMenu();
      inputRef.current?.blur();
    },
  }));

  const onSearchInputChangeRef = useLatest(onSearchInputChange);
  useEffect(() => {
    onSearchInputChangeRef.current?.({ target: { value: inputFilter } });
  }, [inputFilter, onSearchInputChangeRef]);

  const onInputBlur = () => {
    setHasInputFocused(false);
    if (downshiftReturn.selectedItem) {
      // Here the goal is to make sure that when the input in blurred then the input value
      // has exactly the selectedItem label. Which is not the case by default.
      downshiftReturn.selectItem(downshiftReturn.selectedItem);
    } else {
      // We want the input to be empty when no item is selected.
      downshiftReturn.setInputValue("");
    }
  };

  const inputProps = downshiftReturn.getInputProps({
    ref: inputRef,
    disabled: props.disabled,
    // The input is rendered as a child of SelectMonoAux, which cannot reach it to wire
    // the label description, so the association is made here.
    "aria-describedby": props.labelDescription
      ? `${downshiftReturn.getLabelProps().htmlFor}-description`
      : undefined,
  });

  const renderCustomSelectedOption = !showLabelWhenSelected;

  return (
    <SelectMonoAux
      {...props}
      downshiftReturn={{
        ...downshiftReturn,
        wrapperProps: {
          onClick: () => {
            inputRef.current?.focus();
            // This is important because if we don't check that: when clicking on the toggle button
            // when the menu is open, it will close and reopen immediately.
            if (!downshiftReturn.isOpen) {
              downshiftReturn.openMenu();
            }
          },
        },
        toggleButtonProps: downshiftReturn.getToggleButtonProps({
          disabled: props.disabled,
          "aria-label": t("components.forms.select.toggle_button_aria_label"),
        }),
      }}
      labelAsPlaceholder={labelAsPlaceholder}
      options={optionsToDisplay}
    >
      <input
        {...inputProps}
        className={classNames({
          "c__select__inner__value__input--hidden":
            renderCustomSelectedOption && !hasInputFocused,
        })}
        onFocus={() => {
          setHasInputFocused(true);
        }}
        onBlur={() => {
          onInputBlur();
        }}
      />

      {renderCustomSelectedOption &&
        !hasInputFocused &&
        downshiftReturn.selectedItem &&
        isOptionWithRender(downshiftReturn.selectedItem) &&
        downshiftReturn.selectedItem.render()}
    </SelectMonoAux>
  );
};
