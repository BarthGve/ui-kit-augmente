# Readable focus ring on every button — `s01-fix-button-focus-contrast`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

Keyboard users can see which button has focus. Every `Button` shows the same two-part ring: a gap in the page surface colour, then an outer ring in the colour of the button. The gap now follows the theme, so it no longer shows a white halo on dark surfaces.

## User flow

1. Press Tab to move to a button.
2. The focused button shows a gap, then a ring around it.
3. In any of the six themes, the ring stands out from the gap and from the page.

## Visible rules

- All variants (primary, secondary, tertiary, bordered) and all colours (brand, neutral, warning, error, success, info) use the same ring.
- The ring keeps a contrast ratio of at least 3:1 against the gap and the page in the six themes (default, dark, DSFR light and dark, ANCT light and dark). A test checks this.
- The gap uses the surface colour of the theme, not a fixed white.
- Sizes, widths and the non-focus look of every button are unchanged.

## Out of scope

- `ProConnectButton`.
- Any change to hover, active or disabled states.
- New design tokens.
