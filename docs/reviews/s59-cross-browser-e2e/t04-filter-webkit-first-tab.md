# Review — Ticket s59-cross-browser-e2e/t04-filter-webkit-first-tab

> Diff reviewed: `git diff next...feature/s59-cross-browser-e2e/t04-filter-webkit-first-tab`

## Plan compliance
- [x] The code does what the plan specifies, nothing more: 3 added lines in each of two specs (`await expect(trigger).toBeVisible()` + comment) and the plan's task boxes ticked. Plan task 2 allowed "wait/retry"; waiting for the trigger is a valid variant. Extending to `search-filter.spec.tsx` is beyond the plan's literal scope (`filter.spec.tsx`) but the plan allows the same first-Tab pattern elsewhere; same one-line change, justified.
- [x] Run interdicts respected: no assertion removed or weakened (toBeFocused, outline solid/2px intact), no skip, no new dependency, no component change, no generated file touched, throwaway config removed (git status clean).

## Anti-hallucination
- [x] No invented API: `expect(locator).toBeVisible()` is standard; `expect`, `trigger`, `outline` already in scope.
- [x] No plausible-but-wrong logic. Local evidence supports the cause (see Tests).
- [x] Comment matches behaviour. Note: the implementer's claim that "WebKit/macOS never Tabs to buttons" is wrong for Filter is CONFIRMED: Filter's trigger has explicit `tabindex="0"` (Filter.spec.tsx:97), and Filter focus tests pass on local macOS WebKit with the fix. It is true for SearchFilter's native button (237 and 250 fail on macOS WebKit).

## Security
- [x] N/A (test-only): no injection, authz, secrets, IDOR, XSS or logs concern.

## Factorization
- [x] Same two-line pattern in two specs; no helper warranted yet (2 uses, one-liner). Acceptable.
- [x] No speculative abstraction.

## Rules compliance
- [x] AGENTS.md followed (tests only, no changeset needed, artifact line "not applicable (tests only)" to be added by the main agent in the PR).
- [x] No accepted ADR contradicted.
- [x] Design system: not concerned.

## Tests
- [x] Suite run by the reviewer (throwaway config, port 21772 from dm-port.sh, after `yarn build`; `src/cunningham-tokens-sass.scss` restored): `e2e/filter` + `e2e/search-filter` on chromium/firefox/webkit: 109 passed, 2 failed, both webkit/macOS SearchFilter (237 native button not tabbable; 250 mouse-down does not focus a native button in Safari). Platform reasons, out of scope, to be reported in the PR.
- [x] `e2e/filter` x3 engines `--repeat-each=10 --workers=2`: 600 passed, 0 failed. The same spec taken from `next` (without the fix), webkit, 10 repeats x 2 workers: several failures at :49 (151 passed, some failed), so the race is reproduced locally on macOS WebKit and the fix removes it.
- [x] Assertions pin the contract (focus + 2px solid outline); none weakened.
- [x] Bite proven by neutralization: renamed `&:focus-visible` to `&:focus-visibleX` in `src/components/filter/index.scss` (playwright/.cache cleared) -> 7 tests red (focus-ring tests on chromium, firefox, webkit for Filter and SearchFilter, incl. the known webkit 250), restored via `git checkout`, `git diff --exit-code src` clean, cache cleared.
- [x] No test made redundant.

## Regressions
- [x] None: no production code touched.

## Findings
- minor — e2e/search-filter/search-filter.spec.tsx:237/250 — fail on macOS WebKit by platform (native button); CI Linux image is the reference. Out of scope, to mention in the PR.
- minor — e2e/search-filter/search-filter.spec.tsx:247 — a separate race seen once on Chromium in CI; not touched by this ticket, to be tracked.
- minor — docs/plans: the research note "WebKit/macOS never Tabs to buttons" is inaccurate for Filter (explicit tabindex); worth a correction in the PR/research.

## Not verified
- Linux image `mcr.microsoft.com/playwright:v1.61.1-noble` (the CI platform and the claimed 12/12 failure rate): Docker did not answer in time, so not run. Human gesture: run `--project=webkit --repeat-each=20 --workers=2` on `e2e/filter` and `e2e/search-filter` in the image, or rerun the CI e2e job several times.
- The claim "trigger absent at Tab time" was not observed directly; inferred from the macOS repro before/after.
- Whole e2e suite not run, only the two specs.

## Verdict
Max severity: minor
Ship allowed: yes
