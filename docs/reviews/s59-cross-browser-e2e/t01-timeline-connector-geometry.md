# Review — Ticket s59-cross-browser-e2e/t01-timeline-connector-geometry

> Diff reviewed: `git diff next...feature/s59-cross-browser-e2e/t01-timeline-connector-geometry`

## Plan compliance
- [x] The code does what the plan specifies, nothing more (only `e2e/timeline/timeline.spec.tsx` plus plan checkboxes)
- [x] Run interdicts respected: no new dependency, no assertion weakened or removed, no tolerance widened, no skip, no chromium CSS change, no port 3000/5173/6006/8080 (port 24003), throwaway config removed, generated files restored

## Anti-hallucination
- [x] No invented API: `getComputedStyle(el, "::after")`, `.width/.height/.content`, `expect(locator).toBeVisible()` all exist
- [x] No plausible-but-wrong value: 24px, "2px", >=192, connector width ~ gap between markers, `content` "none" on last item are all unchanged
- [x] Code matches its comment (longhands read in-page, plain strings returned)

## Security
- [x] Not applicable (test-only change): no injection, authz, secrets, IDOR, XSS or logs

## Factorization
- [x] No duplicated rule, no abstraction added

## Rules compliance
- [x] AGENTS.md conventions followed; no ADR contradicted; no design-system impact (no UI change)

## Tests
- [x] Run by the reviewer after `yarn build`, throwaway config, port 24003. Timeline CT: chromium 3/3, firefox 4/4 (incl. :66), webkit 3/4. The `:66` geometry test is green on all three engines.
- [x] Not vacuous: `height` undefined fails `toBe("2px")`; empty `width` gives NaN and fails `toBeCloseTo`; an empty list is excluded by the `toBeVisible()` wait, and `first`/`second` undefined would throw.
- [x] Bite proven by neutralization: horizontal connector `block-size` set to 3px in `src/components/timeline/index.scss` (`playwright/.cache` removed before) -> `:66` red on chromium, firefox and webkit (3/3, "Expected 2px, Received 3px"). Restored; `git diff --exit-code` clean.
- [x] No redundant test.

## Regressions
- [x] None: only the one test body changed. `yarn lint` 0 errors (94 pre-existing warnings). Working tree clean after build (`cunningham-tokens-sass.scss` restored).

## Findings
- none blocking. Out of scope, reported honestly: `timeline.spec.tsx:41` (Tab / ArrowRight scroll) fails on webkit on macOS (scrollLeft stays 0), pre-existing and not touched by this diff; the Linux-image verification belongs to the story's CI proof (t07).

## Not verified
- Linux CI behaviour (Playwright Linux image, CI worker count); only macOS engines were run. Gesture: open the PR's `e2e` job and check `:66` on chromium, firefox, webkit.
- "Three runs each" and the pre-fix red reproduction recorded in the PR were not replayed (one green run per engine here, plus the mutation).
- `:41` on webkit: a human should press Tab then ArrowRight on a horizontal Timeline in Safari to see whether it is a real scroll defect or a macOS keyboard-focus artefact.

## Verdict
Max severity: none
Ship allowed: yes
