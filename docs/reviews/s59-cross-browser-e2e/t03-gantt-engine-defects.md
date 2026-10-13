# Review — Ticket s59-cross-browser-e2e/t03-gantt-engine-defects

> Fresh-context review. Diff reviewed: `git diff next...feature/s59-cross-browser-e2e/t03-gantt-engine-defects`

## Plan compliance
- [x] Code does what the t03 plan says, nothing more: `tabIndex={-1}` on `.c__gantt__scroller` (Gantt.tsx:1780-1781), `-webkit-user-select: none` before `user-select: none` in `&[data-editing]`, one vitest assertion, one patch changeset. Plan ticks only.
- [x] Run interdicts: no dependency, no tolerance or assertion changed, no skip, no generated file left modified (`cunningham-tokens-sass.scss` restored), no s07/s17/s22-s24 guard touched, e2e specs untouched.

## Anti-hallucination
- [x] `tabIndex` is a standard div prop; `-webkit-user-select` is a real property; `.c__gantt__scroller` and `[data-editing]` exist.
- [x] No wrong logic. a11y: axe `scrollable-region-focusable` passes if the region or any descendant is focusable. The scroller is now itself focusable (tabindex=-1) and holds rows with a roving `tabindex=0`, so the rule is satisfied. Not an a11y regression: Chromium and WebKit never had the scroller as a Tab stop, and Firefox's extra stop was the defect. Keyboard scrolling stays through the rows (arrows, Home/End, scrollIntoView). A mouse click now focuses the scroller, which lets native arrow scrolling work; "no ring after a mouse click" still passes.
- [x] The comment and changeset match the code.

## Security
- [x] Nothing applicable (static attribute and CSS); no injection, authz, secrets, IDOR, XSS or logs.

## Factorization
- [x] One place per rule; no abstraction added.

## Rules compliance
- [x] AGENTS.md followed (gitmoji changeset, BEM kept, no literal values). No ADR contradicted.
- [x] Design contract s22 (one row tab stop, zoom buttons the only other stops) restored on Firefox, unchanged elsewhere.

## Tests
- [x] Suite run by me: `TZ=UTC yarn test` 52 files / 1214 tests green; Gantt.spec 147 green; `yarn lint` ok; `check-locales` ok; `yarn build` ok.
- [x] Gantt CT (throwaway config, port 27070, cache removed, config deleted, no listener left):
  - chromium 47/47.
  - firefox 45/47. Remaining reds: `:610` and `:1530` (CDP touch, t05). `:214` and `:235` green.
  - webkit 42/47. `:455` green. Remaining reds: `:214` (macOS Safari does not Tab to buttons, platform; the Linux image is the reference), `:235` (edge-position assertion, WebKit pixel scale, attributed to t02 not merged here; I could not isolate it further), `:610` and `:1530` (t05), `:1028` (t02, colorsAt). Every red has an owner outside t03.
- [x] Bite proven. Mutation 1: removed `tabIndex={-1}`. Result: vitest 1 red, Firefox `:214` and `:235` red (3 total). Restored, `git diff --exit-code` clean. Mutation 2: removed `-webkit-user-select: none`. Result: WebKit `:455` red (1; chromium unaffected). Restored, `git diff --exit-code` clean.
- [x] The new vitest assertion is a real attribute contract tied to a browser behaviour, and it bites. No redundant tests.

## Regressions
- [x] Chromium computed values unchanged: the `-webkit-` prefix is an alias of `user-select` there (both `none`), and tabindex=-1 changes no style. All 47 chromium tests are green, including the forced-colors, ring and keyboard guards.

## Findings
- minor — docs/plans: tick marks in the plan are made by the implementer; the artifact line is added by the main agent (not a finding).
- minor — follow-up (not a defect of this ticket): other unprefixed `user-select` (`button/_base.scss`, select, date-picker, image viewer, quick-search, tree-view) are to be listed in the PR.

## Not verified
- Firefox and WebKit on the Linux image (CI reference): my runs were local on macOS, so the WebKit Tab and pixel-scale reds are explained by inference, not reproduced in the image. Gesture: open the PR `e2e` job after t02 and t05 merge.
- No real screen reader or axe browser run: the `scrollable-region-focusable` verdict is from the rule's definition, not from executing it. Gesture: run the Storybook a11y panel on the Gantt stories; Tab through the chart in Firefox and Safari.
- By hand, wheel scrolling on the box and arrow keys on the focused scroller after a click; not exercised by a test.

## Verdict
Max severity: minor
Ship allowed: yes
