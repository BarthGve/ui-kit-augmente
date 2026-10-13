# ADR 003 — DropdownMenu exposes the selected state per item, through the MenuItem `render` prop

- Status: accepted
- Date: 2026-10-09
- Scope: story s02-fix-dropdown-menu

## Context
`DropdownMenu` shows a selected option only with a decorative check icon. Assistive technology hears plain `menuitem`s with no state (ui-kit #183). An option is selected when its `value` is in `selectedValues` or when it has `isChecked: true`. Every consumer relies on `MenuItem.onAction`, which calls `onSelectValue`, then `callback`, then `onOpenChange(false)` unless `keepOpen`. The t01 spec pins these calls. The component is shared by nine consumers. Some of them use `value` as an action id without `selectedValues` (FilePreview `download`/`print`, ShareMembersActions). Others put plain actions next to the choices ("Remove access" in the Share role dropdowns).

What react-aria-components 1.16.0 allows was checked in the source:
- `useMenuItem` computes the item `role` from the menu's `selectionMode`, and `MenuItem` passes only `data-*`, `id` and labelling props through `filterDOMProps`. So `role` and `aria-checked` cannot be set as plain props.
- `MenuItem` accepts a public, typed `render` prop (`PossibleLinkDOMRenderProps<'div', …>`) that renders the item element. Attributes set after the spread props win.

## Decision
`DropdownMenu` decides per item whether it is checkable:
- an option with `isChecked` defined;
- or an option with a `value`, when the caller passes `selectedValues` (an empty array counts).

Only checkable items get a `render` prop. It renders the same `div` with `role="menuitemcheckbox"` and `aria-checked` set to the selected state. All other items render exactly as before, as plain `menuitem`s. No `selectionMode` is set on the `Menu`, so `onAction` → `onSelectValue`, `callback`, `keepOpen` and `onOpenChange` are not affected. The check icon stays decorative and is hidden with `aria-hidden`.

The role is `menuitemcheckbox`, not `menuitemradio`. The API describes a set: `selectedValues` is an array and `isChecked` is per item. One menu can therefore have several checked items, as the t01 fixture does. Several checked radios in one group is invalid ARIA, while checkboxes are valid for any count.

## Considered options
- React Aria `selectionMode` + `selectedKeys` on `Menu` — rejected because:
  - The mode applies to the whole menu, so every non-trigger item changes role, including plain actions such as "Remove access" and action-id items in FilePreview.
  - When keys are selected, `useSelectableCollection` moves the initial focus to the first selected key instead of `autoFocus="first"`. That changes keyboard behaviour for every consumer and breaks the pinned "arrow keys from the first item" test.
  - It adds a selection manager next to `onAction` that the API does not need.
- Explicit `role`/`aria-checked` as plain `MenuItem` props — rejected because they are not possible: `filterDOMProps` drops them and `useMenuItem` overwrites the role.
- `MenuSection` with its own `selectionMode` around the choices — rejected because it adds `role="group"` wrappers and changes the DOM and styles of every selectable menu. It also cannot keep the consumer's order when actions and choices alternate.
- `menuitemradio` for `value` items — rejected because `selectedValues` is an array and the component cannot tell whether the caller enforces a single choice. Several checked radios would be invalid.

## Consequences
Easier: screen readers announce "checked" or "not checked" on choices, and no consumer callback or focus behaviour changes. Harder: queries by role change for checkable items, from `menuitem` to `menuitemcheckbox` (Share e2e specs updated). Single-choice pickers are announced as checkboxes, not radios. To watch: the `render` prop is used for the `div` branch only (these items have no `href`). If a future RAC version adds a per-item selection API, it can replace this. A caller that wants radio semantics would need a new prop and a new ADR.
