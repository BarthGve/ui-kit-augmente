# Review s22-gantt-read-only / t04-gantt-keyboard

Branch verified: `feature/s22-gantt-read-only/t04-gantt-keyboard`. Diff: `git diff next...HEAD` (7 files).

## Checks run
- `yarn lint` green. `yarn check-locales` aligned. `yarn test --concurrency=1`: 719 passed (41 files). `yarn build` green; it rewrote `cunningham-tokens-sass.scss`, which I restored with git. `cunningham-tokens*` has no diff against `next`.
- CT `e2e/gantt` on chromium-headless-shell (throwaway config, dm-port 23026): 13/13 passed. The installed shell is build 1243 and Playwright expects 1228, so I used an explicit `executablePath`. Config, test-results and cache deleted.
- No leftover files; `git status` clean.

## Mutations (each restored, `git diff --exit-code` clean)
- `preventDefault` removed: 1 unit test red (modifier/zoom-button case, which asserts the return value of `fireEvent`).
- Modifier guards neutralized: 1 red.
- No-wrap turned into wrap on ArrowDown: 1 red ("does not wrap").
- Re-focus of a removed focused row disabled: 1 red (insert/remove).
- `scrollIntoView` neutralized: 1 CT red (bar-into-view case); jsdom stubs it.
- `inline-size: 100cqi` of the ring layer neutralized: 1 CT red (ring whole inside the box).
- `onFocus` guard `index < 0`: 0 red. Not reachable today: the grid holds no focusable other than the rows. Minor, dead defensive line.

## Findings (all minor)
1. `anchorStale` reads `scrollerRef.current.scrollLeft` during render. This is impure and relies on the DOM not yet being committed. It is documented and covered by CT mutations, so acceptable, but fragile under concurrent rendering.
2. `onBlur` clears `focusedId` only when `relatedTarget` is set. If the user clicks blank space (relatedTarget null) and the formerly focused row is then removed, focus is pulled back onto the neighbour row (only when `activeElement === body`). Edge case; harmless but surprising.
3. The `!anchorStale` condition is not isolated by a test (the plan says so itself). It is redundant with the dep change, so it is either dead or a defensive guard.
4. Plan text in task 3 still says `data-task-row` and "a ref ... index"; the diff documents the deviation in the plan's Done notes, which is enough.

## Verified
- Handler scope: rows matched as direct `:scope > .c__gantt__row` children of this grid, so nested or foreign targets give `from < 0` and are ignored. Modifiers, zoom buttons and unmapped keys are ignored. `preventDefault` only when focus actually moved. No wrap. An empty `tasks` list gives `stopIndex` -1, safe (`tasks[-1]?.id`, `Math.max`).
- Ring: sticky `::after` of `100cqi` inside the scroller (an `inline-size` container), placed in grid-area over both cells, `z-index: 2` above the sticky column. Bitmap check in CT before and after scroll. Plan deviation (the ring is read on `::after`) is documented.
- MDX: the keyboard table and the tokens table match `tokens.ts` and the code (Tab order, no wrap, Home/End, announcement formats). Width note from t03 present. Scroll behaviour truthful.
- MAX_DAYS windowing untouched; the existing spec still covers it (passing).
- No new dependency, no token, harness props override is test-only. The deleted decorative test (tab stop surviving a zoom rerender) is justified: no mutation turned it red.
- The PR line `Artifact: updated (version <id>)` is added by the main agent; not judged here.

## Could NOT verify
- Storybook a11y/axe runs in default, dark, dsfr-light and the manual keyboard drive (claimed in the plan): I did not start Storybook. A human should tab through `Default` and `LongSchedule` with a screen reader (VoiceOver) and confirm the row announcement.
- WebKit and Firefox CT: only chromium was run (sticky plus `cqi` behaviour in Safari is the main risk). Gesture: run `yarn test:ct` on webkit and firefox.
- Real screen reader announcements; forced-colors ring rendering.
- `SimpleDataGrid.spec` flakiness did not occur with `--concurrency=1`.

Max severity: minor
Ship allowed: yes
