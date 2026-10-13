# New horizontal tabs — `s05-horizontal-tabs`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

`Tabs` follows the approved horizontal tabs design. The Classic tab is the `default` variant and the Line tab is the `line` variant.

## User flow

1. Render `Tabs` with `variant="default"` or `variant="line"`.
2. Move between tabs with the arrow keys.
3. The selected tab shows its panel. With `line`, the underline slides to the selected tab.

## Visible rules

- Automatic and manual activation both work (`keyboardActivation`).
- Tabs take an optional icon, and can be icon-only. The label then stays as the accessible name.
- When labels do not fit, the tab list scrolls sideways instead of overflowing.
- The underline moves instantly when reduced motion is on.
- Existing callers using `variant`, `fullWidth` and `keyboardActivation` are not affected.

## Out of scope

- A new variant name or new props.
- A change to the hover and selected background of the default tab.
