# Review s23-gantt-move-resize / t02-gantt-pointer-move

Branch verified: `feature/s23-gantt-move-resize/t02-gantt-pointer-move`. Diff: `git diff next...HEAD` (20 files).

## Verified by running
- `yarn workspace @gouvfr-lasuite/ui-tokens build`, then `yarn test --concurrency=1`: ui-components 42 files / 763 tests green (Gantt.spec: 62).
- `yarn lint` green, `yarn check-locales` aligned (5 locales), `yarn build` green. The build and test rewrote `cunningham-tokens-sass.scss`; restored with `git checkout` (tree clean).
- CT `e2e/gantt` with a throwaway chromium-headless-shell config on the dm-port (21936): 19/19 green, including (p)-(u). Config and artifacts deleted. Port 6006 untouched, no orphan process.
- Tokens: the hand-added hunks in `cunningham-tokens-sass.scss` are exactly 4 lines x 6 themes (`drag-outline-color`, `ghost-border-color`, `tooltip-background-color`, `tooltip-color`), no other line changed against `next`. They equal the generated `.scss` hunks line for line. The `.css`, `.scss`, `.ts` files are generated and carry only the gantt tokens. Contrast tests (6 themes) are in the suite and green.
- Imports and APIs verified: `./edit` exports (`clampToAxis`, `GanttUnitSpan`, `isNoop`, `moveSpan`, `toChange`, `unitsFromPixels`) exist with the signatures used; `flushSync` from `react-dom`; `VisuallyHidden` from `react-aria`.

## Checks requested
- Caller data never mutated: the preview is separate state, the commit only passes ISO strings from `toChange`; the test uses deep-frozen tasks and compares JSON. OK.
- Read-only default: `editable` false means no `data-editable`, no cursor rule (scss test counts cursor rules), no status region. `onPointerDown` returns first on `!editable`, so no listener is ever added. The keyboard handler is unchanged (modifiers still ignored). OK.
- Lifecycle: pointerup, pointercancel, lostpointercapture, Escape, window blur and unmount all go through `close()`, which sets `drag.current = null` first and calls `unlisten` (keydown capture and blur). The pointerup, then lostpointercapture sequence is safe because the session is already closed. OK.
- Non-primary buttons ignored, a second concurrent pointer ignored (`drag.current`), pointerId filtered. OK.
- Clipped (MAX_DAYS) or undated tasks: no session. px/day is measured from the track rect, and `!isFinite || <= 0` refuses (the t01 warning is honoured). OK.
- `onTaskChange` is called once, only on a non-noop commit, never on Escape. Verified by tests and by mutation.
- `stopPropagation` is only active while a session runs (capture listener registered at pointerdown); the Modal case is in CT (u), green.
- aria-live: one `role="status"` per chart, only when editable. The messages are correct, and the 5 locales are aligned with the proper Intl wording (fr-FR "du ... au ...", es-ES "del ... al ..."). One announcement per snapped step (one-update guard).
- Roving tabindex: `GanttRow` receives `tabIndex` from the same `stopIndex`; the existing focus tests (unit and CT 8-13) are green.
- The anchor union (`date` | `origin`+`pxPerDay`) is consistent with the zoom path; test (o) bites on the scroll value.
- No leftover throwaway files (`git ls-files --others` empty).

## Mutations (restored, `git diff --exit-code` clean)
1. `isNoop` neutralised (always commit): 2 red. OK.
2. Escape `stopPropagation` removed: 1 red. OK.
3. Unmount cleanup (`unlisten`) removed: 0 red. Not covered (finding m1).
4. Clipped guard `start.compare(scale.origin) < 0` removed: 0 red (the `end` clause covers the test fixture). Not covered (finding m2).

## Findings
- m1 (minor): no test proves that unmounting mid-drag removes the document keydown and window blur listeners. The code is correct (the effect cleanup), but the leak guard is unprotected. Add a spec: start a drag, unmount, press Escape and assert that an outer handler still sees it.
- m2 (minor): the clipped-before-origin case (`start < origin`) has no test. Only the combined `0001-01-01..9999-12-31` fixture is used, which is caught by the `end` clause alone.
- m3 (minor): `Gantt.mdx` line 9 still says "It is read-only: no editing, no drag and drop" and lines 112-113 say modified keys are "reserved for editing in a later version". With `editable` shipped in this ticket's public API (minor changeset) the first sentence is now false for consumers. The plan assigns the MDX to t04, so it is tolerated here, but the t04 rewrite must not slip, and a one-line fix in this ticket would be cleaner.
- m4 (minor, declared): the tooltip and `data-editing="move"` appear at press (before any movement), and a bare click on an editable bar briefly flashes the ghost/tip and announces nothing. Cosmetic, acceptable as declared. Likewise the missing 300ms announcement throttle and no visibilitychange/contextmenu cancel: acceptable for V1, to be listed in the PR.
- m5 (cosmetic, declared): the commit trailer says Opus. Not a code problem.
- The three behaviours the implementer declared as not mutation-covered (user-select, one-update guard, test (r)): the user-select rule is covered by the stylesheet text test and the CT (t) test, which is green. Accepted.

## Not verifiable by me
- Real touch, WebKit and Firefox (CT only run in chromium headless shell); VoiceOver/NVDA announcement quality; visual rendering of ghost/tip/outline in the 6 themes and forced-colors (only the CSS text and contrast numbers were checked, no screenshot); Storybook a11y addon run (the implementer's claim, not reproduced). A human should: open the `Editable` story in default, dark and dsfr-light, drag a bar, press Escape, tab away; check Windows high-contrast mode.
- The `Artifact: updated (version <id>)` PR line is added by the main agent: noted only.

Max severity: minor
Ship allowed: yes
