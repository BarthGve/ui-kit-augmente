# Review — feature fork-release (s60-fork-release)

Reviewed by a fresh-context `stories-reviewer` against `docs/prd.md` (amendment 2026-10-15), the shipped stories s56 and s57, `.github/workflows/publish-fork.yml`, `scripts/publish-fork-workflow.test.mjs`, the three install texts and ADR 005 and 006.

## Verified
- The `fork-package` artifact exists (uploaded by `verify`, downloaded by `publish`) and is reachable from a later job of the same run.
- `contents: write` on a separate `release` job is compatible with the workflow test, which only requires `id-token` in the publish job and no `secrets.` or `NODE_AUTH_TOKEN`.
- No contradiction with ADR 005 or 006; no duplicate of s56 or s57; the graveyard is untouched.
- `gh release create` (gh 2.82.1) has `--notes-start-tag`, `--generate-notes`, `--prerelease` and `--verify-tag` (checked with `--help`).

## First pass: 3 major, 2 minor (all fixed in the story)
1. Major — criteria 1 and 3 had no named verification, and "rerun" was ambiguous (a whole-run rerun replays `publish`). Fixed: assertions named, "rerun only the `release` job", guard with `gh release view`.
2. Major — `0.3.0` hard-coded in three texts. Fixed: refers to `VERSION` and `CHANGELOG.md`, no number written; the three versions in the repository are told apart.
3. Major — the texts announced Releases that do not exist yet. Fixed: "from the first version published after this story", merged with or after the workflow change.
4. Minor — notes base: the first Release has no earlier Release. Fixed: previous `fork@` tag passed with `--notes-start-tag`.
5. Minor — s57 missing from Dependencies. Fixed.

## Second pass: remaining, minor
- The story does not say how the "previous `fork@` tag" is determined, nor what the first Release uses as a start tag (`fork@1.4.0-fork.1` was published by hand and has a tag). To settle in ADR 007 ("notes source").
- Criterion 1 cannot be verified before the next real publication; the story says so and the PR must list it.

Max severity: minor
Stories ready: yes
