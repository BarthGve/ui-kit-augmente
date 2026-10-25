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

  // Compared by content: callers often pass a new array on every render.
  const valueKey = JSON.stringify(props.value ?? []);

  // If the component is used as a controlled component, we need to update the local value when the value
  // or the options change (options may arrive after the value).
  useEffect(() => {
    // Means it is not controlled.
    if (defaultValue !== undefined) {
      return;
    }
    const next = getSelectedItems(options, JSON.parse(valueKey));
    // Keep the same array when nothing changed, so inline options cannot loop.
    setSelectedItems((prev) => (sameItems(prev, next) ? prev : next));
  }, [defaultValue, valueKey, options]);

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
