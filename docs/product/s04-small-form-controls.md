# Small checkbox, radio and switch — `s04-small-form-controls`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

`Checkbox`, `Radio` and `Switch` have a small size, so forms fit dense layouts.

## User flow

1. Set `size="small"` on a `Checkbox`, `Radio` or `Switch`.
2. The control renders smaller, with sizes taken from tokens.
3. The user operates it with the pointer or the keyboard as before.

## Visible rules

- `size` is `"medium"` (default) or `"small"`.
- Without `size`, nothing changes for existing code.
- A small control keeps its label, hint text, error and success states, and its focus ring.
- A small control has an interactive area of at least 24 by 24 px.
- The `Switch` label side keeps working.

## Out of scope

- A size option on groups of controls.
- New tokens for `Radio`. It reuses the checkbox tokens.
