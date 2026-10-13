# Review s07-filters-update / t02-filters-on-reset

Branch verified: feature/s07-filters-update/t02-filters-on-reset. Diff: `git diff next...HEAD` (9 files, +130/-24 excluding the plan).

## Checklist
- [x] Tests run by the reviewer: `TZ=UTC yarn test --concurrency=1` green (3/3 tasks); filter + search-filter specs 57/57. `cunningham-tokens-sass.scss` was rewritten by the build, restored with `git checkout`.
- [x] References verified: `FilterResetRow`, `SelectStateContext`, `state.setValue`, `onItemSelect` exist; `UserSearchFilter` uses `SearchFilterProps`, so it inherits `onReset`.
- [x] Plan t02 task by task: 1 to 5 done (tests, implementation, mutations, stories + mdx, changeset minor). No drift; the plan checkboxes are ticked.
- [x] `onReset` is destructured out of `Filter` props: it does not reach RAC `Select` through `{...props}`, and `FilterInner` gets it explicitly. `onReset` is called after the existing `setValue(null)` / `onItemSelect(undefined)`, never instead of them.
- [x] Security / factorization / maintainability: nothing to report. The two components each add one optional callback; the reset row is unchanged.
- [x] UI: no visual change, no new token or component.
- [x] ADRs and AGENTS.md: no new dependency, no breaking change, no locale key. Changeset present.

## Mutations (restored, `git diff --exit-code` clean)
- Filter: reset calls `onReset` twice: 3 red.
- SearchFilter: `onItemSelect(undefined)` replaced by `onReset` only: 4 red.
- The implementer's logs (onReset on every selection, non-optional `onReset?.()`) were not re-run; the two mutations above cover the call-once and not-instead-of invariants.

## The "onReset not forwarded to Select" guard
Accepted, not a finding. The destructure is a one-token hygiene measure. React Aria filters unknown props before they reach the DOM, and a function prop cannot appear in a DOM-string snapshot. A test would need to spy on the `Select` props, which is coupling to the implementation. The implementer recorded this honestly in the plan. The `open` DOM guard still passes `onReset`, which covers any attribute leak.

## Findings
- minor: the `watchErrors` helper in `Filter.spec.tsx` is duplicated in the SearchFilter spec in spirit (error capture on window). It is acceptable at two uses; extract it if a third arrives.

## Not verified
- Storybook rendering of `WithReset` (`fn()` action) and of the argTypes row: no browser run. A human should open the two stories and click Reset to see the action logged.
- Playwright CT (chromium) was not run: no visual change in this ticket.
- The `Artifact: updated (version <id>)` line is added later by the main agent (per the task).

Max severity: minor
Ship allowed: yes
