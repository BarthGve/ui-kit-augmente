---
validated: yes
---
# Plan — Story s56-publish-fork

Branch: `feature/s56-publish-fork` (framing) · tickets: `feature/s56-publish-fork/<ticket-id>`
Research: `docs/research/s56-publish-fork.md`. Decisions: `docs/decisions/005-publish-the-fork-on-npm.md`. No UI story: no design.

## Target story
**As a** fork owner **I want** `ui-components` published on npm under my scope **so that** any project installs the fork with a version. Complexity 3, 3 after research (the workflow cannot run until the owner enables Actions).
Acceptance criteria: see `docs/stories.md` (AC1 staging script, AC2 pack-and-install check, AC3 package contents, AC4 `baseBranch`, AC5 workflow, AC6 `RELEASING.md` and trap lines).

## Tickets (ordered)
### t01-stage-fork-package
- **size:** M
- **estimate:** 1.5d
- **depends on:** none
- **scope:** `scripts/stage-fork-package.mjs`, `scripts/check-fork-package.mjs`, `scripts/fork-package.test.mjs`, root script entries. Covers AC1, AC2, AC3.

Tasks (test-first):
1. [x] `scripts/fork-package.test.mjs` first (`node --test`), see it fail: (a) the stage script given `1.3.0-fork.1` writes `<tmp>/package.json` with `name` `@barthgve/ui-components`, `version` `1.3.0-fork.1`, a `repository` object and the same `exports`, `files`, `dependencies` and `peerDependencies` as the source; (b) the source `package.json` is byte-identical afterwards; (c) refused with a non-zero exit and a message: `1.3.0` (no suffix), `1.3.0-fork.0`, `1.3.0-fork.x`, `1.4.0-fork.1` (base differs from the current version), `abc`; (d) refused when `dist` is missing; (e) the printed last line is the path of an existing `.tgz` whose listing (`npm pack --dry-run --json`) has only paths under `dist/` plus `package.json`, `README.md`, `LICENSE`; (f) `@gouvfr-lasuite/ui-tokens` stays in `dependencies` at `3.2.0`. Use a fake package folder with a stub `dist` for (a)–(f) so the test needs no build.
2. [x] Implement `scripts/stage-fork-package.mjs` (Node stdlib only; arguments: version, optional `--scope` default `@barthgve`, optional `--package-dir`, `--out`): copy `package.json` and `dist`, `README.md`, `LICENSE` to a temp staging folder, rewrite `name` and `version`, add `repository` with `directory`, run `npm pack`, print the archive path as the last line. Tests (a)–(f) green.
3. [x] `scripts/check-fork-package.mjs`: given an archive path and the version, create a temp project, `npm install --ignore-scripts --no-audit --no-fund` of `@gouvfr-lasuite/ui-components@npm:<archive>`-style alias (the archive installed under the upstream key), then assert: the installed manifest says `@barthgve/ui-components` and the version; each `exports` entry of the installed manifest resolves with `import.meta.resolve` (`.`, `./icons`, `./style`, fonts) to an existing file; `@gouvfr-lasuite/ui-tokens` is installed at `3.2.0`. Prints one line per check, non-zero exit on the first failure. Add a test with a deliberately broken archive (an `exports` entry pointing to a missing file) that must fail (network needed: mark it skipped with a clear message when `npm ping` fails, and say so in the PR).
4. [x] Mutations, each reverted and recorded in the PR: skip the base-version check, rewrite `name` in the source file, add a file outside `dist` to the pack list, drop `dependencies`, break an `exports` path: each red.
5. [x] Root `package.json` scripts `fork:stage` and `fork:check` (thin wrappers). Run a real local pass on a built package (`yarn build`, stage with `1.3.0-fork.1`, check) and write the result in the PR; no changeset (no change to the package source). `yarn lint`, `yarn check-locales`, `yarn test`, `yarn build`. PR line `Artifact: not applicable (scripts only)`.

### t02-publish-fork-workflow
- **size:** M
- **estimate:** 1.5d
- **depends on:** t01-stage-fork-package
- **scope:** `.github/workflows/publish-fork.yml`, `.changeset/config.json`, `docs/RELEASING.md`, `docs/architecture.md`, `AGENTS.md` trap line. Covers AC4, AC5, AC6.

Tasks:
1. [x] Workflow test first: a `node --test` file `scripts/publish-fork-workflow.test.mjs` that parses the workflow YAML text (no dependency: line checks) and fails today: triggers are `push` tags `fork@*` and `pull_request`; the publish job has `if` on the tag ref and never on `pull_request`; `permissions` on the pull-request job have no `id-token`; no `secrets.` reference outside the tag job; `fetch-depth: 0`; a step runs `git merge-base --is-ancestor` against `origin/main`; the tag version is extracted and passed to `scripts/stage-fork-package.mjs`; `npm publish` carries `--provenance` and `--access public`; the artifact upload step exists in the pull-request job. Red first.
2. [x] Write `.github/workflows/publish-fork.yml` (Node `24.x`, `actions/checkout@v6`, reusing the install workflow cache, `yarn lint`, `yarn test`, `yarn build`, stage, check, upload artifact on PR; on tag: ancestor check, then `npm publish <archive> --provenance --access public`). The test turns green.
3. [x] `.changeset/config.json` `baseBranch: "next"` (a test line in the same file asserts it); `docs/RELEASING.md` header; `docs/architecture.md:45` and the `AGENTS.md` trap line rewritten; keep the doc changes minimal. *(Done except the `AGENTS.md` trap line: `AGENTS.md` is untracked, ignored by `.gitignore:90`, so no ticket can commit it; the owner edits it in the base directory.)*
4. [x] Local dry-run of the workflow steps in a shell script run by hand (version `1.3.0-fork.1`: lint skipped, stage + check on a built package) and the result written in the PR. Mutations (reverted, recorded): `id-token` in the PR job, a secret in the PR job, remove the ancestor check, drop `--provenance`, trigger on all tags: each red.
5. [x] Owner checklist in the PR (not executed by the agent): enable GitHub Actions (also activates `main.yml`), confirm the `@barthgve` npm scope, create the `NPM_TOKEN` secret, create the first tag `fork@1.3.0-fork.1` on `main`, check the first run. `yarn lint`, `yarn check-locales`, `yarn test`. PR line `Artifact: not applicable (CI and scripts only)`.

Owner checklist (t02, not executed by the agent):
- [ ] Enable GitHub Actions on the repository; this also activates `main.yml` (lint, locales, tests, build, e2e on chromium, webkit and firefox, storybook) on every pull request.
- [ ] Confirm the npm scope `@barthgve` exists and belongs to the owner (`npm whoami`, `npm org ls barthgve` or the npm website); a different scope is a one-line change of the `--scope` default in `scripts/stage-fork-package.mjs`.
- [ ] Create an npm granular access token with read and write on the `@barthgve` packages and 2FA bypass for publishing (classic automation tokens no longer exist), store it as the repository secret `NPM_TOKEN`, and note its expiry: write tokens expire (90 days at most), so renew the secret before it lapses.
- [ ] Harden the publication (recommended): a tag ruleset restricting who may create `fork@*` tags, or a GitHub Environment with required reviewers on the `publish` job holding `NPM_TOKEN`. The workflow runs from the tagged commit, so a writer could otherwise edit it on a branch and tag that branch.
- [ ] Edit the `AGENTS.md` trap line in the base directory (the file is git-ignored, no ticket can commit it): `.changeset/config.json` now has `baseBranch: "next"`.
- [ ] Create and push the first tag `fork@1.3.0-fork.1` on a commit of `main` (after the release `next` -> `main` carrying this workflow).
- [ ] Check the first run: `verify` green, the ancestor-of-`main` step passed, `publish` succeeded, the version is under the `latest` dist-tag, and the provenance badge appears on the npm page (provenance from a downloaded archive is not verifiable locally).

## US totals
- **Person-days:** 3.0 (1.5 + 1.5)
- **Size mix:** 2×M
- Split needed: no. ADR needed: no (ADR 005 exists).

## Run interdicts
- No dependency added; no rename in the source `package.json` (`git diff` must show it untouched); `ui-tokens` and `ui-codemod` not published; no change to any component, token or story.
- The agent never enables GitHub Actions, never creates or reads the npm token or any secret, never creates a `fork@*` tag, never runs `npm publish`.
- The workflow is the only file that may mention `secrets.NPM_TOKEN`, and only in the tag job.
- Never port 6006; no broad `pkill`; a ticket never merges with a red test.

## Files touched
`scripts/{stage-fork-package.mjs,check-fork-package.mjs,fork-package.test.mjs,publish-fork-workflow.test.mjs}`, `package.json` (scripts), `.github/workflows/publish-fork.yml`, `.changeset/config.json`, `docs/{RELEASING.md,architecture.md}`, `AGENTS.md`.

## Test strategy
`node --test` for the scripts and the workflow text checks (no build, fake package for the stage tests); one real local pass on a built package for the pack-and-install check; every guard proven by mutation. The workflow itself cannot run until Actions are enabled: its first real execution is the owner's, listed in the PR.

## Definition of Done
Per ticket: single PR into `next`, structured description (mutation log, local dry-run result, owner checklist), lint, check-locales, tests and build green, review `Ship allowed: yes`, merged to `next`.
