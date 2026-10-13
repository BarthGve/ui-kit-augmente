# Review s59-cross-browser-e2e / t07-e2e-job-green

Diff: `git diff next...feature/s59-cross-browser-e2e/t07-e2e-job-green` (PR #227). Reviewer: fresh-context `reviewer` subagent.

## Checked
- eslint on `gantt.spec.tsx` and `pdf-preview-mixed-sizes.spec.tsx`: clean. Vitest and local Playwright not run (specs and docs only; local macOS WebKit is not the CI).
- No import added; the queries reuse names already in the specs.
- Accessibility not weakened: the specs gain only `await expect(...)` waits (+11 lines, 0 deleted). No assertion value or tolerance changed; the two 10000 ms are wait budgets.
- `docs/architecture.md` claims true: two Chromium-only `test.skip` (`gantt.spec.tsx:675`, `:1642`, `CDP_TOUCH_ONLY`, follow-up #225); image `mcr.microsoft.com/playwright:v1.61.1-noble` and recipe in `docs/research/s59-cross-browser-e2e.md`; all jobs on `ubuntu-latest`; chromium, webkit and firefox installed.
- Plan task 1: run 38444824780, attempt 4 (initial + 3 reruns), `e2e` success each time; the PR comment lists the `test.skip`. Plan tasks 1-3 ticked.
- PR body carries `Artifact: not applicable (CI and specs only)` (confirmed by the main context).
- Board gate: `require-ready` rejects `In Progress` (capitalised, the Project's real option name) against the script's `in progress`; the ticket is in progress, review run anyway.

## Findings
- minor: residual spec fixes (11 lines) sit in t07 instead of going back to t06 / t04; the plan allows residual fixes, the PR discloses it.
- minor: CI proof was made on `fcb82f1f`; HEAD `62cd90b5` only ticks the plan.
- minor: `templates/review-checklist.md` is absent from the worktree (`templates/` untracked); checklist filled inline by the reviewer.
- minor (resolved): Artifact line wording verified exact.

## Not verified
- Root cause of the PDF flake not reproduced locally; evidence is the CI failure and the passing run + 3 reruns.
- Rerun `e2e` once on `next` after merge.

Max severity: minor
Ship allowed: yes
