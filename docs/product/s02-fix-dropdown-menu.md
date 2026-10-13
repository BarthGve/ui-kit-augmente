# Operable and announced dropdown menu — `s02-fix-dropdown-menu`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

`DropdownMenu` works with a keyboard and a screen reader. Items are announced as menu items, the selected item is announced as selected, and the menu no longer traps the user.

## User flow

1. Open the menu from its trigger.
2. Move through the items with the arrow keys, and press Enter to choose one.
3. Press Escape to close the menu, or Tab to leave it.

## Visible rules

- The open menu has the `menu` role. It is no longer wrapped in a dialog.
- A selected item (set with `selectedValues` or `isChecked`) tells assistive technology it is checked. The check icon is hidden from them.
- The name of an item includes its sub text when it has one.
- Escape calls `onOpenChange(false)`.
- `onSelectValue`, `callback`, `keepOpen` and `onOpenChange` behave as before. `ContextMenu`, `Filter`, `HelpMenu` and the Share dropdowns keep working.

## Out of scope

- Long labels, the focus indicator and the trigger state. They are handled in a later story.
- Changes to the public props of `DropdownMenu`.
