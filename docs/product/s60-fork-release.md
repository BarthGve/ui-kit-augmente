# A GitHub Release for each fork publication — `s60-fork-release`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

Each version of `@barthgve/ui-components` published from the repository gets a GitHub Release: what changed, a link to the npm page, and the archive to install without npm.

## User flow

1. Open the Releases page of the repository.
2. Read the notes of a version: the pull requests merged since the previous publication.
3. Follow the npm link to install by alias, or install the attached archive.

## Visible rules

- A Release is named after the package version (`x.y.z-fork.N`) and is marked as a prerelease.
- It is created after the npm publication succeeds; if it fails, the npm version stays published and the Release job is rerun on its own.
- The product version of the repository (`VERSION`, `CHANGELOG.md`) is a different number from the package version.

## Known limits

- Releases exist from the first version published after this story; earlier versions (`1.4.0-fork.1` to `.6`) have none.
- The first Release is the proof of the whole chain: it appears with the next real publication.

## Out of scope

- Backfilling earlier versions, GitHub Packages, the product release tags (`fork-v…`) and the wiki.
