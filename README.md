# La Suite numérique UI

This repository is the canonical home of the La Suite numérique design system.
It combines the former UI Kit and Cunningham repositories in a private Yarn 1
and Turborepo workspace.

Browse the unified component documentation in the public
[Storybook](https://suitenumerique.github.io/ui-kit/).

The Cunningham sources are a history-free snapshot of commit
[`3c13c21`](https://github.com/suitenumerique/cunningham/tree/3c13c21726d632a2a6ca41d2e7a4bbe28334c90b),
the React `4.3.1` release.

## Packages

| Package                                               | Purpose                                                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`@barthgve/ui-components`](./packages/ui-components) | All React components, SVG icons, styles, fonts, tests and Storybook documentation from UI Kit and Cunningham |
| [`@gouvfr-lasuite/ui-tokens`](./packages/ui-tokens)   | Cunningham token engine, CLI, default tokens, theming helpers and CSS/SCSS/JS/TS generators                  |
| [`@gouvfr-lasuite/ui-codemod`](./packages/ui-codemod) | One-off npx migration CLI for the former package names and public subpaths                                   |

`@barthgve/ui-components` is the fork of `@gouvfr-lasuite/ui-components`,
installed under the upstream name once published
(`yarn add @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version>`,
available after the first publish; until then see
[Install the fork](#install-the-fork)).

The component package depends on the token package through its published semver
range. Package versions are independent and managed by Changesets.

Run the migration CLI without adding it to an application dependency list:

```bash
npx @gouvfr-lasuite/ui-codemod@1.0.0 migrate . --source all
```

npx downloads the exact CLI version to the npm cache after confirmation and
does not modify the target project's `package.json`, lockfile or `node_modules`.

## Install the fork

`ui-components` is distributed by this fork on npm as `@barthgve/ui-components`,
with versions `x.y.z-fork.N`: `x.y.z` is the upstream version it is based on,
`N` the fork release (for example `1.4.0-fork.1`). Only `ui-components` is
distributed by the fork: `@gouvfr-lasuite/ui-tokens` and
`@gouvfr-lasuite/ui-codemod` remain the upstream packages. The repository is
public and, once published, the built package is public on npm, with npm
provenance (see [ADR 005](./docs/decisions/005-publish-the-fork-on-npm.md)).

> **Not published yet.** The first npm publish of `@barthgve/ui-components` is
> pending. Until then the alias install below fails (the package does not exist
> on npm): install from the archive instead.

### Alias install (available after the first publish)

Install the fork under the upstream name, so the imports of your application
stay `@gouvfr-lasuite/ui-components`. Replace `<version>` with a published fork
version:

```bash
# Yarn
yarn add @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version> @tanstack/react-query
# npm
npm install @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version> @tanstack/react-query
```

### Archive install (until the first publish)

From the root of this repository (dependencies installed, see
[Development](#development)), build the packages and pack `ui-components` under
the fork name. The base of the version must be the current version of
`packages/ui-components/package.json`; the last line printed is the archive
path:

```bash
yarn build
yarn fork:stage 1.4.0-fork.1 --out /path/to/fork-archive
```

Then, in the application, install the archive under the upstream name:

```bash
# Yarn
yarn add "@gouvfr-lasuite/ui-components@file:/path/to/fork-archive/barthgve-ui-components-1.4.0-fork.1.tgz" @tanstack/react-query
# npm
npm install "@gouvfr-lasuite/ui-components@file:/path/to/fork-archive/barthgve-ui-components-1.4.0-fork.1.tgz" @tanstack/react-query
```

The application's `package.json` and lockfile then pin the archive path (Yarn
writes it absolute, npm relative): keep the archive where the application can
reach it, and switch to the alias install after the first publish.

### Peers and styles

React 19, React DOM 19 and TanStack React Query 5 are peer dependencies;
`ui-tokens` is installed transitively. Both package managers warn that
`use-resize-observer`, a dependency, declares React up to 18 (npm:
`ERESOLVE overriding peer dependency`; Yarn: `incorrect peer dependency`). The
warning is not fatal and `--legacy-peer-deps` is not needed. Import the styles
and fonts once from the application entry point, as described in the
[package README](./packages/ui-components/README.md):

```tsx
import "@gouvfr-lasuite/ui-components/style";
import "@gouvfr-lasuite/ui-components/fonts/roboto";
import "@gouvfr-lasuite/ui-components/fonts/marianne";
import "@gouvfr-lasuite/ui-components/fonts/material-icons";
```

## Development

Node 24 (the version pinned in `.nvmrc`) and Yarn 1.22.22 are required.

```bash
yarn install --frozen-lockfile
yarn build
yarn lint
yarn test
yarn test:ct
yarn build-storybook
```

Run the unified documentation locally with `yarn storybook`. Add a release note
with `yarn changeset`. Packages are versioned and published manually; follow
[`RELEASING.md`](./docs/RELEASING.md) for the complete procedure.

See [`MIGRATION.md`](./docs/MIGRATION.md) for consumer migration instructions
and [`CONTRIBUTING.md`](./docs/CONTRIBUTING.md) to contribute to the project.
