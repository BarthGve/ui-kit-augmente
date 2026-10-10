# Review — s24-gantt-dependencies / t01-gantt-link-rules

Branch verified: `feature/s24-gantt-dependencies/t01-gantt-link-rules`. Diff: `links.ts` (191 lines), `links.spec.ts` (394 lines), plan ticks only. `src/index.ts`, `types.ts`, `scale.ts`, `edit.ts`, `Gantt.tsx` untouched.

## Checks run
- `yarn test --concurrency=1`: 43 files, 815 tests green. `yarn lint` 0 errors, `yarn check-locales` aligned, `yarn build` green. `cunningham-tokens-sass.scss` rewritten by the test run and restored with git; tree clean.
- Artifact claim (`not applicable`): true. No component, prop, token or export change; the module is not reachable from `index.ts`. No changeset needed.

## Verification of the diff
- Imports exist: `GanttScale`, `Position` in `scale.ts`; `CalendarDate` type from `@internationalized/date`. `dayWidth` is a real `GanttScale` field (`scale.ts:108`). `DAY_WIDTH` is indeed private, so the `{ dayWidth }` deviation is justified and better than the plan.
- Cycle search is iterative with a visited set. The budget is sound: pops <= V+1 (start may be absent from the map) and edge steps <= E, so a legitimate search never reaches -1; I found no false refusal. Exhaustion answers `true` (refuse), the safe direction: a false refusal is possible only on a bug, a missed cycle is impossible.
- Bounded for any input: `normalizeLinks` breaks at `MAX_LINKS`, drops self/unknown/duplicate. The key `len:from+to` is collision-free. Beyond the cap the surplus is silently ignored (documented). Inputs never mutated (deep-frozen in tests). Output order deterministic (Map/Set insertion order).
- Conflict `succ.start <= pred.end` via `CalendarDate.compare`: no `Date`, no TZ dependence; invalid (end < start) and missing spans ignored in `conflictsOf`.
- Route geometry: forward = 3 segments (stub, vertical one lead before the successor, in); U = 5 segments, out by one gutter, along the line between rows (below the predecessor row if the successor is lower, above otherwise), in. Matches design. First/last points checked in tests.
- TZ tests really run in a child process: each asserts `getLocalTimeZone() === tz` for Paris, LA, Auckland.

## Mutations (restored, `git diff --exit-code` clean, no stray vitest process)
| Mutation | Red |
| --- | --- |
| `<=` to `<` in `conflictOf` | 6 |
| visited set removed | 2 (no hang, budget bites) |
| `MAX_LINKS` cap removed | 1 |
| cycle check removed in `checkLink` | 2 |
| forward threshold `>=` to `>` | 1 |
| `conflictOf` via local-midnight day count | 3 (the 3 TZ cases only) |
| budget `+ 1` removed | **0** |

## Findings
- minor 1: the budget's `+ 1` is untested. With an empty link list, `reaches([], "A", "B")` would return `true` without it (budget 0), and `checkLink([], a, b, ...)` is exactly the first link ever created. Add `expect(reaches([], "A", "B")).toBe(false)` and `checkLink([], "A", "B", all)` to null.
- minor 2: same-row predecessor/successor (`pred.row === succ.row`) is not tested; the forward route then has a zero-length vertical segment and the U route runs along the row top. t02 renderers should tolerate a degenerate segment or this case should be pinned.
- minor 3 (for t03): `checkLink` has no "limit reached" refusal; with 1000 links, adding a link would be accepted then silently dropped by `normalizeLinks`. Handle it in t03 or document it.
- minor 4: `normalizeLinks` would throw on a `null` entry (typed input, not a concern in TS, but caller data is untrusted at runtime). Optional `pair?.` guard.

No critical or major. Deviations (dayWidth, 55/56 tested at month zoom, extra `linkKey` and types, budget true, ponytail px mirrors) are sound and recorded in the plan.

## Not verified
- No rendering exists in this ticket: the route px mirrors (44/12) against the real tokens and the 16px root are only checked by t02's browser tests.
- Performance with a 50 000-chain is tested for stack safety, not timed on slow devices.
- Plan prose says "dayIndex only"; the module needs none, which is fine.

Max severity: minor
Ship allowed: yes
