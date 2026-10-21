---
validated: yes
---
# Plan — Story s60-fork-release

Branch: `feature/s60-fork-release` (framing) · tickets: `feature/s60-fork-release/<ticket-id>`
Research: `docs/research/s60-fork-release.md`. Decisions: `docs/decisions/007-github-release-per-fork-tag.md`. No UI story: no design.

## Target story
**As a** developer who installs the fork **I want** a GitHub Release for each published version **so that** I see what changed, find the exact version and install the archive without npm. Complexity 2, 2 after research. Criteria: `docs/stories.md` (s60-fork-release).

## Tickets (ordered)
### t01-release-job
- **size:** S
- **estimate:** 1.5d
- **depends on:** none
- **scope:** `.github/workflows/publish-fork.yml` (new `release` job) and `scripts/publish-fork-workflow.test.mjs`. Nothing else. Covers criteria 1 to 4 of the story.

Tasks (test first):
1. [x] Red: in `publish-fork-workflow.test.mjs`, add tests that fail on today's workflow: a `release` job exists; `needs: publish`; its `if` is the tag condition of `publish` (`refs/tags/fork@`, no `||`, no `pull_request`); it holds `contents: write` and no `id-token`; the `publish` job still has `contents: read` and `id-token: write`; the job uses `--prerelease`, `--generate-notes`, `--verify-tag` and `--notes-start-tag`; it checks `gh release view` before creating and uses `gh release upload … --clobber` when the Release exists; it contains neither the words `npm publish` nor `id-token` (even in a comment); no `run:` line contains `${{ github.ref`. Run `node --test scripts/publish-fork-workflow.test.mjs`: the new tests fail.
2. [x] Green: add the `release` job per ADR 007: `needs: publish`, the tag condition, `permissions: contents: write`, `download-artifact@v4` of `fork-package`, `GH_TOKEN: ${{ github.token }}` and the tag read from `$GITHUB_REF_NAME` in the shell, previous tag from `gh api …/git/matching-refs/tags/fork@` with `sort -V` (excluding the current tag; flag omitted when none), `gh release view` guard, `gh release create` with `--notes` carrying the npm link, then `--generate-notes`. All tests green.
3. [x] Check the ordering claim in a shell, outside the repository: `printf '1.4.0-fork.9\n1.4.0-fork.10\n1.4.0-fork.2\n' | sort -V` ends with `fork.10`; record it in the PR. Mutation: remove `needs: publish`, then give `release` the words `npm publish` in a comment, then `id-token` in a comment: each makes a test red (revert, record).
4. [x] `yarn lint`, `node --test scripts/*.test.mjs`, `npx prettier --check .github/workflows/publish-fork.yml`. PR lines: `Artifact: not applicable (CI only)` and the unverified part: the first real tag after the merge is the end-to-end proof (a tag publishes to npm: owner decision, not run by the agent).

### t02-install-texts
- **size:** XS
- **estimate:** 0.5d
- **depends on:** t01 (merged first)
- **scope:** the three install texts (`README.md`, `packages/ui-components/README.md`, `packages/ui-components/src/docs/installation.mdx`) and `docs/architecture.md`. Docs only. Covers criterion 5 and the architecture part of criterion 6.

Tasks:
1. [x] Add to each of the three texts, same wording (French in the root README, English in the other two): the package is identified by `x.y.z-fork.N` on npm and, from the first version published after this story, in the Releases; the product version of the repository (`VERSION`, `CHANGELOG.md`) is a different number, as are the `ui-components` version and the root `package.json`; how to install from a Release archive (`npm install` / `yarn add` of the asset URL, with `@tanstack/react-query`). No product version number is written.
2. [x] `docs/architecture.md`: replace the "Decided, not built yet (ADR 007…)" sentence by the real description of the `release` job.
3. [x] `npx prettier --check` on the four files; Storybook CI job compiles the MDX; a grep that none of the three texts contains `0.3.0` or `fork@1.4.0-fork.6` as the way to find a Release. The path "install from a Release archive" is tested with the dry-run archive as in s57 (record the command in the PR).

## US totals
- **Person-days:** 2.0 (1.5 + 0.5)
- **Size mix:** 1×S, 1×XS

## Run interdicts
No new dependency, no new action, no secret, no change to the `publish` or `verify` job, no `id-token` outside `publish`, no tag, no npm publication, no backfill of Releases for `fork@1.4.0-fork.1` to `.6`, no change to the product release (`fork-v…`) flow. Do not touch `.dm/` or `AGENTS.md`.

## The point everything turns on
`contents: write` lives on its own job with no `id-token`, and the test pins it. Everything else is a few `gh` commands.

## Files touched
- t01: `.github/workflows/publish-fork.yml`, `scripts/publish-fork-workflow.test.mjs`.
- t02: `README.md`, `packages/ui-components/README.md`, `packages/ui-components/src/docs/installation.mdx`, `docs/architecture.md`.

## Test strategy
Text tests of the workflow (node:test, red first, mutations recorded); prettier; the Storybook job for the MDX page; the Release behaviour itself is proved only by the next real publication (reported, not hidden).

## Definition of Done
Repo DoD. t01: tests green, mutations recorded, PR lists the unverified part. t02: texts consistent in the three places, no announced Release that does not exist, no product version number written.
