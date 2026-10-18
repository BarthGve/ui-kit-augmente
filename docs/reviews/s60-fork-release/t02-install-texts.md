# Review — Ticket s60-fork-release/t02-install-texts

> Diff reviewed: `git diff origin/next...HEAD` (f1948a59). Docs only, no UI: no design check. `templates/review-checklist.md` does not exist in the repo; the checklist format of the t01 review is used.

## Plan compliance
- [x] Task 1: the three texts carry the same paragraph (FR in root `README.md`, EN in `packages/ui-components/README.md` and `installation.mdx`) and a "Release archive install" section (yarn add / npm install of the asset URL, with `@tanstack/react-query`). The old "Archive install" is renamed "Local archive install", no content lost.
- [x] Task 2: the "Decided, not built yet" sentence of `docs/architecture.md` is replaced.
- [x] Task 3 ticked; plan checkboxes updated (no other plan change).
- [x] Scope respected: 4 files + plan. `AGENTS.md`, `.dm/`, workflow untouched.

## Anti-hallucination
- [x] Architecture text vs `.github/workflows/publish-fork.yml` job `release` (lines 104-142), point by point: separate job after `publish` (`needs: publish`), same tag condition (`startsWith(github.ref, 'refs/tags/fork@')`), `contents: write` only and no `id-token`, `gh` CLI with `github.token`, title = version, `--prerelease --latest=false`, body = npm link before `--generate-notes`, previous `fork@` tag via `sort -V` (`--notes-start-tag`), asset = `fork-package` artifact, existing Release gives `gh release upload --clobber` only. "rerun alone (`gh run rerun --job`)" matches the job comment. All exact.
- [x] grep run by me: no `0.3.0` and no `fork@1.4.0-fork.6` in the three texts (grep exit 1). No product version number written (only the file names `VERSION`, `CHANGELOG.md`, `fork-v…` and the placeholder `x.y.z-fork.N`).
- [x] No announced Release that does not exist: wording is "from the first version published after Releases were set up; earlier versions have none". `fork@1.4.0-fork.7` exists as a tag without Release; the wording covers it (it is earlier than the first Release-bearing version). The Releases link is the generic `/releases` page, no specific Release named.
- [x] Three texts consistent (same structure, same facts, same code blocks; MDX uses `<Source … code={…}>` like the surrounding blocks).

## Security / Factorization / Maintainability
- [x] Nothing behavior-bearing. The same paragraph exists in three places by design (plan requires it, FR/EN split); no code duplication.

## Rules compliance
- [x] ADR 007 respected (prerelease, not latest, per-tag Release, rerun of the job alone). AGENTS.md: docs in English except the FR root README as before.

## Tests
- [x] `npx prettier --check` on the four files: three clean; `docs/architecture.md` reports a warning. I checked `origin/next:docs/architecture.md`: it fails the same way before the diff, so it is pre-existing, not caused by this ticket.
- No mutation: docs only, no invariant to neutralize. Worktree clean (`git status` empty).

## Issues
- minor: the plan task 3 asks `prettier --check` on the four files; `docs/architecture.md` was already non-conformant on `next` (long single line), so the check cannot go green without an unrelated reformat. Record it in the PR (or fix in a separate chore).
- minor: the plan asks the "install from a Release archive" path to be tested with the dry-run archive and the command recorded in the PR; no such record is visible in the diff, to be confirmed in the PR body.

## What I could NOT verify
- Storybook compile of `installation.mdx` (CI job `storybook`; not run locally). Gesture: check the CI job is green and open the Installation page.
- The Release install command against a real Release asset URL: no Release exists yet; the `release` job itself is proved only by the next real `fork@` publication. Gesture: after that publication, copy the asset URL and run the documented `yarn add` in a scratch app.
- Rendering of the root README links on GitHub.

Max severity: minor
Ship allowed: yes
