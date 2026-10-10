# Review s23-gantt-move-resize / t01-gantt-edit-rules

Branch verified: `feature/s23-gantt-move-resize/t01-gantt-edit-rules`. Diff: plan tick-marks, `gantt/edit.ts` (new), `gantt/edit.spec.ts` (new), `gantt/scale.ts` (+3 lines: `export type Axis`).

## Verified by running
- `yarn test --concurrency=1`: 42 files, 743 tests green (edit.spec: 24; gantt dir: 96).
- `yarn lint`, `yarn check-locales`, `yarn build` green. The build rewrote `cunningham-tokens-sass.scss`; restored with git. Tree clean.
- `src/index.ts` untouched, no changeset, no new dependency. Only `@internationalized/date` and the existing `dayIndex`/`toDay` are used; names and signatures checked in `scale.ts`.
- No input mutation (`CalendarDate` is immutable; `add` returns new values). Deterministic.

## Plan vs diff
Every task of t01 is present. The declared deviations are coherent and documented in the plan: `clampToAxis(span, axis, n, zoom, mode)`, `from` argument of `unitsFromPixels`, half-away-from-zero rounding, NaN/zero guard, axis-length cap. Nothing unasked. `Axis` is the only `scale.ts` change and `buildScale`/`MAX_DAYS` are not touched.

## Semantics
- Month move: start plus n clamped months, length kept in days (Jan 31 to Feb 5 becomes Feb 28 to Mar 5). Resize: only the edited edge. Always computed from the original span, so the round trip is exact.
- Month snapping: the nearest of n0-1, n0, n0+1 by real day index from the edited date. Tie goes away from zero. Matches the research (delta snapping).
- A span touching an axis edge can move inward; a span already outside the axis is frozen. Consistent with the test and the doc comment.

## Mutations (each restored; `git diff --exit-code` clean at the end)
| Mutation | Red tests |
|---|---|
| `dayIndex` in local time (scale.ts) | 3 (the three TZ child processes) |
| `roundHalfAway` replaced by `Math.round` | 2 |
| `resizeEnd` never clamps | 4 |
| `moveSpan` end no longer keeps the length | 2 |
| axis-end bound removed in `clampToAxis` | 7 |
| "span outside the axis" guard removed | 1 |
| month candidates reduced to n0 | 5 |
| month tie rule removed | 1 |

The TZ tests really run: a child process via `tsx/cli` with `env.TZ`, the script asserts `getLocalTimeZone() === tz`, and the cases are literals that flip under a local-time day count. Proven by the first mutation.

## Findings
1. **minor — M9 hang (axis cap removed).** Without the cap, the binary search on `n = Infinity` loops forever, so the suite hangs instead of failing. Production code has the cap, so this is not a defect of the shipped code. A synchronous infinite loop cannot be interrupted by a Vitest timeout, so a CI would end on its job timeout. That is still a detection, but a slow and unreadable one. Acceptable for this ticket. Optional hardening: the test could assert a bounded result without relying on the loop.
2. **minor — `unitsFromPixels` is not bounded for huge finite `days` in month zoom.** `Infinity` and `NaN` are handled (they give 0). A finite but absurd value is not: measured `dx=1e9` gives 9 ms and `1e12` gives about 11.6 s, because `@internationalized/date` `add({months})` is slow for huge n; `1e308` effectively freezes. It can only occur with a degenerate `pxPerDay` (about 1e-9) or an unrealistic pointer value, since the pointer is clamped by the screen. Suggested fix: cap `days` to ±(axis length) or to ±(`MAX_DAYS`+padding) before the month search, or let t02 refuse a `pxPerDay` below a sane minimum. Not blocking, but t02 must not feed it unmeasured geometry.
3. **minor — non-integer `n` in `clampToAxis`** (5.5 gives 6, -0.4 gives -1) because of `ceil` in the search. Callers pass integers from `unitsFromPixels`, so no impact. Optionally document "n integer".
4. **minor — `EDIT` map wrappers** `(span, zoom, n) => resizeStart(...)` exist only to widen the return type (`clamped` dropped). Harmless.

Inverted spans: `clampToAxis` returns 3 for an inverted span inside the axis, and `moveSpan` keeps a negative length. Callers (t02) only open sessions on valid spans (plan item k), so this is outside the ticket; noted.

## Could not verify
- No component, DOM or browser here, so nothing visual. Real consumers (`Gantt.tsx`) do not exist yet; integration with real pointer geometry is for t02. Human gesture: during t02, drag a bar in month zoom on a collapsed or very narrow track and check there is no freeze.
- TZ coverage is three zones on hard-coded dates; other zones (for example half-hour offsets) were not run.

Max severity: minor
Ship allowed: yes
