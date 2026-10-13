# Review — Ticket s59-cross-browser-e2e/t02-gantt-pixel-device-scale

> Diff reviewed: `git diff next...feature/s59-cross-browser-e2e/t02-gantt-pixel-device-scale` (1 test line + comment, plan checkboxes).

## Plan compliance
- [x] Code does what the plan specifies, nothing more: `locator.screenshot({ scale: "css" })` plus a comment in `colorsAt`; only the t02 checkboxes ticked in the plan.
- [x] Run interdicts respected: tolerance (`<= 8`) and sampled points untouched, no assertion removed, no skip, no component or stylesheet change, no new dependency, port 27057 from `dm-port.sh`, throwaway config removed.

## Anti-hallucination
- [x] `scale: "css"` is a valid option of Playwright `Locator.screenshot` (the Playwright version is the repo's). The behaviour matches the comment: the points are CSS offsets and Desktop Safari is a 2x device.
- [x] No plausible-but-wrong value: the tests go green on webkit with the same points and tolerance.

## Security
- [x] Not applicable (test-only, no input, no secrets).

## Factorization
- [x] The single helper `colorsAt` is fixed, so every caller benefits (3 callers: lines 261, 1070, 1359).
- [x] No abstraction added.

## Rules compliance
- [x] AGENTS.md followed. No ADR touched. Artifact line not applicable (no component changed), the plan says so.

## Tests
- [x] Run by the reviewer on a built tree, throwaway config, port 27057:
  - chromium: 47/47 passed.
  - webkit: 43 passed, 4 failed (:215, :456, :611, :1531). :236 and :1029 pass. The 4 failures are the other tickets' causes (A/D/E and macOS Tab), none of them t02.
  - firefox: 43 passed, 4 failed (:215, :236, :611, :1531). :236 fails on `toBeFocused` (cause C, t03), expected.
- [x] Assertions pin the acceptance criteria: unchanged from before the ticket.
- [x] Bite proven by neutralization: removed `{ scale: "css" }` (`screenshot()`) -> on webkit :236 and :1029 went red (7 red in total, the others being the 4 known failures plus :996, see the flake note). Restored with `git checkout`, `git diff --exit-code e2e` clean, and the targeted tests (:236, :996, :1029 and a third) re-run 3 times: 12/12 passed. The plan's own mutation (drop the ring colour in SCSS) was not repeated; the scale mutation is the direct proof for this cause.
- [x] No redundant test.

## Regressions
- [x] No impact: chromium fully green (47/47). `colorsAt` is test-only. `yarn lint` passed. `src/cunningham-tokens-sass.scss` restored after the builds, `git status` clean.

## Findings
- minor — the plan says "`:235`/`:1028`" but the lines are now `:236`/`:1029` after the shift; the checkboxes in the plan still quote the old numbers. Cosmetic.
- minor — the implementer's note on the :995 flake is correct, and is out of scope. In the reviewer's runs, the :996 test (the renumbered :995, "rows step by row-height") failed once in the mutated full-suite run and once in a targeted run, then passed 3 times in a row. It does not call `colorsAt` or any screenshot, so it cannot depend on this diff. It deserves a follow-up (a webkit timing flake of the row-step measurement).
- Note — WebKit :215 failing on macOS (Tab does not focus buttons) is a platform trait: it is the subject of t04 (Linux image is the reference). Out of scope for t02, confirmed (it also fails with the ticket's change absent or present, because it doesn't use `colorsAt`).

## Not verified
- The Linux CI image (`mcr.microsoft.com/playwright:v1.61.1-noble`) was not run: results are from macOS only. A human should confirm on the PR's `e2e` job (webkit) that :236 and :1029 are green on Linux, where the device scale factor of Desktop Safari is also 2.
- The plan's SCSS mutation (drop the ring colour) was not run; the scale mutation was used instead.
- Firefox :236 is red by design until t03; its pixel part was not reached on Firefox, so Firefox pixel behaviour is unproven until t03.

## Verdict
Max severity: minor
Ship allowed: yes
