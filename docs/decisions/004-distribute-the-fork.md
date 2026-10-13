# ADR 004 — Distribute the fork to consuming apps

- Status: superseded by ADR 005
- Date: 2026-10-09
- Scope: framing

## Context
The Storybook installation page (`packages/ui-components/src/docs/installation.mdx`) still says `yarn add @gouvfr-lasuite/ui-components @tanstack/react-query`, which installs the upstream package, not this fork. The fork is not published anywhere and `package.json` keeps the upstream name. The repository is private, and the packages live in a monorepo subfolder, so `yarn add github:BarthGve/ui-kit-augmente` does not work with Yarn 1 (it installs the repository root). `@gouvfr-lasuite/ui-tokens` is a real dependency of `ui-components`, pinned at 3.2.0 from the registry, so a fork build pulls the upstream tokens package unless the tokens are changed too.

## Decision
Until the fork has stable versions to share, apps install it from a built archive: `yarn build` then `yarn pack` in `packages/ui-components`, then `yarn add file:<path>.tgz` in the app (the archive can be attached to a GitHub release and installed by URL). `yarn link` is accepted for local development only, with `react` aliased to the app's copy. No package rename and no registry for now.

When versions must be shared across teams, a new ADR will rename the package under the owner's scope and publish it (GitHub Packages for the private repository, npm if it becomes public). Contributions meant for upstream keep the upstream package name in their code.

## Considered options
- Install from Git (`github:` URL) — rejected because Yarn 1 installs the repository root, not `packages/ui-components`.
- Rename and publish now (GitHub Packages or npm) — deferred: it changes the package name, exports and config, and it makes upstream contributions harder; nothing needs it yet.
- `yarn link` only — rejected as the main path: two copies of React break hooks, and it is not reproducible.

## Consequences
Easier: testing the fork in an app today, with no registry or token. Harder: the archive is rebuilt by hand and versions are not resolved by a registry. To watch: the installation page must stop showing the upstream command (a story to add), and `ui-tokens` stays on the upstream version unless a story changes tokens.
