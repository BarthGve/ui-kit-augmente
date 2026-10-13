# Gantt chart, read-only — `s22-gantt-read-only`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

`Gantt` shows tasks on a time axis. One row per task, a bar from its start to its end date, and a marker for today. By default it is read-only.

## User flow

1. Pass `tasks` and an `aria-label`.
2. Read the schedule. Scroll sideways while the task list stays in place.
3. Choose Day, Week or Month to change the scale.

## Visible rules

- Dates are calendar days (`"YYYY-MM-DD"`). The end day is included.
- Today is marked with a line and a label. Set `today` to fix the day.
- A task with missing or invalid dates keeps its row, shows "No dates" and has no bar.
- Week is the default zoom. `zoom` and `onZoomChange` control it. `defaultZoom` sets the start.
- Tab enters the chart once. Arrow Down and Arrow Up move between rows, Home and End jump to the first and last. The focused row announces the name and the dates.
- The chart needs a width and a height from its container.
- The axis shows at most about ten years. A task outside that window keeps its row but has no bar.
- Every row is rendered. Measure with your data beyond a few hundred rows.

## Out of scope

- Editing tasks. See the move and resize story.
- Links between tasks. See the dependencies story.
- Task colours and task hierarchy.
