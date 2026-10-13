# Research — Story s59-cross-browser-e2e

## The five structuring facts
1. The 13 failures of the first CI run have **seven distinct root causes**, not one: more than the three the story allows, so a split is proposed below. Four are test-side only, two are real component defects, one is a chromium flake of unknown side (see the table).
2. **Two real defects in Gantt**: Firefox adds an unlabelled Tab stop on the scroll box (`packages/ui-components/src/components/gantt/Gantt.tsx:1780`, `div.c__gantt__scroller` with no `tabIndex`), and WebKit ignores the unprefixed `user-select: none` (`gantt/index.scss:270`; `CSS.supports("user-select","none")` is `false` in the installed WebKit, and the library build does no vendor prefixing: `packages/ui-components/vite.config.ts` has no postcss/lightningcss step).
3. **Four tests assume chromium**: `getComputedStyle(...)` returned across `evaluateAll` (`e2e/timeline/timeline.spec.tsx:76`), element screenshots read as 1 bitmap pixel = 1 CSS pixel while Desktop Safari is a device scale factor of 2 (`e2e/gantt/gantt.spec.tsx:50-72`), CDP touch input (`gantt.spec.tsx:618`, `:1538`), and a first `Tab` pressed on a freshly mounted page (`e2e/filter/filter.spec.tsx:52`).
4. The PDF failure (`pdf-preview-mixed-sizes.spec.tsx:159`) is **not an engine failure and not ours**: spec and viewer are byte-identical to `upstream/main` (`git diff upstream/main -- e2e/file-preview src/components/preview` is empty; the file was last touched by `72b3abb4`). It is flaky: 8 failures out of 12 runs locally on chromium, 1 in 3 on the first try.
5. **Local macOS is not the CI**: Playwright WebKit on macOS does not Tab to buttons (`gantt.spec.tsx:214` and `filter.spec.tsx:49` fail locally on webkit), whereas on Linux (the CI) they pass. I reproduced the CI platform with the official image `mcr.microsoft.com/playwright:v1.61.1-noble` (node 24, yarn install about 11 minutes): there `gantt:214` fails on Firefox only (as in CI) and `filter:49` passes on both engines (not reproduced, see open questions).

## Target story
Component tests green on chromium, Firefox and WebKit: each of the 12 failures has an established cause (chromium-only test or real defect) written in the PR; real defect fixed with the failing test kept; chromium-only assumption fixed in the test, never by skip/removal/loosening without engine, reason and traced follow-up; no accessibility regression (s07, s17, s22 to s24 guards); the chromium PDF failure classified against upstream; `e2e` job green on a PR. See `docs/stories.md` (s59), amendment ci-green in `docs/prd.md`.

## Current state of the code
- Specs: `packages/ui-components/e2e/{gantt,timeline,filter,file-preview}/`; helpers `e2e/helpers/mount-*.tsx`. Config `packages/ui-components/playwright.config.ts`: three projects (`Desktop Chrome`, `Desktop Safari`, `Desktop Firefox`), 1280x720, no retries, no `workers` setting.
- Components: `src/components/gantt/` (`Gantt.tsx`, `index.scss`), `timeline`, `filter`, `preview/viewers/pdf-preview/`.
- Only one `test.skip` exists in e2e today (`e2e/file-preview/pdf-preview-scanned.spec.tsx:22`, not ours).

## Causes, per failing test (all reproduced locally unless stated)

| # | Test (engine) | Assertion, expected vs received | Root cause | Side | Where |
|---|---|---|---|---|---|
| A | `timeline.spec.tsx:66` (firefox, webkit) | `first.connector.height` expected `"2px"`, received `undefined` (CI webkit: `Cannot read properties of undefined (reading 'marker')`, line 81) | `evaluateAll` returns `getComputedStyle(el,"::after")` itself (line 76): Playwright serialises own enumerable properties; chromium exposes the longhands as own properties, Firefox and WebKit as prototype accessors, so they are lost. The webkit CI error is the same test running `evaluateAll` before the list rendered (empty array). Neither is a layout defect: with the values read inside the callback and a wait on the first item the test passes on the three engines (verified on a throwaway copy). | test | `timeline.spec.tsx:66-93` |
| B | `gantt.spec.tsx:235` (webkit, CI: all four edge pixels `false`) and `:1028` (webkit, received `[255,255,255]` instead of the link colour) | pixel read at the wrong place | `colorsAt` (`gantt.spec.tsx:50-72`) decodes `locator.screenshot()` and indexes it in CSS pixels; Desktop Safari has a device scale factor 2, so the bitmap is 2464 px wide for a 1232 px box. The ring is drawn correctly (computed `outline: 2px solid rgb(94, 92, 208)` on `::after`, visible on the screenshot). With `screenshot({ scale: "css" })` both tests pass on webkit and still pass on firefox (verified on a throwaway copy). | test | `gantt.spec.tsx:50-72` (used by :235 and :1028) |
| C | `gantt.spec.tsx:214` (firefox) at line 224, `:235` (firefox) at line 244 | row 2 / row 3 expected focused, received inactive | Real defect. Firefox treats a scroll box as keyboard focusable: the Tab order is Day, Week, Month, **`div.c__gantt__scroller`**, then row 2 (probed). The fourth Tab lands on the box, and `ArrowDown` then scrolls it instead of moving row focus. The box has no role or name and the rows already hold the roving stop: the documented behaviour of s22 ("Tab enters on the first row after the zoom buttons") is violated on Firefox. Setting `tabindex="-1"` on the scroller restores the expected order (verified by injecting the attribute). | component | `Gantt.tsx:1780` |
| D | `gantt.spec.tsx:455` (webkit) at line 463 | selection expected `""`, received `"Limit of the chart reached\nTask 3"` | Real defect. During a drag `[data-editing]` sets `user-select: none` (`index.scss:270`), but the installed WebKit does not support the unprefixed property (`getComputedStyle(gantt).userSelect` is `""`, `webkitUserSelect` is `"text"` while `data-editing="move"`; chromium and Firefox return `none`). Real Safari users select text while dragging a bar. Fix: add `-webkit-user-select: none` next to it. Other unprefixed `user-select` in the kit (`button/_base.scss:113`, `select`, `date-picker`, ...) have the same limit: out of scope, listed in the follow-up. | component | `gantt/index.scss:270` |
| E | `gantt.spec.tsx:610` and `:1530` (firefox, webkit) | `browserContext.newCDPSession: CDP session is only available in Chromium` | Test assumption: touch input is driven with `Input.dispatchTouchEvent` through CDP (lines 618 and 1538). Playwright offers no touch-move API on the other engines (`page.touchscreen` only taps). The behaviours asserted are pointer handling (`pointerType` touch, `pointercancel` restore, `touch-action: none` on the bar, `index.scss:296`) and the browser scroll gesture from the track. | test | `gantt.spec.tsx:608-690`, `:1530-1600` |
| F | `filter.spec.tsx:49` (webkit, CI only) | trigger expected focused after one `Tab`, received inactive (`tabindex="0"`, resolved 13 times) | **Not reproduced on the CI platform.** On macOS WebKit the first `Tab` lands on `BODY` (probe: `["BODY","BUTTON","BODY"]`) because Safari skips non-text controls: macOS-only. On the Linux image the test passes on webkit and firefox when run alone. The CI failure is therefore order or parallelism dependent: it is the first test of its file, run on a cold WebKit page where `Tab` is sent right after `mount` (`filter.spec.tsx:51-52`) with no prior focus. Suspicion: page not yet focused when the key arrives. Needs `--repeat-each` under `--workers=2` in the Linux image to establish. | test (suspected) | `filter.spec.tsx:49-55` |
| G | `pdf-preview-mixed-sizes.spec.tsx:159` (chromium, CI) at line 166 | `Current page` expected `11`, received `8` | Flaky, not engine related, **same on upstream** (identical code and spec). Local runs: 1 failure in 3, then 8 in 12; received values are always an earlier page than the target (5 for 8, 2 for 5, 8 for 11, 17 for 1...). The sibling test (`:140-157`) already carries a comment about a keydown/closure race and waits on the input's `size` attribute: I tried the same wait here (throwaway copy): **it does not cure it** (10 failures in 12), so the race is not the Enter-before-commit one. Likely culprit: `scrollToPage` (`PdfPageViewer.tsx:127-158`) computes the offset with the closure's `width` and the fetched dimensions while `width` (debounced resize, `useDebouncedResize`) and the row heights are recomputed after (`:93`), and `currentPage` is derived from the viewport centre (`:105-123`), so a jump may land on a neighbour page. Test or component not established. | undetermined | `PdfPageViewer.tsx:127-158`, spec `:159-199` |

Count of distinct causes: A, B, C, D, E, F, G = 7.

## Anchor points
- Gantt scroller markup `Gantt.tsx:1780`; editing state `data-editing` `Gantt.tsx:1760`; its CSS `index.scss:269-271`; row focus ring `index.scss:124-141`.
- Test helpers to touch: `colorsAt` (`gantt.spec.tsx:50`), the touch blocks, the Timeline `evaluateAll`, Filter first `Tab`.

## Verified APIs / functions
- `locator.screenshot({ scale: "css" })` (Playwright 1.61.1): CSS-pixel bitmap whatever the device scale factor.
- `playwright.config.ts` has no `retries`, `workers`, `fullyParallel`; CI sets none.
- `CSS.supports("user-select","none")`: `true` chromium and firefox, `false` WebKit here; `CSS.supports("-webkit-user-select","none")`: `true` everywhere.

## Traps & constraints
- Gantt, Timeline and Filter guards of s07, s17, s22 to s24 must keep passing; a stylesheet change must keep the chromium computed values (`-webkit-user-select` is additive, `tabindex="-1"` changes no style).
- C and D change a component: one changeset (patch) and the artifact page (`Artifact: updated (version <id>)`), per the repo DoD. The other tickets change specs only: exempt.
- The Gantt `Gantt.spec.tsx` (vitest, jsdom) asserts rows' tabIndex (`:2552`, `:2594`); a scroller `tabIndex` must not break it.
- A local macOS run of the WebKit project differs from the CI (Tab skips buttons): validate keyboard tests in the Linux image. Recipe: `docker run -d --name s59-linux --ipc=host -v <worktree>:/src:ro mcr.microsoft.com/playwright:v1.61.1-noble sleep infinity`, copy the tree without `node_modules` into `/work`, `yarn install --frozen-lockfile --ignore-engines` (about 11 min, keep the container), throwaway `ctPort` config. Image already pulled (2.7 GB).
- Throwaway artefacts I created (all deleted): `playwright.tmp.config.ts`, `e2e/zz-*.spec.tsx`, generated `public/` test assets (git-ignored). `git status` is clean.
- `test.skip` on non-chromium engines for the CDP touch tests is the only skip foreseen, with a neutral replacement for the pointer logic and a traced follow-up (see t05).

## Open questions
- F: what exactly makes the first Tab miss on Linux WebKit in the full run (cold page focus?). To settle in t04 with repeat runs in the Linux image; the fix (focus the page first, or `expect.poll` around `Tab`) follows from it.
- G: test race or component defect in `scrollToPage`/`currentPage` with mixed page sizes. To settle by logging `scrollTop`, `width` and the computed offset around the jump (t06). If it is a component defect, the criterion "left out of this story's fix if upstream also fails" says to leave it; but the `e2e` job cannot pass without it, so the plan fixes it (test side if the race is the test's, component side otherwise) and flags the owner decision in t06.
- E: the owner must accept a documented `test.skip` on firefox and webkit for the two native-touch tests, in exchange for neutral pointer-level coverage on the three engines. Follow-up: issue to open (number into the PR).

## Real complexity
Scored 3 in `docs/stories.md`. After research: **4**. Seven root causes instead of "a few", two real component defects needing a changeset and an artifact update, a platform gap (macOS vs Linux) needing a Linux image to validate, and an inconclusive flake. Estimated 7.5 person-days in 7 tickets.

## Split proposal
Over three causes, so the split the story asks for is proposed, but not required: every ticket below ships on its own into `next`.
- **s59a tests only** (A, B, E, F, G test side): t01, t02, t04, t05, t06 (about 5.5d); closes the Firefox/WebKit test failures and the PDF classification. No changeset, no artifact.
- **s59b real defects** (C, D): t03 (about 1.5d); one patch changeset and the artifact page.
The plan keeps one story (one CI target: `e2e` green) with the tickets ordered so the cheap, independent ones land first; the owner may cut at the line above without re-planning.

---
validated: no
---
