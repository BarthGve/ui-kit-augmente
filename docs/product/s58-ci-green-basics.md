# CI basics: build order and commit lint — `s58-ci-green-basics`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

A red CI means a real problem. The unit-test job no longer fails at random, and the commit-lint job accepts squash and release commits.

## What changed

- `yarn test` waits for the dependencies' build and no longer rewrites a `dist` that another package reads, so the "Failed to resolve entry for package `@gouvfr-lasuite/ui-tokens`" race is gone.
- `.gitlint` exempts commit titles ending with `(#<pr>)` (squash and release commits); every other rule stays on.
- `docs/architecture.md` lists the CI jobs: lint-git, lint, check-locales, test, build, e2e on Chromium, WebKit and Firefox, storybook, and the publish dry run.

## Visible rules

- The same checks can be run locally before a pull request: `yarn lint`, `yarn check-locales`, `TZ=UTC yarn test`, `yarn build`, `node --test scripts/*.test.mjs`.

## Known limits

- The cross-browser `e2e` job was red when this story shipped; it is fixed by `s59-cross-browser-e2e`.
- The "no CI on this fork" lines of `AGENTS.md` (git-ignored) were left for the owner to update.

## Out of scope

- New CI jobs and any change to the components.
