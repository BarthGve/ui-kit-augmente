# Component tests green on Chromium, Firefox and WebKit — `s59-cross-browser-e2e`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

The delivered components are proven in the three browser engines. The CI `e2e` job runs the Playwright component tests on Chromium, Firefox and WebKit, and it passes on pull requests into `next`.

## What changed

- The Timeline connector geometry and the Gantt pixel checks are read in CSS pixels, so they give the same result in every engine and at any device scale.
- Gantt: the scroller no longer takes a Tab stop, and `user-select` is prefixed for WebKit.
- The Filter and Gantt keyboard tests wait for the first focusable element before sending the first Tab.
- The PDF preview tests wait for each page jump to land before the next one.
- The Gantt touch tests have a neutral pointer version that runs on all three engines.

## Visible rules

- No test was skipped, removed or loosened to get the job green. The only `test.skip` calls are the two Gantt touch tests (touch move and cancel need the Chromium protocol, follow-up #225) and the scanned-PDF visual golden (Chromium only, before this story).
- CI runs on Linux. A local macOS WebKit run differs (Tab skips native buttons), so keyboard and flake checks are reproduced in the Linux Playwright image described in `docs/architecture.md`.

## Known limits

- Two tests outside this story are still unstable on some runs: the WebKit "click beside a page closes the preview" test and a table-sort Vitest test. Rerun the job.

## Out of scope

- Touch move and cancel tests on Firefox and WebKit (#225).
- New components or any change to a component's public behaviour.
