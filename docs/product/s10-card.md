# Card container — `s10-card`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

`Card` groups related content in a bordered, rounded surface with a light shadow. It is presentational. It owns no state, data or text.

## User flow

1. Render `Card` with `header`, `footer` and content as `children`.
2. Optionally pass `href` or `onPress` to make the whole card a link or a button.
3. The user presses the card with the pointer, or with Enter (and Space for a button).

## Visible rules

- `header` and `footer` are optional. A missing one renders nothing.
- A divider separates the header and the footer from the body.
- `href` and `onPress` cannot be used together.
- An interactive card changes background on hover and shows a focus ring for keyboard focus.
- An interactive card must not contain a link, a button or another focusable control.
- A static card has no role. Add `role="group"` and a name to expose it.
- Padding, radius and shadow come from tokens.

## Out of scope

- A disabled state, variants and sub-components.
- Data logic.
- A shared shadow scale for the design system.
