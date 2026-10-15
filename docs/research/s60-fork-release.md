# Research — Story s60-fork-release

Worktree `.worktrees/s60-fork-release`, branch `feature/s60-fork-release`, from `next` at `3653ec2b`. Docs only; nothing run except `gh release create --help` (gh 2.82.1) and read-only `git ls-remote`.

## The five structuring facts
1. **The artifact the story attaches exists and is reachable.** `verify` uploads `fork-package` (`publish-fork.yml:68-70`, `if-no-files-found: error`), `publish` downloads it by name (`:93-95`). A job with `needs: [verify, publish]` shares the run's artifacts.
2. **`contents: write` on a separate job is compatible with the test, with three traps.** The test only demands `id-token` in the publish job and nowhere else, even in a comment (`publish-fork-workflow.test.mjs:52-61`), no `secrets.` or `NODE_AUTH_TOKEN` anywhere (`:62-65`), and no `run:` line containing `${{ github.ref` (`:111-116`). The job is found by the words `npm publish` (`:25`): the `release` job must not contain them. `github.token` is not forbidden.
3. **No test asserts `contents`, `needs` order or a release.** The new assertions are all to write (named in the plan).
4. **There is no Release and the tags are not uniform.** Tags on origin: `fork@1.4.0-fork.1` to `.6` and `fork-v0.3.0`; no `v*`. The upstream `v*` tags exist only locally. A Release's notes start can therefore come from the previous `fork@` tag, not from a previous Release (ADR 007, 3).
5. **The install texts are in three places with the same section** (`README.md:40-70`, `packages/ui-components/README.md`, `packages/ui-components/src/docs/installation.mdx`, all touched by s57 and by the Quick Fix #250). They already say how to install by alias and by archive; they do not say which of the version numbers identifies the package.

## Target story
Complexity 2. Criteria: `docs/stories.md` (s60-fork-release), reviewed in `docs/reviews/features/s60-fork-release.md`. Decisions: ADR 007.

## Current state of the code
- `.github/workflows/publish-fork.yml`: `permissions: contents: read` globally (`:14-15`); jobs `install-front`, `verify` (`needs: install-front`, `:29`), `publish` (`if` on a `fork@` tag push `:75`, `needs: verify` `:77`, `contents: read` + `id-token: write` `:78-80`). No third job.
- `scripts/publish-fork-workflow.test.mjs`: 9 text tests, no YAML library (jobs split by indentation).
- `docs/architecture.md:53`: describes the jobs.

## Anchor points
- New `release` job after `publish`; new tests beside the existing ones; a sentence in the three install texts and in `architecture.md`.

## Verified APIs / functions
- `gh release create <tag> [files] --notes … --generate-notes --notes-start-tag <tag> --prerelease --verify-tag --latest=false` (gh 2.82.1, `--help`). `--notes` text is placed before the generated notes.
- `gh release view <tag>` (exists check), `gh release upload <tag> <file> --clobber`.
- `gh api repos/{owner}/{repo}/git/matching-refs/tags/fork@` lists the tags.

## Traps & constraints
- A tag publishes to npm: no test of the `release` job without a publication. The first end-to-end proof is the next real tag; the unverified part goes in the ticket's PR (AGENTS: autonomous mode stops at releases).
- `gh run rerun` replays the workflow of the tag commit: a workflow fix needs a new tag; a job rerun is `--job`.
- Squash merges: generated notes list squash titles with gitmojis; acceptable.
- The runner's `gh` version may differ from 2.82.1 (flags exist since about 2.40).
- The install texts must not announce Releases before the first one exists (owner rule from s57): wording "from the first version published after this story".

## Open questions
1. Order of merge between the workflow ticket and the texts: settled in the plan (texts after the workflow, same wording bounded).
2. Whether `sort -V` orders `1.4.0-fork.10` after `1.4.0-fork.9` on the runner: to check in a shell in t01, test first.

## Real complexity
Scored 2 in `docs/stories.md`; **2 after research**. One job of about 25 lines, one test file, three texts. The risk is not the code but that the real behaviour only shows on a publication.

## Split proposal
Not required (verdict 2).
