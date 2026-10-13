# Timeline — `s17-timeline`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

`Timeline` shows events in order, each with a date, a title and optional content.

## User flow

1. Pass `events` and a name (`aria-label`).
2. Read the events top to bottom, or left to right with `orientation="horizontal"`.
3. In horizontal mode, scroll sideways when the row is wider than the page.

## Visible rules

- Events appear in the order given. They are never sorted.
- Each event can have a state: done, current or upcoming. The marker shape differs for each, and a hidden label is read by screen readers. Colour is not the only signal.
- Without a state, the marker is neutral and no label is read.
- Dates are formatted for the active language. `dateFormat` changes the format.
- A date-only string such as `2026-10-13` shows the same day in every time zone.
- The events are exposed as an ordered list.
- The horizontal list is in a scrollable region. Keyboard users reach it with Tab and scroll with the arrow keys.

## Known limits

- In the dark theme, the contrast of some markers is below the target. A follow-up fixes it.

## Out of scope

- Fetching data.
- An icon per event.
- An empty state. Show your own around the list.
