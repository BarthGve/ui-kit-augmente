# Gantt chart, dependencies between tasks — `s24-gantt-dependencies`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

`Gantt` draws links between tasks, shows conflicts, and lets users add and remove links.

## User flow

1. Pass `dependencies`. Each is `{ from, to }`: `to` starts after `from` ends.
2. To edit, set `editable` and `onDependencyChange`.
3. Drag the connector at the end of a bar onto another task, or select a link and choose Remove link.

## Visible rules

- A link goes from the end of one bar to the start of the other, with an arrow.
- A link is in conflict when the successor starts on or before the last day of its predecessor. It is dashed, coloured and marked with "!".
- A conflict appears live while a task is moved. Nothing moves automatically.
- A link that would close a loop is refused with a message. So are a link to itself, a task without dates, an existing pair, and a chart over 1000 links.
- Refused links are not reported through `onDependencyChange`.
- Each action calls `onDependencyChange` once, with `add` or `remove`. The chart never changes your data.
- Keyboard: Alt and Shift with Right or Left starts a link. Arrow keys pick a task. Enter links, or unlinks if the link exists. Escape cancels.
- Creating a link with the pointer needs a drag. Use the keyboard if you cannot drag.
- Links are listed for screen readers, including links that are not drawn.
- Links are not drawn in right-to-left pages. Link editing is off there.
- The Storybook story `Dependencies` loads demo data to try it by hand.
- Only finish-to-start links exist.

## Out of scope

- Other link types and lag.
- Moving dependent tasks automatically.
- An axis that grows while dragging.
