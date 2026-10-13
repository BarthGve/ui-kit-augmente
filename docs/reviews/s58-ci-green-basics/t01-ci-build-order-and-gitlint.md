# Review — Ticket s58-ci-green-basics/t01-ci-build-order-and-gitlint

> Fresh-context review. Diff reviewed: `git diff next...feature/s58-ci-green-basics/t01-ci-build-order-and-gitlint`

## Plan compliance
- [x] The code does what the plan specifies, nothing more (tasks 1-5 present: test, `.gitlint`, turbo + ui-tokens script, docs/architecture.md; task 6 is post-merge). Only extra: `[general] regex-style-search=true`, needed for the regex to behave as a search (harmless, see below).
- [x] Run interdicts respected: no new dependency; no component/token/story/hook change; no workflow/secret/permission change (`git diff` on `.github`, `package.json`, `yarn.lock` is empty); ordinary commits not exempted (only titles ending `(#<digits>)`); no test skipped or deleted; no port 6006, no pkill.

## Anti-hallucination
- [x] No invented API/config: `[ignore-by-title]` with `regex`/`ignore=all`, `--config`, `--msg-filename`, `--commits` all work (run). `turbo.json` override key `@gouvfr-lasuite/ui-tokens#test` is honoured (dry-run).
- [x] No plausible-but-wrong logic. `--dry=json`: `ui-components#test` and `ui-tokens#test` both depend on `ui-tokens#build`; `ui-tokens#test` runs only jest (no rebuild).
- [x] Architecture doc sentence matches the config and the workflows (jobs lint-git, lint, check-locales, test, build, e2e, storybook; publish-fork.yml).

## Security
- [x] No injection, authz, secrets, IDOR, XSS or sensitive-log surface. The test uses `spawnSync` with an argument array, temp files in `mkdtemp`, removed in `finally`.

## Factorization
- [x] One rule, one place (the exemption lives in `.gitlint` only). No speculative abstraction.

## Rules compliance
- [x] AGENTS.md conventions followed (gitmoji commit, docs lines). Note: AGENTS.md still says "no CI on this fork"; the plan lists it for the owner (git-ignored).
- [x] No accepted ADR contradicted.
- [x] Design system: not applicable.

## Tests
- [x] Suite run by the reviewer: `node --test scripts/*.test.mjs` with gitlint on PATH: 24 pass, 0 fail, 0 skipped.
- [x] Assertions pin the criteria: (a) exempt title passes with a 103-char line; (b) non-exempt title with 81 chars fails with the exact `B1 ... (81>80)`; (c) short commit passes.
- [x] Bite proven. Gitlint: `eade2a83` ("Release v0.2.0 (#201)") passes with `.gitlint`; with `--config /dev/null` gitlint reports B1 on it (82>80, 103>80). The exit code printed "without=0" was `tail`'s, not gitlint's; the B1 messages are the proof. `gitlint --commits next..HEAD` is clean (exit 0) for this very commit. Race: on a clean checkout (dist removed), the `next` config (restored via `git show next:...`) fails `yarn test` 3/3 with `Failed to resolve entry for package "@gouvfr-lasuite/ui-tokens"` (4-5 occurrences each); the ticket config passes 2/2 (4 tasks successful). Mutation M2 (drop `^build` from `test`): 3 clean-checkout runs stayed green, i.e. the race did NOT return with `ui-components#test` starting in parallel (timing dependent, vitest starts slower than the ui-tokens build). The edge is the correct declarative guarantee but this mutation did not bite empirically; the other half of the fix (removing the nested `yarn build`) is what is proven by the baseline. Everything restored (`turbo.json` and `ui-tokens/package.json` identical to HEAD; `cunningham-tokens-sass.scss` restored).
- [x] No test made redundant.

## Regressions
- [x] `ui-tokens#test-ci` still builds itself (unchanged). `ui-codemod#test` unchanged. `test` task now builds dependencies first: slightly longer cold run, expected.

## Findings
- minor — scripts/gitlint-config.test.mjs / .github/workflows/main.yml — the new gitlint test is not run by any workflow (`lint-git` only runs `gitlint --commits`, does not run `node --test`; `publish-fork.yml` runs two named script tests, not the glob). The test skips visibly when gitlint is missing, and the real gate (`lint-git` itself, using the same `.gitlint`) is what protects the rule, so the config cannot silently regress without CI noticing on the next squash commit. Not major: the plan did not ask for wiring and forbids nothing here, but a follow-up is worth it (a `node --test scripts/gitlint-config.test.mjs` step after the gitlint install).
- minor — M2 mutation (`^build` removal) does not reproduce the race locally; the claim "drop `^build` shows the race" in plan task 3 is not confirmed. The setting remains right by construction.
- minor — `[general] regex-style-search=true`: harmless (makes `regex` a search; the pattern is anchored with `$`, and `.*` prefix; only a title ending `(#n)` matches, confirmed by test (b) and by the tail-anchoring). Not verified that a title containing `(#12)` mid-string stays linted, beyond reading the regex.

## Not verified
- The real CI run on GitHub (lint-git on Linux, pip gitlint version, `test`/`verify` jobs): only local runs. Gesture: open the PR and read the `lint-git`, `test`, `verify` checks; task 6 re-run of PR #202.
- Wall time before/after (plan task 4) not measured by me; `yarn lint`, `yarn check-locales`, `yarn build` not re-run (no source touched).
- Race with parallel timing on slower CI hardware: only macOS local runs. Run `yarn test` several times on CI.

## Verdict
Max severity: minor
Ship allowed: yes
