# Review — Ticket s59-cross-browser-e2e/t06-pdf-mixed-sizes-flake

> Diff reviewed: `git diff next...feature/s59-cross-browser-e2e/t06-pdf-mixed-sizes-flake`

## Plan compliance
- [x] Spec-only fix (option (a) of task 2); `PdfPageViewer.tsx` untouched, so no changeset or artifact is needed. The diff is 5 lines in the spec (1 assertion + 4 comment lines) plus the plan checkboxes ticked.
- [x] Run interdicts: no dependency, no assertion removed or weakened (`toHaveValue(String(p))` with the same 5000 ms kept, one stricter wait added), no skip, no component change, no generated file, no tolerance changed. The throwaway config was removed, the port came from dm-port.sh (23502), and no broad pkill was used.

## Anti-hallucination
- [x] `toBeInViewport` is a Playwright locator assertion (supported by the installed version, it ran). `getRenderedPage` exists at spec line 16.
- [x] Cause matches the code. `PdfPageViewer` derives `currentPage` from `scrollTop` (centre of the viewport) and calls `onCurrentPageChange` in an effect. Jumps are asynchronous (`ensurePageDimensions(...).then(scrollToPosition)`). The old `toHaveValue(p)` passed on the value written synchronously by goToPage, so the next `fill()` could be overwritten when the previous jump's scroll sync landed. Waiting for the target page to be in the viewport removes that window. Evidence: the old spec on `next` failed 4 of 12 repeats (virtual-list test, chromium); the new spec passed 20 of 20.
- [x] The test still checks its title: the loop only synchronises, and the total height versus the sum of per-page heights assertion that follows is untouched.

## Security
- [x] Not applicable (test file only). No injection, authz, secrets, IDOR, XSS or logs involved.

## Factorization
- [x] Reuses `getRenderedPage`; nothing duplicated. No speculative abstraction.

## Rules compliance
- [x] AGENTS.md followed (gitmoji and one commit are the ship stage's job). No ADR touched. No UI.

## Tests
- [x] Run by the reviewer on chromium with a throwaway config: spec x20 repeats, 1 worker: 120/120 green. Virtual-list test x10, 2 workers: 10/10 green. Firefox and webkit, once: 12/12 green. `yarn lint` green.
- [x] Assertions pin the criterion (the viewport wait is a behavioural assertion; the value check is kept).
- [x] Bite proven by neutralization: in `PdfPageViewer.tsx` the `listRef.current.scrollToPosition(offset)` call in `scrollToPage` was replaced by a comment, giving 4 of 6 tests red, including the new `toBeInViewport` failure in the virtual-list test. Restored: `git diff --exit-code` clean. I also ran the old spec from `next` against the unmutated component: 4 red of 12, which shows the old spec was racy and the new one is not.
- [x] No test made redundant.

## Regressions
- [x] None: only the spec changed. Component and fixtures are identical (`git diff upstream/main` on the touched paths is limited to these 5 spec lines).

## Findings
- minor (accepted) — plan task 1: upstream/main was not run in a separate checkout (no extra worktree allowed). Relying on the empty `git diff upstream/main` for the spec and viewer (before this change) is acceptable: identical code means identical behaviour, and the old spec reproduced the flake here at 4/12. The PR should state this explicitly and carry the owner flag from task 3.
- minor — the comment says the sync "of this jump" overwrites the next fill; accurate enough, no change needed.

## Not verified
- Linux CI (the Docker image) was not reproduced: runs were macOS, so the CI worker count and slow-runner timings are unconfirmed. The human gesture is to watch the `e2e` job across three reruns (t07).
- Webkit and firefox were run once each, not repeated 20 times.
- `yarn build` was not rerun (not needed for component tests, which use the Vite dev server); `yarn test` and `yarn check-locales` were not rerun (spec-only change).
- The "Artifact: not applicable (tests only)" PR line is added by the main agent.

## Verdict
Max severity: minor
Ship allowed: yes
