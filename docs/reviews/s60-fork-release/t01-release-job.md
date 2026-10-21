# Review — Ticket s60-fork-release/t01-release-job

> Diff reviewed: `git diff next...feature/s60-fork-release/t01-release-job`

## Plan compliance
- [x] The code does what the plan specifies, nothing more. Diff = workflow `release` job, tests, plan checkboxes ticked (the 3 files; scope respected).
- [x] Run interdicts respected: `publish` and `verify` untouched; no new action (`download-artifact@v4` already used by `publish`), no secret, no dependency; `id-token` absent from `release`; no tag, no backfill; `.dm/` and `AGENTS.md` untouched.

## Anti-hallucination
- [x] No invented API: `gh release view/create/upload`, `gh api …/git/matching-refs/tags/fork@`, `--notes-start-tag/--prerelease/--verify-tag/--latest=false/--generate-notes` all match the research (gh 2.82.1 `--help`). Artifact name `fork-package` matches `verify`'s upload. `GITHUB_REF_NAME`, `GITHUB_REPOSITORY`, `RUNNER_TEMP` are standard.
- [x] Logic checked: the `awk` picks the line before the current tag in `sort -V` order; the current tag is appended even though `matching-refs` already lists it (adjacent duplicate, harmless); empty output when the tag is first, so the flag is omitted. `sort -V` check run: `fork.2, fork.9, fork.10` (ordering claim holds).
- [x] The code matches its comments.

## Security
- [x] No injection: tag only read from `$GITHUB_REF_NAME` in the shell, always quoted; no `${{ github.ref` in a `run:`.
- [x] Authz: `contents: write` only on `release`, no `id-token`; `publish` keeps `contents: read` + `id-token: write`; `needs: publish` and the same tag condition.
- [x] No secrets (`github.token` only). No IDOR/XSS/logs concerns.

## Factorization
- [x] No duplicated rule; test helpers `permissionsOf`/`conditionOf` reuse `jobText`/`publishJob`. No speculative abstraction.

## Rules compliance
- [x] AGENTS.md conventions followed (text tests, prettier OK).
- [x] ADR 007 respected on all five points (separate job, prerelease/not latest/verify-tag, notes start from tags, idempotent view/upload --clobber, no inlined tag).
- [x] No UI: no design check.

## Tests
- [x] Suite run by me: `node --test scripts/*.test.mjs` 24 pass, 0 fail, 3 skipped (pre-existing); `npx prettier --check` clean.
- [x] Assertions pin the criteria (needs, condition, permissions, flags, guard order).
- [x] Bite proven by neutralization (each restored, `git diff --exit-code` clean after each):
  - `needs: publish` -> `needs: verify`: 1 red.
  - `npm publish` in a release comment: 1 red.
  - `id-token` in a release comment: 2 red.
  - `id-token: write` added to release permissions: 2 red.
  - `--prerelease` removed: 1 red.
  - `gh release view` inverted (`if ! …`): 0 red (see minor 1).
- [x] No test made redundant.

## Regressions
- [x] The existing 9 tests still pass; `publish`/`verify` unchanged; the new job only adds on tag pushes (skipped on PRs).

## Findings
1. minor — scripts/publish-fork-workflow.test.mjs — the exists-guard is pinned only by text order (`view` before `create`, `upload … --clobber` present). Inverting the condition leaves the suite green. Inherent to text tests; the next real tag is the proof.
2. minor — .github/workflows/publish-fork.yml — if `gh api` fails, the pipeline status is that of `awk`, so `previous` is silently empty and the notes fall back to GitHub's default start. Acceptable degradation, but silent; a `set -o pipefail` or a message would make it visible.

## Not verified
- The Release itself (creation, asset upload, notes range, `--notes` + `--generate-notes` combination on the runner's `gh` version) was never run: a tag publishes to npm, owner decision. Human gesture: after merge, push the next `fork@x.y.z-fork.N` tag, open the Releases page, check the prerelease badge, the npm link above the generated notes, the `.tgz` asset, the notes starting from the previous `fork@` tag; then rerun only the `release` job (`gh run rerun --job`) and check no second Release appears.
- `yarn lint` not run by me (only `node --test` and prettier requested). The PR text with the `sort -V` and mutation record was not available in the diff.

## Verdict
Max severity: minor
Ship allowed: yes
