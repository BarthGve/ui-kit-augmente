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

- `onReset` is a new optional prop on both components.
- `SearchFilter` shows a loading row (`isLoading`) and an empty row (`emptyState`).
- Searching in `SearchFilter` keeps the current selection.
- Both are operable by keyboard.
- Existing props `label`, `options` and `showReset` keep working.

## Known limits

- The contrast of the trigger label on hover is lower than it should be. The trigger focus ring is also weak. A follow-up improves both.
- Loading and empty rows are not yet announced with their own name by screen readers. This is part of the same follow-up.

## Out of scope

- The larger redesign from the upstream issue (icon, overflow arrows, trailing reset icon, button-based bar).
- New global tokens.
