# ADR 005 — Publish the fork on npm

- Status: accepted
- Date: 2026-10-13
- Scope: framing
- Supersedes: ADR 004 (distribute the fork to consuming apps)

## Context
ADR 004 kept the fork out of any registry until versions had to be shared, and installed it from a built archive meanwhile. The owner now wants the fork usable in projects. Constraints stated by the owner: the repository stays private; the consuming applications are not all on GitHub, so a GitHub Packages token cannot be assumed; the registry is npm. The packages keep the upstream names (`@gouvfr-lasuite/ui-components` 1.3.0, `ui-tokens` 3.2.0, `ui-codemod` 1.0.0): an `npm install` of that name fetches upstream, not the fork. The fork's tokens live in `ui-components` itself (`cunningham.ts` and each component's `tokens.ts`); `ui-tokens` is the unchanged upstream engine, imported in 37 files under `src`.

## Decision
- Publish **only `ui-components`** on the public npm registry, under the owner's scope: **`@barthgve/ui-components`** (the scope must exist on npm and belong to the owner; confirmed before the first real publish). `ui-tokens` and `ui-codemod` stay the upstream packages; `ui-components` keeps depending on `@gouvfr-lasuite/ui-tokens` 3.2.0 from the registry.
- **No rename in the code.** The source `package.json` keeps the upstream name so merges from `upstream` do not conflict. A publish script copies the built package to a staging folder and rewrites `name` and `version` there only.
- Versions of the fork are `<upstream-version>-fork.<N>` (for example `1.3.0-fork.1`, tag `fork@1.3.0-fork.1`), so they never read as upstream releases. They are published under the `latest` dist-tag, only from a tag on `main`. `docs/RELEASING.md` keeps describing the upstream packages and points here for the fork.
- Consuming applications keep their imports by installing under an alias: `yarn add @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version>` (npm: `npm install @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version>`). The same alias applies to the `ui-codemod` migration, which targets the upstream names.
- Publication runs from a GitHub workflow on a tag `fork@<version>` whose commit is an ancestor of `main`, after lint, tests, build, with an `NPM_TOKEN` repository secret. Changesets `baseBranch` is corrected to `next` (the integration branch of the fork).
- The repository stays private. Consequence accepted by the owner: the built code (`dist`) is public on npm. npm provenance is not available (it needs a public repository).

## Considered options
- GitHub Packages (private) — rejected: every consuming application and its CI would need a token with `read:packages`, and the applications are not all on GitHub.
- npm private scope (paid) — rejected for now: it adds a cost and still needs a token in every consumer; revisit if the code must not be public.
- Rename the packages in the source — rejected: it touches 37 files and `package.json`s and makes every `git fetch upstream` merge conflict.
- Publish `ui-tokens` and `ui-codemod` too — rejected: they are unchanged upstream packages; republishing them duplicates and diverges for nothing.
- Keep the archive of ADR 004 — kept as a fallback for tests only; it does not resolve versions.

## Consequences
Easier: `yarn add` with a version in any application, no token, no GitHub access; imports unchanged thanks to the alias. Harder: the owner must hold the npm scope and an automation token; the fork owner is responsible for the public package; a breaking change in upstream `ui-tokens` is inherited. To watch: the Storybook installation page must show the alias command (story s57); the first real publish is done by the owner, with the scope confirmed; the name rewrite must be tested (a pack-and-install check) so a broken `exports` map is caught before publishing.
