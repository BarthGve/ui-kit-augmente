---
validated: yes
---
# Plan — Story s59-cross-browser-e2e

Branch: `feature/s59-cross-browser-e2e` (framing) · tickets: `feature/s59-cross-browser-e2e/<ticket-id>`
Research: `docs/research/s59-cross-browser-e2e.md` — read it first; this plan does not repeat it. No UI story: no design.

## Target story
**As a** fork maintainer **I want** the component tests to pass on chromium, Firefox and WebKit **so that** the delivered components are proven in the three engines. Complexity 3, 4 after research (seven root causes).
Acceptance criteria: see `docs/stories.md` (cause of each of the 12 failures written in the PR; real defect fixed in the component with the failing test kept, chromium-only assumption fixed in the test, never skip/remove/loosen without engine, reason and traced follow-up; no accessibility regression; the PDF failure classified against `upstream/main`; `e2e` job green on a PR).

## Tickets (ordered)
### t01-timeline-connector-geometry
- **size:** XS
- **estimate:** 0.5d
- **depends on:** none
- **scope:** `e2e/timeline/timeline.spec.tsx` only (cause A, `:66`, firefox and webkit).

Tasks (test first):
1. [x] Reproduce red on firefox and webkit (`undefined` connector height; empty geometry) with a throwaway config on the port of `bash .dm/lib/dm-port.sh`; record in the PR.
2. [x] Read the pseudo-element longhands inside the `evaluateAll` callback (return plain `{ width, height, content }`) and wait for the first `listitem` to be visible before measuring. Assertions (24px, 2px, 192px, connector width, last `content: none`) unchanged.
3. [x] Green on the three engines, three runs each; mutation: change the connector height in `timeline` SCSS to 3px locally and see the test fail on the three engines (revert).

### t02-gantt-pixel-device-scale
- **size:** XS
- **estimate:** 0.5d
- **depends on:** none
- **scope:** `colorsAt` in `e2e/gantt/gantt.spec.tsx` (cause B: `:235` and `:1028` on webkit).

Tasks (test first):
1. [x] Red on webkit (ring edge pixels `false`, link pixel white); record that Desktop Safari is a 2x device.
2. [x] `locator.screenshot({ scale: "css" })` in `colorsAt`; a short comment says why. No tolerance widened (`<= 8` stays), no point moved.
3. [x] Green on webkit and firefox, still green on chromium. Mutation: drop the ring colour in `index.scss` locally, see `:235` fail on webkit (revert).

### t03-gantt-engine-defects
- **size:** S
- **estimate:** 1.5d
- **depends on:** none
- **scope:** `packages/ui-components/src/components/gantt/Gantt.tsx` (scroller `tabIndex={-1}`), `gantt/index.scss` (`-webkit-user-select: none`), `Gantt.spec.tsx` (vitest, scroller attribute), one changeset (patch), the design-system artifact page for Gantt (causes C and D, Firefox `:214`, `:235`; WebKit `:455`).

Tasks (test first):
1. [ ] Red: record on the Linux image (or locally for Firefox and WebKit) the Firefox Tab order `Day, Week, Month, scroller, row` and the WebKit selection `"Limit of the chart reached\nTask 3"` / `webkitUserSelect: "text"` during `data-editing`. The existing e2e tests `:214`, `:235`, `:455` are the failing tests and are kept unchanged. Add a vitest assertion that the scroller has `tabindex="-1"` and the rows keep the roving `tabIndex` (0 on one, -1 on the others).
2. [ ] `Gantt.tsx:1780`: `tabIndex={-1}` on `.c__gantt__scroller` (no role, no label added; the row stays the Tab stop). `index.scss:269-271`: add `-webkit-user-select: none` before `user-select: none` in `&[data-editing]`.
3. [ ] Green on the three engines for `:214`, `:235`, `:455`; the guards "no ring after a mouse click", the forced-colors tests, the s22 to s24 keyboard guards and `Gantt.spec.tsx` still pass. Check by hand that a click on the box still scrolls with the wheel and that arrow keys on a focused row still move row focus (no keyboard regression: scroll by keyboard stays available through the rows' own handlers; if a measured regression appears, stop and report instead of patching around it).
4. [ ] Chromium computed values unchanged (`getComputedStyle` of the scroller and of `[data-editing]` before and after, recorded). `yarn lint`, `yarn check-locales`, `yarn test`, `yarn build`.
5. [ ] `yarn changeset` (patch, `@gouvfr-lasuite/ui-components`). Artifact page: Gantt page updated (keyboard section mentions the scroller is not a Tab stop; WebKit selection note); republish after re-reading the index; PR line `Artifact: updated (version <id>)`. The other unprefixed `user-select` of the kit (`button/_base.scss:113`, `select`, `date-picker`, image viewer, quick-search, tree-view example) are listed in the PR as follow-up, not touched.

### t04-filter-webkit-first-tab
- **size:** S
- **estimate:** 1d
- **depends on:** none
- **scope:** `e2e/filter/filter.spec.tsx` (cause F, `:49` webkit), possibly a shared helper in `e2e/helpers/` if the same first-Tab pattern appears in other specs.

Tasks (test first):
1. [ ] Reproduce in the Linux image (`mcr.microsoft.com/playwright:v1.61.1-noble`, container kept alive; recipe in the research): `--project=webkit --repeat-each=20 --workers=2` on the whole `filter.spec.tsx`; record the failure rate with the current spec. If it never fails, run the complete e2e suite in the image with the CI worker count and record it. If still not reproduced, stop and report the evidence (this is the only task allowed to end in "cannot reproduce").
2. [ ] Fix browser-neutrally without hiding the keyboard path: make the page focused before the first `Tab` (e.g. `page.bringToFront()` / focus the document body first) or wrap the `Tab` in `expect.poll`/retry on `:focus`, whichever the repeat runs show to be stable. The assertions (`toBeFocused`, outline `solid` `2px`) stay.
3. [ ] 20 repeats x 2 workers green on webkit and firefox in the image; chromium green locally. Note in the PR that the local macOS WebKit project fails these Tab tests by platform (Safari does not Tab to buttons) and that the Linux image is the reference.

### t05-gantt-touch-neutral
- **size:** M
- **estimate:** 2d
- **depends on:** none
- **scope:** `e2e/gantt/gantt.spec.tsx` (cause E, `:610` and `:1530`, firefox and webkit); a follow-up issue.

Tasks (test first):
1. [ ] Red: the four failures (`newCDPSession` only in Chromium). Keep both CDP tests untouched for chromium (real touch input) and gate them with `test.skip(browserName !== "chromium", "<reason>")`: engine = firefox and webkit, reason = Playwright exposes no touch-move/cancel input outside Chromium (CDP `Input.dispatchTouchEvent`), follow-up = the issue opened in task 4. No other skip.
2. [ ] Write, for the three engines, the browser-neutral counterpart of each: dispatch `PointerEvent`s with `pointerType: "touch"`, `isPrimary: true` (`pointerdown`, `pointermove` x N, `pointerup` and `pointercancel`) on the bar / connector through `page.evaluate`, asserting the same outcomes as the CDP tests: bar moved by whole weeks and `onTaskChange` payload, `data-editing` set during the drag, `pointerType` recorded as `"touch"`, a `pointercancel` restores the bar and reports nothing, connector dragged to another row reports one dependency, a cancelled one reports none. The "box scrolls from the track" step is the browser's own pan gesture: assert instead the contract that makes it possible on the three engines (`touch-action` of the track is not `none`, of a bar is `none`, `index.scss:296`), and say so in a comment.
3. [ ] Mutation: remove the `onPointerCancel` handler (`Gantt.tsx:1801`) locally and see the new cancel test fail on the three engines (revert).
4. [ ] Open a follow-up issue "native touch e2e for Gantt on Firefox and WebKit" and write its number in the skip reasons and in the PR; the PR lists the number of skips (2).

### t06-pdf-mixed-sizes-flake
- **size:** S
- **estimate:** 1.5d
- **depends on:** none
- **scope:** `e2e/file-preview/pdf-preview-mixed-sizes.spec.tsx:159` and, only if the investigation proves it, `src/components/preview/viewers/pdf-preview/PdfPageViewer.tsx` (cause G, chromium).

Tasks (test first):
1. [ ] Record the classification in the PR: spec and viewer identical to `upstream/main` (`git diff upstream/main -- packages/ui-components/e2e/file-preview packages/ui-components/src/components/preview` empty, `git log` shows only `72b3abb4`), flaky locally (8 failures in 12 on chromium, received value always an earlier page). Run the same spec in a checkout of `upstream/main` (12 repeats) and record it; if upstream is as flaky, the failure is upstream's and the evidence goes in the PR.
2. [ ] Find the cause (time-box 1d): log `scrollTop`, `width`, the offset computed in `scrollToPage` and `currentPage` around each jump (`PdfPageViewer.tsx:127-158`, `:105-123`). Decide: (a) test race (input value flips back when `currentPage` is recomputed from the viewport centre after row heights settle), fix in the spec by waiting for scroll to settle and asserting the rendered page, not the input, per jump; or (b) component defect (stale `width` or heights in the jump), fix in `PdfPageViewer.tsx` with the failing test kept, plus changeset and artifact page for the preview component.
3. [ ] 12 repeats x 1 worker, then 2 workers, green on chromium; webkit and firefox run too and recorded. Owner flag in the PR: the story criterion says "left out of this story's fix if upstream also fails"; this ticket fixes it anyway because the `e2e` job cannot pass without it. If the owner prefers to leave it out, drop this ticket and the `e2e` job stays red on this single flaky test.

### t07-e2e-job-green
- **size:** XS
- **estimate:** 0.5d
- **depends on:** t01, t02, t03, t04, t05, t06
- **scope:** verification only, no code (unless a residual failure appears, in which case it goes back to the owning ticket).

Tasks:
1. [ ] After the last merge, open (or use) a PR into `next`; the `e2e` job (chromium, webkit, firefox) passes; rerun it three times (`gh run rerun`) and record the results; list the two `test.skip` with engine, reason and follow-up number.
2. [ ] Confirm no accessibility test was weakened: list, per ticket, the spec lines changed and that no assertion value or tolerance changed (diff reviewed).
3. [ ] Update `docs/architecture.md` line on e2e (CI runs the three engines; macOS WebKit differs, the Linux image recipe). PR line `Artifact: not applicable (CI and specs only)`.

## US totals
- **Person-days:** 7.5 (0.5 + 0.5 + 1.5 + 1 + 2 + 1.5 + 0.5)
- **Size mix:** 3×XS (t01, t02, t07), 3×S (t03, t04, t06), 1×M (t05)
- Split needed: optional (research, "Split proposal": s59a tests only t01 t02 t04 t05 t06, s59b real defects t03). ADR needed: no (no new dependency).

## Run interdicts
No new dependency; no tolerance or threshold widened, no assertion removed or weakened to get green; no `test.skip`/`test.fixme` other than the two in t05, each naming the engine, the reason and the follow-up number; no chromium computed-value change in a stylesheet; no change to the Gantt, Timeline, Filter or preview behaviour beyond the two defects of t03 (and t06 only if proved a component defect); no accessibility guard of s07, s17, s22 to s24 touched; never port 3000/5173/6006/8080 (port from `bash .dm/lib/dm-port.sh`); no broad `pkill`; throwaway Playwright config and Docker container never committed, removed at the end; never edit generated files (`src/cunningham-tokens.*`).

## The point everything turns on
Fix each failure at its real cause and on the right side: the two engine defects in the component (Firefox scroller Tab stop, WebKit `user-select` prefix), the chromium-only assumptions in the tests with a browser-neutral assertion that keeps the same expectation; reproduce keyboard behaviour on Linux (the CI platform), not on macOS WebKit.

## Files touched
- t01: `e2e/timeline/timeline.spec.tsx`. t02: `e2e/gantt/gantt.spec.tsx` (`colorsAt`).
- t03: `src/components/gantt/Gantt.tsx`, `src/components/gantt/index.scss`, `src/components/gantt/Gantt.spec.tsx`, `.changeset/*.md`, artifact page (Gantt).
- t04: `e2e/filter/filter.spec.tsx` (+ `e2e/helpers/` if shared).
- t05: `e2e/gantt/gantt.spec.tsx`.
- t06: `e2e/file-preview/pdf-preview-mixed-sizes.spec.tsx` (+ `PdfPageViewer.tsx`, changeset, artifact only if a component defect).
- t07: `docs/architecture.md`.
(All paths under `packages/ui-components/` except changeset and docs.)

## Test strategy
Each ticket is test-first at the Playwright component level, red then green on the engine that failed, mutation where a behaviour is asserted (t01, t02, t05). Vitest (jsdom) for the scroller attribute (t03). Keyboard and flake claims are proven in the Linux Playwright image with `--repeat-each` and CI's worker count; the CI `e2e` job on a PR is the final proof (t07).

## Definition of Done
Per ticket: single PR into `next`, structured description with the cause of each failure fixed, `yarn lint`, `yarn check-locales`, `yarn test`, `yarn build` green, review `Ship allowed: yes`, merged. t03 (and t06 if it touches the component): one changeset and `Artifact: updated (version <id>)`. Story: `e2e` job green three times on a PR, skips listed with engine, reason and follow-up.
