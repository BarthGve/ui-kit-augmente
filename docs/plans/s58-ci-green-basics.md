---
validated: yes
---
# Plan — Story s58-ci-green-basics

Branch: `feature/s58-ci-green-basics` (framing) · ticket: `feature/s58-ci-green-basics/<ticket-id>`
Research: `docs/research/s58-ci-green-basics.md`. No UI story: no design.

## Target story
**As a** fork maintainer **I want** the unit-test and commit-lint jobs of the CI to pass **so that** a red CI means a real problem. Complexity 2, 2 after research.
Acceptance criteria: see `docs/stories.md` (turbo order and clean `yarn test`; `test` and `verify` pass; `lint-git` accepts squash/release commits in both directions; `architecture.md` updated, `AGENTS.md` line listed).

## Tickets (ordered)
### t01-ci-build-order-and-gitlint
- **size:** S
- **estimate:** 1.5d
- **depends on:** none
- **scope:** `turbo.json`, `packages/ui-tokens/package.json` (`test` script), `.gitlint`, `scripts/gitlint-config.test.mjs`, `docs/architecture.md`. Covers all four criteria. One slice: the CI is only green when both fixes are in.

Tasks (test first):
1. [x] Prove the race first (red): on a clean checkout (`rm -rf packages/*/dist`), run `TZ=UTC yarn test` three times with the current config and record the failures (the `Failed to resolve entry for package "@gouvfr-lasuite/ui-tokens"` message) in the PR. Then write `scripts/gitlint-config.test.mjs` (`node --test`, uses `gitlint --config .gitlint --msg-filename` on temp message files, skipped with a visible message when `gitlint` is absent; the CI job `lint-git` installs it, the implementer uses a virtualenv in the scratchpad): (a) a title ending `(#123)` with a body line of 103 characters passes; (b) a title without `(#n)` and a body line of 81 characters is rejected (B1); (c) a normal short commit passes. See (a) red (no `.gitlint` yet, B1 fires).
2. [x] Add `.gitlint` at the root: `[ignore-by-title]` with `regex = .*\(#[0-9]+\)$` and `ignore = all`, keeping the default rules for everything else. (a)–(c) green.
3. [x] `turbo.json`: `test` `dependsOn: ["^build"]`; `packages/ui-tokens/package.json`: `test` script without the internal `yarn build` (with `dependsOn: ["build"]` on the package's own `test` through a `ui-tokens#test` override in `turbo.json`) so that no `test` task rewrites a `dist` that another package reads. Repeat the clean `TZ=UTC yarn test` three times: green each time (record in the PR). Mutation: put `yarn build &&` back, or drop `^build`, and show the race again in a clean checkout (record, revert).
4. [x] Check `yarn test` wall time before and after (record). Run `yarn lint`, `yarn check-locales`, `yarn build`, `node --test scripts/*.test.mjs`.
5. [x] `docs/architecture.md:53` states the CI is active (jobs: lint-git, lint, check-locales, test, build, e2e on chromium/webkit/firefox, storybook, publish-fork dry-run) and that the checks can still be run locally. The `AGENTS.md` lines ("no CI on this fork") are listed in the PR for the owner (git-ignored file).
6. [ ] After merge, re-run the checks of PR #202 (`gh run rerun`) and report the result: `test`, `verify`, `lint-git` expected green; `e2e` stays red until s59 (reported, not hidden). PR line `Artifact: not applicable (CI and scripts only)`.

## US totals
- **Person-days:** 1.5
- **Size mix:** 1×S
- Split needed: no. ADR needed: no.

## Run interdicts
No new dependency; no change to any component, token, story or hook; no secret or permission change in workflows; do not exempt ordinary commits from the line-length rule; do not skip or delete a test to get green; never port 6006; no broad `pkill`.

## Files touched
`turbo.json`, `packages/ui-tokens/package.json`, `.gitlint`, `scripts/gitlint-config.test.mjs`, `docs/architecture.md`.

## Test strategy
`node --test` with `gitlint` for the commit-lint rule (two cases and a normal one); three clean-checkout `yarn test` runs before and after for the race; the CI itself on the pull request is the final proof.

## Definition of Done
Single PR into `next`, lint, check-locales, tests and build green locally, `test`/`verify`/`lint-git` green in CI, review `Ship allowed: yes`, merged.
