# Review — Ticket s59-cross-browser-e2e/t05-gantt-touch-neutral

> Fresh-context review. Diff reviewed: `git diff next...feature/s59-cross-browser-e2e/t05-gantt-touch-neutral`

## Plan compliance
- [x] Plan tasks 1-3 done and ticked (the diff also ticks the plan). Two `test.skip(browserName !== "chromium", CDP_TOUCH_ONLY)` (gantt.spec.tsx:672, :1639), no other skip. The message names engine (firefox, webkit), reason (no touch move/cancel outside Chromium, CDP `Input.dispatchTouchEvent`) and `#225`. Issue #225 exists and is OPEN ("native touch e2e for Gantt on Firefox and WebKit", BarthGve/ui-kit-augmente). Task 4 (PR line, skip count 2) stays for the PR.
- [x] Run interdicts: no dependency, no tolerance or assertion weakened, no generated file left modified (`cunningham-tokens-sass.scss` restored), only `e2e/gantt/gantt.spec.tsx` plus plan ticks. The diff has zero removed lines in the spec: the Chromium CDP test bodies are untouched (only `browserName` added to the destructuring and the skip line).

## Anti-hallucination
- [x] `Page`, `Locator`, `box`, `center`, `centre`, `connector`, `row`, `bar`, `editing`, `perDay`, `recorder`, `EditableGantt`, `TestGantt` all exist in the spec. The `PointerEvent` fields passed to `locator.dispatchEvent` are valid.
- [x] The shim is scoped by `p !== id` (id 7): other ids go to the native methods. It keeps one holder only. It cannot mask a bug in real pointer capture, which is also not covered by this test, and the comment says so. Capture shim equals the jsdom practice in Gantt.spec.tsx.
- [x] Comments match the code. The "Tab enters" failure on WebKit is not in this diff (spec line unchanged), so pre-existing.

## Security
- [x] Not applicable (test-only).

## Factorization
- [x] One helper `finger` shared by the two tests; no abstraction beyond the second use. Minor duplication of the bar-drag steps from the CDP test is the price of a different input channel.

## Rules compliance
- [x] AGENTS.md followed (gitmoji commit, no literal tokens). No ADR touched. Design system n/a.

## Tests
- [x] Run by me, all three engines, throwaway Playwright config (port 26486, deleted afterwards), after `yarn build` and `rm -rf playwright/.cache`: whole gantt CT = 142 passed, 4 skipped, 1 failed. The 4 skipped are the 2 CDP tests on firefox and webkit. Chromium: all pass, CDP tests included. The one failure is WebKit "Tab enters on the first row" (macOS Tab skips buttons), pre-existing: its lines are not in the diff. The flaky "rows step by row-height" passed on this run. The browsers were not in `~/Library/Caches/ms-playwright` when I started (contrary to the brief); I installed chromium, firefox and webkit with `npx playwright install`.
- [x] The neutral tests assert real outcomes: `touch-action` of the bar and connector is `none`, of the track not `none`; `data-editing="move"` during the drag; payload `["t1", {start:"2026-01-24", end:"2026-02-02"}]` (one week by 7 days); bar box moved by `7*px`; after `pointercancel` the bar is back, `data-editing` is null and `calls` is still 1; connector: `data-editing="link"`, a single `{kind:"add", from t1, to t3}`, a `creating` link present then absent after cancel, no second call. Not vacuous.
- [x] Bite: removed `onPointerCancel={onPointerLost}` (Gantt.tsx:1802) -> 6 red (the 2 neutral tests x chromium, firefox, webkit), restored. Neutralized `onPointerLost` with an early `return` -> the same 6 red, restored. `git diff --exit-code` on Gantt.tsx clean after each.
- [ ] Gap (minor): the neutral tests do not assert `pointerType` is recorded as "touch" (plan task 2 lists it). The CDP test does that on Chromium via a page listener. The component does not use pointerType for its logic as far as the tests show, so the practical loss is small.

## Regressions
- [x] No source change, no impact. `yarn lint`: 0 errors (94 pre-existing warnings).

## Findings
- minor — gantt.spec.tsx:756 — the plan asks the neutral test to cover `pointerType` recorded as "touch"; not asserted (the events carry it, nothing reads it back).
- minor — gantt.spec.tsx:96 — the skip reason is generic ("firefox, webkit: ..."); acceptable, engine, reason and #225 are named.

Judgment on the question: replacing real touch input on Firefox and WebKit by synthetic untrusted PointerEvents with a capture shim is acceptable under the story rule. Playwright cannot send a touch move or cancel there; the coverage lost (real capture and implicit release, native pan, `touch-action` taking effect) is named in the comment, partly kept on Chromium by the CDP tests, and traced in #225. The neutral tests still catch cancel and release regressions on all three engines (6 red under mutation). The gain is real layout and each engine's dispatch through React over jsdom.

## Not verified
- Real finger gestures on Firefox and WebKit, pointer capture and its implicit release, and the native pan from the track: not testable here. Gesture for a human: open the Gantt story on an iOS Safari or Android Firefox device, drag a bar by a week, start a drag then trigger a system cancel (incoming notification, palm), pan the chart from an empty track area, drag a connector to another row.
- Linux CI run of the `e2e` job (t07): only macOS run here. Docker not used.
- Artifact line (`not applicable (tests only)`) lives in the PR; not checked.

## Verdict
Max severity: minor
Ship allowed: yes
