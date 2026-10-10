# Review s22-gantt-read-only / t01-gantt-scale (re-review after fix loop 1)

Branch verified: feature/s22-gantt-read-only/t01-gantt-scale. Diff: plan, scale.ts, types.ts, scale.spec.ts only.

## History
First review: MAJOR. The TZ/DST tests ran in UTC only (suite pinned to TZ=UTC), so the central invariant (dayIndex via UTC, formatDates timeZone UTC) was untested. Minor: dayWidth px mirror could drift from the t02 tokens.

## Fix verification
- `tsx` 4.21.0 is already a devDependency of packages/ui-components; no package.json / yarn.lock change in the diff.
- Mutation 1: dayIndex using `toDate(getLocalTimeZone())` gives 3 red (Paris, Los Angeles, Auckland). Mutation 2: formatDates without `timeZone: "UTC"` gives 1 red (Los Angeles). Both files restored: `git diff --exit-code` clean and byte-identical to a backup copy.
- Child-process tests: 3 cases, about 150 ms each, whole spec about 1 s. Paths come from `createRequire(__filename).resolve("tsx/cli")` and `__dirname`, with `process.execPath`; nothing machine-specific. They assert the zone is effective (`result.zone === tz`), so they cannot pass vacuously. DST pairs cover Paris, Los Angeles and Auckland plus a leap day. 20 s timeout is generous.
- Full suite: ui-tokens build, then `yarn test --concurrency=1`: 40 files, 667 tests green. Lint 0 errors, check-locales aligned, build green. `cunningham-tokens-sass.scss` restored; worktree clean (only the untracked review).
- Plan notes are truthful (20 cases, child-process approach, vi.stubEnv failure explained). The minor drift check is explicitly scheduled in t02 task 2.

## Remaining findings
- minor: Auckland runs in the Los Angeles-only killing case of formatDates (only LA turns red for mutation 2). Acceptable; the day-label shift only appears in negative-offset zones.

## Could not verify
- Windows/other OS behavior of `TZ` in the child process (macOS only). Tests need the ICU zone database, present in standard Node.
- Pixel mirror vs t02 tokens: deferred to t02. The PR must carry `Artifact: not applicable (internal util, no component yet)`, to be checked by a human at ship.

Max severity: minor
Ship allowed: yes
