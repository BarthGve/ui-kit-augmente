# `@gouvfr-lasuite/ui-components`

The unified React component library for La Suite numérique. It contains all
components previously published by UI Kit and Cunningham, with a single
enhanced `CunninghamProvider` that includes the UI Kit locales.

## Install the fork

This package is distributed by the fork
[BarthGve/ui-kit-augmente](https://github.com/BarthGve/ui-kit-augmente) on npm
as `@barthgve/ui-components`, with versions `x.y.z-fork.N`: `x.y.z` is the
upstream version it is based on, `N` the fork release (for example
`1.4.0-fork.1`). Only `ui-components` is distributed by the fork:
`@gouvfr-lasuite/ui-tokens` and `@gouvfr-lasuite/ui-codemod` remain the
upstream packages. The repository is public and the built package is public on
npm. Versions published by the GitHub workflow carry npm provenance; the first,
`1.4.0-fork.1`, was published by hand and does not (see
[ADR 005](https://github.com/BarthGve/ui-kit-augmente/blob/next/docs/decisions/005-publish-the-fork-on-npm.md)).

### Alias install

Install the fork under the upstream name, so the imports of your application
stay `@gouvfr-lasuite/ui-components`. Replace `<version>` with a published fork
version (for example `1.4.0-fork.6`), or use `latest` for the newest one:

```bash
# Yarn
yarn add @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version> @tanstack/react-query
# npm
npm install @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version> @tanstack/react-query

# Latest published version
yarn add @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@latest @tanstack/react-query
npm install @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@latest @tanstack/react-query
```

`latest` installs the newest published fork version. `-fork.N` versions are
semver prereleases: a range such as `^1.4.0` or `*` does not select them.

### Archive install (to test a local change)

From the root of a checkout of
[the repository](https://github.com/BarthGve/ui-kit-augmente) (dependencies
installed), build the packages and pack `ui-components` under the fork name.
The base of the version must be the current version of
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
reach it, and switch to the alias install once your change is published.

### Peers and styles

React 19, React DOM 19 and TanStack React Query 5 are peer dependencies.
`ui-tokens` is installed transitively. Add it explicitly as a development
dependency only when generating an application-specific theme. Both package
managers warn that `use-resize-observer`, a dependency, declares React up to 18
(npm: `ERESOLVE overriding peer dependency`; Yarn: `incorrect peer
dependency`). The warning is not fatal and `--legacy-peer-deps` is not needed.

```tsx
import "@gouvfr-lasuite/ui-components/style";
import "@gouvfr-lasuite/ui-components/fonts/roboto";
import "@gouvfr-lasuite/ui-components/fonts/marianne";
import "@gouvfr-lasuite/ui-components/fonts/material-icons";

import {
  Button,
  CunninghamProvider,
  MainLayout,
} from "@gouvfr-lasuite/ui-components";
import { ArrowRight } from "@gouvfr-lasuite/ui-components/icons";

export function App() {
  return (
    <CunninghamProvider>
      <MainLayout>
        <Button icon={<ArrowRight />}>Continue</Button>
      </MainLayout>
    </CunninghamProvider>
  );
}
```

## Public subpaths

| Subpath                 | Content                                    |
| ----------------------- | ------------------------------------------ |
| `/style`                | Component styles and all generated themes  |
| `/icons`                | Named React SVG components                 |
| `/fonts/material-icons` | Material Icons font CSS                    |
| `/fonts/roboto`         | Roboto Flex CSS                            |
| `/fonts/marianne`       | Marianne CSS and bundled font files        |
| `/sass/fonts/*`         | Sass entries for Roboto and Material Icons |

The package root deliberately does not export named SVG icons. Import them from
`@gouvfr-lasuite/ui-components/icons` so icon bundles stay explicit.

## Custom themes

The default, dark, DSFR and ANCT themes are included in `/style`. Custom theme
generation is optional and uses the token package CLI:

```bash
yarn add --dev @gouvfr-lasuite/ui-tokens
cunningham -g css,scss,ts -o src --utility-classes
```
