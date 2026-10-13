# Research — Story s58-ci-green-basics

Worktree `.worktrees/s58-ci-green-basics`, branch `feature/s58-ci-green-basics` (from `next` at `b246066e`). Evidence: the logs of the first CI run on PR #202 (`Frontend CI`, `Publish fork`), `turbo.json`, `.github/workflows/main.yml` and `publish-fork.yml`, the three package manifests.

## The five structuring facts
1. **Root cause of the red `test` and `verify` jobs = a race, not a missing build.** `turbo.json`: `test` has no `dependsOn`, so Turborepo runs the `test` tasks of `ui-tokens`, `ui-components` and `ui-codemod` in parallel. `ui-tokens`' own `test` script starts with `yarn build`, which **rewrites its `dist`** while `ui-components`' vitest tries to resolve `@gouvfr-lasuite/ui-tokens` (entry in `dist/lib`): "Failed to resolve entry for package" (`Gantt.spec.tsx`, 1 of 52 files; the CI cache holds `node_modules` only, so `dist` does not exist before). Locally the same race hit about one run in two. Fix: `test` depends on `^build` (the dependencies' build runs first, once, and Turborepo orders it before any `test`); `ui-tokens`' `test` keeps its internal `yarn build` (a second build of an up-to-date `dist` is harmless but see the trap below).
2. **The same task graph is used by `Publish fork / verify`** (`yarn test` in `publish-fork.yml`), so one change fixes both jobs.
3. **`lint-git` fails on one commit: the release squash commit `eade2a83` on `main`.** Its body repeats the squashed PR titles; 5 lines exceed 80 characters (84 to 103). `gitlint` default rule B1 (body line length 80). No `.gitlint` exists, the job installs gitlint with `pip` and runs `gitlint --commits origin/<base>..HEAD`. The squash commit is on `main` and cannot be rewritten; every future `next` → `main` release PR will carry the same kind of commit. GitHub squash commits end with `(#<number>)` in the title; so do the `🔖(release) … (#200)` commits.
4. **gitlint supports this exemption natively**: a `.gitlint` section `[ignore-by-title]` with `regex = .*\(#[0-9]+\)$` and `ignore = all` skips such commits. The default gitlint also ignores merge commits (`Merge …`), which covers the `-s ours` sync commit of PR #202 (`chore: sync main into next …` is **not** a `Merge` title, so it is checked on its own lines, which are short).
5. **Docs**: `docs/architecture.md:53` says GitHub Actions are disabled; `AGENTS.md` (git-ignored) says "no CI on this fork" (already edited locally on 2026-10-13 by the main agent, owner-owned).

## Target story
s58-ci-green-basics (docs/stories.md, complexity 2): turbo `test` after `^build`, `test` and `verify` pass on a pull request, `lint-git` accepts squash/release commits, `architecture.md` states the CI is active.

## Current state of the code
- `turbo.json`: `build` dependsOn `^build`; `test:ct` dependsOn `build`; `test`, `lint` no dependsOn.
- Scripts: `ui-tokens` `build` = `build-bin && build-default-theme && build-lib` then a symlink of `cunningham` into `node_modules/.bin`; `ui-codemod` `test` = `yarn build && node --test`.
- `main.yml`: `lint-git` runs only on pull requests, checkout `fetch-depth: 0`.

## Anchor points
`turbo.json` (one line), new `.gitlint`, `docs/architecture.md` line 53, a small test for gitlint in `scripts/` (`node --test`, calls `gitlint` if installed else skipped with a message — the CI job installs it; see traps).

## Verified APIs / functions
`gitlint --msg-filename <file>` lints a message file; `--config <.gitlint>`; `[ignore-by-title] regex=… ignore=all` (gitlint ≥ 0.12). Turborepo `dependsOn: ["^build"]` (already used by `build`).

## Traps & constraints
- **`^build` on `test` makes `yarn test` build `ui-tokens` and `ui-codemod`-independent packages first**: `ui-components`' own build is **not** a dependency of its tests (it would be `build`, not `^build`), so the cost is one `ui-tokens` build, already done by `ui-tokens`' own `test`. Check the wall time before/after.
- **`ui-tokens` `test` still runs `yarn build` itself**: with `^build` it no longer races (the build of `ui-tokens` is the `build` task of the same package, not a dependency of its own `test`: `^build` means the *dependencies'* build). **Therefore `^build` alone does not order `ui-tokens`' build before `ui-components`' test.** `ui-components` depends on `ui-tokens` through the workspace, so `^build` for `ui-components#test` = `ui-tokens#build`: ordered. But `ui-tokens#test` (which rebuilds `dist` in place) is not ordered against `ui-components#test`. The reliable fix is to drop the redundant `yarn build` from `ui-tokens`' `test` script (the `test` task now follows `^build`/`build`) **or** make `ui-components#test` depend on `ui-tokens#test`. Plan: remove `yarn build &&` from `ui-tokens`' test and add `dependsOn: ["build"]` (own build) so `ui-tokens#test` needs a built `dist` and never rewrites it. To be proved by a local clean-checkout run, 3 times, and by the CI.
- **gitlint test needs gitlint** (Python): not installed locally (`pip3 show gitlint` empty). The check runs in CI where the job installs it; locally the implementer installs it in a virtualenv in the scratchpad (outside the repo) to prove the two cases.
- The exemption must not hide long lines of ordinary PR commits whose title has no `(#n)`.
- `main.yml` and `publish-fork.yml` are workflow files: no secret, no permission change.

## Open questions
1. Is removing `yarn build &&` from `ui-tokens`' `test` acceptable (a package-script change in a package we do not own upstream)? Proposed: yes, with a comment; the alternative is a `dependsOn` only.
2. Exempt only by title `(#n)`, or also `^Merge`? Merge titles are ignored by gitlint already.

## Real complexity
Story says 2; **stays 2**. Three small edits and a two-case test; the risk is proving the race gone (repeat runs).

## Split proposal
None.
