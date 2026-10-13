# Gantt chart, move and resize tasks — `s23-gantt-move-resize`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

With `editable`, users move and resize task bars directly on the chart, with the pointer or the keyboard.

## User flow

1. Set `editable` and `onTaskChange`.
2. Drag a bar to move it, or drag an edge to change one date. Or focus a row and use the keyboard.
3. The chart shows a preview. On release, `onTaskChange` is called once with the new `start` and `end`.

## Visible rules

- The chart never changes your data. Apply the change to your tasks, or the bar goes back.
- Dates snap to the zoom: one day, one week or one month.
- A task is at least one day long. The end cannot go before the start.
- Keyboard: Alt with Left or Right moves the task. Shift with Left or Right moves the end. Enter confirms. Escape cancels.
- Escape also cancels a drag and restores the dates.
- Moving to another row or leaving the window cancels the edit.
- The chart stops at the first and last day drawn. The axis does not grow while editing.
- A task without dates cannot be edited.
- Screen readers hear the new dates at each step, the limits, and the result.
- Editing is not supported in right-to-left pages. `editable` is ignored there.
- Alt with Left or Right is also the browser history shortcut on Windows and Linux. The chart takes it only on an editable row.

## Out of scope

- Moving other tasks automatically.
- Undo.
- Editing task names.
