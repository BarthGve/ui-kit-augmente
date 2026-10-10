# Review s23-gantt-move-resize / t04-gantt-keyboard-edit

Branch verified: feature/s23-gantt-move-resize/t04-gantt-keyboard-edit. Diff: next...HEAD (11 files).

## Run myself
- ui-tokens build, `vitest src/components/gantt`: 140 pass. `yarn test --concurrency=1`: 787 pass (42 files). `yarn lint` green, `yarn check-locales` aligned, `yarn build` green.
- CT e2e/gantt, throwaway chromium-headless-shell config on port 21772 (deleted): 25/25 twice (one earlier run had one failure in the t03 handle-height test, green on the two reruns: flaky under load, not t04).
- cunningham-tokens*: unchanged vs next. Working tree clean after the runs (sass file restored, config removed).

## Plan vs diff
Tasks 1-5 done; the plan checkboxes are ticked. No unplanned code. The `editable` JSDoc edit in types.ts is a truthful correction. Locale key `edit_instructions` is in all 5 locales. Gantt.mdx matches the code: props, keyboard table, Alt+Arrow history note, RTL read once at mount, 2.5.7 gap, and no token in the diff.

## Checked in code
- preventDefault only on consumed chords (edit branch) and on Enter during a session. Read-only, Ctrl/Meta, both or neither of Alt/Shift, undated rows and zoom buttons are not handled and not prevented.
- Shortcuts act only when the target is a dated row of this grid and `canEdit`.
- Steps are recomputed from the original (`keySpan`: move, then end). The axis is checked on the composed span. A step is refused when it hits the axis or the span does not change, so the counters stay bounded.
- Exactly one onTaskChange per Enter through the shared `finish` (noop gives none); Escape (capture listener), window blur, row blur and nav keys call `cancel`; unmount calls `unlisten`.
- A chord during a pointer drag is ignored (`session.current && !keyEdit`); pointerdown during a keyboard session is ignored.
- Live region and instructions exist only when `canEdit`. `aria-describedby` and `aria-keyshortcuts` are set only on dated editable rows.

## Acceptance criteria s23 (t01-t04)
AC1 (t02 drag, both dates + onTaskChange), AC2 (t03 edge drag + keyboard Shift, clamp end>=start), AC3 (t04: Alt/Shift/Enter/Escape; unit and CT), AC4 (snap per zoom in rules/unit tests/CT), AC5 (Escape mid-drag restores; t02 unit/CT): all covered by tests that run green.

## Mutations (restored, `git diff --exit-code` clean each time)
- preventDefault removed from the edit branch: 3 red.
- `!canEdit` guard neutralized: 2 red.
- row-blur cancel removed: 1 red.
- Ctrl exclusion dropped: 1 red.
- commit anchor `pxPerDay: 0`: 1 red (the pointer test "keeps the leftmost visible day"). The keyboard Enter path (`px(scale.dayWidth)`) has no test of its own.

## Findings
- minor 1: Up/Down/Home/End during a keyboard session cancel then navigate (plan, validated, says exactly this), whereas the design says "ignored, stay on the row". The plan is the later, validated source and the behavior is safe (the session never lingers), so this is a documented divergence. Align the design doc or the MDX wording.
- minor 2: the keyboard commit anchor (`px(scale.dayWidth)`, rem-derived) is not covered by a keyboard test. Impact is limited to the scroll position when the origin moves, and the shared pointer test protects `finish`. A keyboard case with a moved origin would close it.
- minor 3: RTL is detected once at mount (declared and documented with a ponytail comment). A later `dir` change is not seen.
- minor 4: `data-editing="move"` gives the `grabbing` cursor during a keyboard session where the design wants none (SCSS, out of scope; cosmetic).
- minor 5: `cancel` closures capture the render at session start; harmless because they only read refs and setters.

## Not verified (human gestures)
- Alt+Arrow on real Windows/Linux browsers (history back/forward is only asserted weakly through the URL in Chromium macOS).
- VoiceOver/NVDA/JAWS announcements, and the `aria-describedby` reading of the row.
- WebKit and Firefox CT (chromium only here), touch devices, a real RTL page.
- Storybook a11y on the stories (I relied on the reported axe run, not rerun). Artifact update (version id) is the main agent's PR line: not checked.

Max severity: minor
Ship allowed: yes
