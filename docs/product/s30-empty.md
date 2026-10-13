# Empty state — `s30-empty`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

`Empty` explains why nothing is shown and what to do next.

## User flow

1. A list has no content.
2. The user reads the title and the description.
3. The user chooses an action, such as a button.

## Visible rules

- `title` is required and is a heading. Choose its level with `headingLevel` (default 3).
- `media`, `description` and `actions` are optional. A missing one renders nothing.
- The root is a plain `div`. Give it a name to expose it as a group.
- `media` is yours: hide a decorative icon with `aria-hidden`.
- Actions wrap on narrow screens.
- Spacing and colours come from tokens and work in the six themes.

## Out of scope

- Data logic.
- Changes to `DataGrid`.
- Built-in text. You provide every string.
