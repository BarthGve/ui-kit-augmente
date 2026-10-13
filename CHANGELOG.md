# Changelog

## 0.2.0 - 2026-10-13

First delivery of the fork. `@gouvfr-lasuite/ui-components` 1.4.0 (`@barthgve/ui-components` 1.4.0-fork.N once published, see ADR 005).

Stories delivered: s01 to s07, s10, s11, s17, s22 to s24, s26, s30, s56.

### Minor Changes

- 50ba6c7: ✨(AlertModal) add AlertModal, an alertdialog built on Modal
- 38a4d03: ✨(card) add Card container, interactive with `href` (link) or `onPress` (button)
- 704f9c7: ♿️(dropdown-menu) announce the selected state and full item names: options with `isChecked`, or with `value` when `selectedValues` is passed, are exposed as `menuitemcheckbox` with `aria-checked` (consumer tests that query them as `menuitem` must use `menuitemcheckbox`); an item's name now includes its `subText`; menu icons (leading, check, chevron) are hidden from assistive technology
- 7820a19: ✨(Empty) add Empty state: optional media, a title heading at the caller's level, optional description and actions
- d95d52a: ✨(Filter) Filter and SearchFilter: optional `onReset`, called by the reset row after the existing `onSelectionChange(null)` / `onItemSelect(undefined)`
- 1cee95f: ✨(gantt) draw dependencies between tasks
- 449bd8a: ✨(gantt) move task bars with the pointer
- 4243702: ✨(gantt) add read-only Gantt chart
- 07b2a12: ✨(Modal) forward role and aria-labelledby/describedby: optional `role` (`"dialog"` by default, or `"alertdialog"`), `aria-labelledby` and `aria-describedby`; with `aria-labelledby` the modal no longer sets an `aria-label` from its title
- bf63e3e: ✨(accordion) add Accordion with single and multiple open modes
- 586c927: ✨(Checkbox) add small size

  `Checkbox` accepts `size?: "medium" | "small"` (default `"medium"`, unchanged
  rendering). Type change: `CheckboxProps` no longer inherits the numeric HTML
  `size` attribute of `<input>`; code passing `size={n}` no longer compiles (the
  value was meaningless on a checkbox) and must drop it.

- 14af95c: ✨(Radio) add small size

  `Radio` accepts `size?: "medium" | "small"` (default `"medium"`, unchanged
  rendering). The small size reads the shared Checkbox `small-size` and
  `small-font-size` tokens. Type change: `RadioProps` no longer inherits the
  numeric HTML `size` attribute of `<input>`; code passing `size={n}` no longer
  compiles (the value was meaningless on a radio) and must drop it.

- 07073fb: ✨(Switch) add small size

  `Switch` accepts `size?: "medium" | "small"` (default `"medium"`, unchanged
  rendering). The small size reads the new `forms-switch` `small-rail-width`,
  `small-rail-height`, `small-handle-size` and `small-handle-offset` tokens and
  the shared Checkbox `small-font-size`; both `labelSide` values keep working.
  Type change: `SwitchProps` no longer inherits the numeric HTML `size` attribute
  of `<input>`; code passing `size={n}` no longer compiles (the value was
  meaningless on a switch) and must drop it.

- 8b670ac: ✨(Timeline) add Timeline, an ordered list of dated events with done, current and upcoming states
- 4344845: 🐛(tree-view) call `rowProps.onClick` when an ordinary row is clicked (it was only called on title, separator and "view more" rows). It runs once per click, before the node is selected or toggled; a handler passed through `rowProps.onClick` that was silently ignored on ordinary rows now fires, including on Enter/Space, which click the row.

### Patch Changes

- b89668b: 🐛(button) paint the focus ring gap with the surface token instead of a literal white, so the ring keeps its contrast in dark themes
- 475d530: 💄(Filter) read the Filter and SearchFilter sizes from new `filter` and `search-filter` component tokens, rendered values unchanged
- b71b185: ♿️(Filter) raise the hover contrast, add a focus ring and name the SearchFilter loading row and popover
- d666c9e: ♿️(dropdown-menu) render the open menu without a dialog wrapper, so Tab leaves it; clicking outside or on the trigger still closes it and `shouldCloseOnInteractOutside` is still honoured
- 634212d: ♿️(Timeline) raise the done and current marker contrast in dark themes
- 5b256cf: 💄(user-menu) use component tokens for colour, radius and spacing
