import React, { useEffect } from "react";
import {
  optionsEqual,
  optionToValue,
} from ":/components/forms/select/mono-common";
import { useLatest } from ":/hooks/useLatest";
import { SelectMultiSearchable } from ":/components/forms/select/multi-searchable";
import { SelectMultiSimple } from ":/components/forms/select/multi-simple";
import { SubProps } from ":/components/forms/select/multi-common";
import { Option, SelectProps } from ":/components/forms/select/index";

export type SelectMultiProps = Omit<SelectProps, "onChange"> & {
  onChange?: (event: { target: { value: string[] } }) => void;
};

const getSelectedItems = (options: Option[], values: string[]) =>
  options.filter((option) => values.includes(optionToValue(option)));

const sameItems = (a: Option[], b: Option[]) =>
  a.length === b.length &&
  a.every((item, i) => optionsEqual(item, b[i]) && item.label === b[i].label);

export const SelectMulti = (props: SelectMultiProps) => {
  const { options, defaultValue, onChange } = props;
  const [selectedItems, setSelectedItems] = React.useState<Option[]>(() =>
    getSelectedItems(options, (defaultValue ?? props.value ?? []) as string[]),
  );

  // Compared by content: callers often pass new arrays on every render.
  const valueKey = JSON.stringify(props.value ?? []);
  // Options only matter when controlled: an uncontrolled selection lives in local state.
  const optionsKey =
    props.value === undefined
      ? ""
      : JSON.stringify(options.map((o) => [optionToValue(o), o.label]));
  const optionsRef = useLatest(options);

  // If the component is used as a controlled component, we need to update the local value when the value
  // or the options change (options may arrive after the value).
  useEffect(() => {
    // Means it is not controlled.
    if (defaultValue !== undefined) {
      return;
    }
    const values: string[] = JSON.parse(valueKey);
    setSelectedItems((prev) => {
      const next = getSelectedItems(optionsRef.current, values);
      // A selected value missing from the new options (e.g. filtered by a search) stays selected.
      prev.forEach((item) => {
        const value = optionToValue(item);
        if (
          values.includes(value) &&
          !next.some((option) => optionToValue(option) === value)
        ) {
          next.push(item);
        }
      });
      return sameItems(prev, next) ? prev : next;
    });
  }, [defaultValue, valueKey, optionsKey, optionsRef]);

  // If the component is used as an uncontrolled component, we need to update the parent value when the local value changes.
  const onChangeRef = useLatest(onChange);
  const selectedKey = JSON.stringify(selectedItems.map(optionToValue));
  useEffect(() => {
    onChangeRef.current?.({ target: { value: JSON.parse(selectedKey) } });
  }, [selectedKey, onChangeRef]);

  const onSelectedItemsChange: SubProps["onSelectedItemsChange"] = (
    newSelectedItems,
  ) => {
    setSelectedItems(newSelectedItems);
  };

  const defaultProps: Partial<SelectMultiProps> = {
    selectedItemsStyle: "pills",
    menuOptionsStyle: "plain",
    clearable: true,
  };

  return props.searchable ? (
    <SelectMultiSearchable
      {...defaultProps}
      {...props}
      selectedItems={selectedItems}
      onSelectedItemsChange={onSelectedItemsChange}
    />
  ) : (
    <SelectMultiSimple
      {...defaultProps}
      {...props}
      selectedItems={selectedItems}
      onSelectedItemsChange={onSelectedItemsChange}
    />
  );
};
