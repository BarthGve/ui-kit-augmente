# Review — Ticket s56-publish-fork/t02-publish-fork-workflow

> Fresh-context review. Diff reviewed: `git diff next...feature/s56-publish-fork/t02-publish-fork-workflow` (commit 0831f63a).

## Plan compliance
- [x] Tasks 1-3 and 5 done: workflow, text test, `baseBranch: "next"` (asserted by a test), RELEASING.md header, architecture.md line, owner checklist in the plan. Nothing unrequested in the diff.
- [x] Run interdicts: source `package.json` untouched, no dependency, no secret outside the tag job, no tag created. The `npm publish --dry-run` the implementer ran is a breach of "never runs npm publish" (see Findings, minor).
- AC6 / AGENTS.md: the file is git-ignored (.gitignore:90), so it cannot be committed by any ticket. For the tracked docs AC6 is met (architecture.md, RELEASING.md). The AGENTS.md trap line still says `baseBranch: "main"`, so it is stale and the owner has to edit it in the base directory. The plan notes this honestly. I accept it.
- architecture.md edit: one line, in scope.

## Anti-hallucination
- [x] Every action exists and is pinned like main.yml (checkout@v6, setup-node@v6, cache@v5, upload-artifact@v4). `download-artifact@v4` is new but consistent with upload@v4. `front-dependencies-installation.yml` is reused with `node_version`. The scripts and arguments match `stage-fork-package.mjs` (version regex, `--out`, last stdout line is the archive path) and `check-fork-package.mjs`.
- [ ] **Plausible-but-wrong value (major):** the `npm publish` step has no `--tag`. Every fork version is `X.Y.Z-fork.N`, which is semver prerelease. I read the installed npm 11.9 (`lib/commands/publish.js:119-125`). It throws "You must specify a tag using --tag when publishing a prerelease version" when the tag is the default and `publishConfig.tag` is unset. The staged package.json copies the source `publishConfig`, which holds only `access`. So the first real publication (`fork@1.3.0-fork.1`) will fail at the `publish` job. It fails closed, but the deliverable does not work, and ADR 005 requires the `latest` dist-tag. The test checks `--provenance` and `--access public` but not `--tag latest`, so it cannot see this. Fix: add `--tag latest` to the command and pin it in the test.

## Security
- [x] Injection: `github.ref_name` is passed through `env: TAG` and expanded as `"${TAG#fork@}"` in the shell. No `${{ }}` of an untrusted context appears inside a `run:` line. A test guards this. The version is then validated by the stage script regex. Quoted `"$RUNNER_TEMP"` and the glob are safe.
- [x] Permissions: the top level is `contents: read`. Only `publish` has `id-token: write` and `secrets.NPM_TOKEN`. The token is scoped to the single Publish step through `NODE_AUTH_TOKEN`. `pull_request` jobs have neither. A fork PR gets no secrets and the publish `if` excludes it. The `publish` job is gated by `github.event_name == 'push'` and the `refs/tags/fork@` ref.
- [x] Ancestor check: `fetch-depth: 0` plus `git merge-base --is-ancestor HEAD origin/main`, before setup-node and publish. Under `bash -e` a non-ancestor tag fails the job. `verify` still runs on a non-main tag, but it has no secret and `publish` is blocked.
- [x] The published archive is the verified one: it is uploaded by `verify` in the same run and downloaded by `publish` (default run-id). It is not rebuilt.
- Residual (accepted, not a finding): the workflow definition comes from the tagged commit, so a writer who pushes a tag on a branch that edits the workflow could bypass the check. Recommend a protected tag ruleset on `fork@*` or an Environment on `publish` as an owner hardening gesture.
- Secrets in source: none.

## Factorization
- [x] No duplicated rule. The `verify` steps reuse the existing scripts. A small duplication of the checkout/node/cache steps already exists in main.yml and is accepted.

## Rules compliance
- [x] ADR 005: tag trigger, ancestor of main, lint/test/build, NPM_TOKEN, baseBranch next, RELEASING.md pointer. Not respected: the `latest` dist-tag (see major).
- [x] Design system: not applicable.

## Tests
- [x] `node --test scripts/*.test.mjs`: 21 pass, 0 fail. `yarn lint` OK. `TZ=UTC yarn test`: the first run failed (known race), the rerun passed. `src/cunningham-tokens-sass.scss` was restored.
- [x] Bite proven on the workflow tests (BSD sed, each mutation restored with `git checkout`, final `git diff --exit-code` clean): `id-token` added to a non-publish job → 1 red; ancestor check replaced by `true` → 1 red; `--provenance` dropped → 1 red; the publish `if` widened (removed the tag-ref clause) → 1 red.
- [ ] Gap: no test pins `--tag latest`, which is why the major above went unseen. The tests are text checks and cannot prove the workflow runs.
- The workflow test is not decorative: each asserted line is a security invariant.

## Regressions
- [x] The `baseBranch` change only affects `changeset status`. Nothing else is touched.

## Findings
- major — .github/workflows/publish-fork.yml:101 — `npm publish ... --provenance --access public` lacks `--tag latest`. npm 11 refuses prerelease versions without `--tag`, and every `X.Y.Z-fork.N` is one. The publication cannot succeed and the ADR's `latest` dist-tag is not set. Add `--tag latest`, add the test assertion, and mutation-test it.
- minor — implementer ran `npm publish <tgz> --dry-run` in a scratch script, against the run interdict. Assessment: `--dry-run` does not send the tarball. I found no `~/.npmrc` and no `NPM_*` env var in this environment, so there was no token to touch, and no repo file was modified (the tree was clean before my own run). I cannot prove from the repo alone that no registry request or log entry was made. Impact is negligible, but record it in the PR.
- minor — AGENTS.md trap line (AC6) still stale because the file is ignored. Owner must edit it by hand; add this to the owner checklist.
- minor — hardening suggestion: protect the `fork@*` tags (ruleset) or use a GitHub Environment on `publish`.

## Not verified
- The workflow has never run on GitHub (Actions are disabled). The `uses:` reuse of the install workflow, cache hit across jobs, artifact hand-off, and setup-node `.npmrc` wiring are only read, not executed.
- No real `npm publish`, no provenance, no scope check on `@barthgve`, no token. Human gestures: enable Actions, open a PR and look at the `Publish fork` dry-run, then after fixing the tag flag push `fork@1.3.0-fork.1` from `main` and check the npm page (version under `latest`, provenance badge). Also push a `fork@` tag on a non-main commit in a test and confirm `publish` fails at the ancestor step.
- I did not run npm publish to confirm the prerelease error empirically (interdict); the conclusion comes from reading npm 11.9's source, and the Actions runner with Node 24.x ships npm 11.

## Re-review (after the fix run, amended commit, diff `git diff next...HEAD`)

The sections above are the history of the first review (verdict then: major, no ship).

- **Major fixed.** `.github/workflows/publish-fork.yml:101` now reads `npm publish "$RUNNER_TEMP"/fork-package/*.tgz --provenance --access public --tag latest`. The test "npm publish carries provenance, public access and the latest tag" asserts `--tag latest(\s|$)`.
- **Mutation:** removed ` --tag latest` from the workflow, ran `node --test scripts/publish-fork-workflow.test.mjs`: 8 pass, 1 red (that test). Restored with `git checkout`, `git diff --exit-code` on the file clean, and the whole tree clean (only the untracked report).
- **Suite:** `node --test scripts/*.test.mjs`: 21 pass, 0 fail. `yarn lint`: OK.
- **No regression of the security points:** `id-token: write` (line 80) and `secrets.NPM_TOKEN` (line 100) appear only in the `publish` job (also asserted by a test); the tag name still goes through `env: TAG`; the check is still `git merge-base --is-ancestor HEAD origin/main` with `fetch-depth: 0`, before setup-node and publish; the published archive is still the one uploaded by `verify`. The `--tag latest` flag does not widen anything.
- **Owner checklist (plan):** now lists the tag ruleset / Environment hardening (tag-protection suggestion) and the manual `AGENTS.md` trap-line edit, plus the first-run checks including the `latest` dist-tag. The two earlier minors on those points are resolved.
- **Remaining minor:** the dry-run `npm publish --dry-run` the implementer ran against the run interdict is not undone and cannot be proven harmless from the repo (negligible impact; mention it in the PR). Plan tasks 1-2 text still omits `--tag latest` in its description (cosmetic; the ticked checklist is accurate in behavior).

### Not verified (unchanged)
- The workflow has never run on GitHub (Actions disabled): reuse of the install workflow, cross-job cache hit, artifact hand-off, `.npmrc` wiring by setup-node are only read.
- No real `npm publish`, provenance or scope check. Human gestures: enable Actions, open a PR and read the `Publish fork` dry-run; then push `fork@1.3.0-fork.1` from `main` and check the npm page (version under `latest`, provenance badge); push a `fork@` tag on a non-main commit and confirm `publish` fails at the ancestor step.
- The prerelease/`--tag` behavior comes from reading npm 11.9 source, not from a live publish.

## Verdict
Max severity: minor
Ship allowed: yes
