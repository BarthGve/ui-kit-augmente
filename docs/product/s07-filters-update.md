# Updated filters — `s07-filters-update`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

`Filter` and `SearchFilter` are documented in every state (default, active, open, loading, empty). Their values come from tokens. The look is unchanged.

## User flow

1. Open a filter and pick an option.
2. The filter shows as active.
3. Choose the reset row to clear it. `onReset` is called.

## Visible rules

- The trigger label keeps at least 4.5:1 contrast on hover and focus, in all six themes.
- Keyboard focus shows a ring of at least 3:1 around the trigger. Pointer clicks do not (after closing by an outside click, the browser may show it again).
- The SearchFilter popover is named after its trigger, and its loading row has a translated name.
- `onReset` is a new optional prop on both components.
- `SearchFilter` shows a loading row (`isLoading`) and an empty row (`emptyState`).
- Searching in `SearchFilter` keeps the current selection.
- Both are operable by keyboard.
- Existing props `label`, `options` and `showReset` keep working.

## Out of scope

- The larger redesign from the upstream issue (icon, overflow arrows, trailing reset icon, button-based bar).
- New global tokens.
