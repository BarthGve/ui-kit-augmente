# Review s22-gantt-read-only / t02-gantt-static

Branch verified: feature/s22-gantt-read-only/t02-gantt-static.

## Run myself
- `yarn test --concurrency=1`: 41 files, 698 tests green. `yarn lint`: 0 errors (94 warnings). `yarn check-locales`: aligned. `yarn build` not re-run (the tests rebuilt the tokens); `cunningham-tokens-sass.scss` restored with git, tree clean.
- Imports/APIs: all `@internationalized/date` calls (`startOfWeek`, `endOfWeek`, `endOfMonth`, `startOfYear`, `DateFormatter`, `parseDate`) exist; `src/index.ts` adds only Gantt, GanttProps, GanttTask, GanttZoom. Locale keys in the 5 files, same keys.
- Token sass: the diff against next on `cunningham-tokens-sass.scss` is additions only, 6 identical gantt blocks, matching the `.scss`. No literal colour/px in index.scss (only `calc()` on tokens/custom properties).
- Security: task names rendered as React text, ids only in `data-task-id` (escaped), custom properties set from numbers only. Date-range DoS fixed by MAX_DAYS; task count is accepted.
- TZ: `scale.spec.ts` uses a real child process with TZ (execFileSync), so the claim bites.

## Neutralization
Removed the left clip and the `stop < start` null in `positionOf`: 5 red (4 in bounded-range scale specs, 1 in Gantt.spec). Restored, `git diff --exit-code` clean.

## Findings
- minor 1 (logic, scale.ts windowing): when ALL valid tasks lie in the far past with a total span >= MAX_DAYS (e.g. one task 1980-01-01 to 1990-01-01, or 0001..0100), `first` is raised to `today - 1830` but `last` stays before it. Probe: `days = -701904` for 0001-01-01..0100-01-01 (week zoom), no ticks, `--gantt-days` negative so the grid width is invalid CSS. It does not crash or exhaust memory (no DoS), rows and names stay, but the chart is degenerate. Fix: clamp `last = max(last, first)` (or window around the data when it is wholly before the floor) and add a spec. The existing bounded specs only cover ranges that include today.
- minor 2: the first-row `tabindex=0` deviation and the 40% task column cap are declared and handled by t03/t04; nothing to do here.
- Note: PR line `Artifact: updated (version <id>)` is the main agent's; not checked. Trailer says Sonnet (cosmetic).

## Plan vs diff
All t02 tasks present (spec, tokens, locales, component, stories, changeset minor, registration, exports). No out-of-scope code seen. Bar colour decision (content.brand.tertiary) is consistent between tokens.ts and the generated css/scss.

## Could not verify
- Real rendering (browser), sticky behaviour, focus ring, forced-colors, reduced-motion, contrast in the 6 themes, Storybook axe results: only the implementer's claims; a human should open the 5 stories in default/dark/dsfr-light and Tab into the chart.
- `yarn build` output not re-run by me.
- Screen-reader announcement of the row aria-label (NVDA/VoiceOver).

Max severity: minor
Ship allowed: yes
