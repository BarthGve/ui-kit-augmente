# Accordion — `s11-accordion`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

`Accordion` shows collapsible panels, so users read long content section by section.

## User flow

1. See a list of titles, each with a chevron.
2. Select a title, or press Enter or Space on it, to open its panel.
3. Select it again to close it.

## Visible rules

- One panel is open at a time. Set `allowsMultipleExpanded` to open several.
- The state can be controlled (`expandedKeys`, `onExpandedChange`) or uncontrolled (`defaultExpandedKeys`).
- Each trigger tells assistive technology whether it is expanded.
- Arrow Down and Arrow Up move to the next and previous trigger, and Home and End to the first and last. They skip disabled items.
- `isDisabled` disables one item or the whole accordion.
- Each title sits in a heading. Choose its level with `headingLevel` (default 3).
- A closed panel is hidden from the page and from screen readers.
- Open and close animation stops when reduced motion is on.

## Out of scope

- A boxed or card-like look.
- An `items` array API and a custom icon.
- The separate `Collapsible` component.
