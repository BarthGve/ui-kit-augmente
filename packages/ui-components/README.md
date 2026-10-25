# `@barthgve/ui-components`

The unified React component library for La Suite numérique. It contains all
components previously published by UI Kit and Cunningham, with a single
enhanced `CunninghamProvider` that includes the UI Kit locales.

## Install

This package is published on npm as `@barthgve/ui-components` by the
repository [BarthGve/ui-kit-augmente](https://github.com/BarthGve/ui-kit-augmente).
The project is derived from `suitenumerique/ui-kit` and is independent since
version 2.0.0: it no longer follows the upstream releases (see
[ADR 008](https://github.com/BarthGve/ui-kit-augmente/blob/next/docs/decisions/008-independent-project.md)). Only `ui-components` is published here:
`@gouvfr-lasuite/ui-tokens` and `@gouvfr-lasuite/ui-codemod` remain the
upstream packages. The repository and the package are public, and versions
published by the GitHub workflow carry npm provenance.

Versions follow semver (`x.y.z`). The version identifies the package on npm,
the repository tag `ui-components@x.y.z` and the
[GitHub Release](https://github.com/BarthGve/ui-kit-augmente/releases) of the
same name. Versions before 2.0.0 (`1.4.0-fork.1` to `1.4.0-fork.9`) remain
installable. The product version
(`VERSION`, `CHANGELOG.md`, `v…` tags) is another number: it never names a
published version of the package.

### Alias install

Install the package under the name `@gouvfr-lasuite/ui-components`, so the
imports of your application match the examples of this documentation. Replace
`<version>` with a published version, or use `latest` for the newest one:

```bash
# Yarn
yarn add @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version> @tanstack/react-query
# npm
npm install @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version> @tanstack/react-query

# Latest published version
yarn add @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@latest @tanstack/react-query
npm install @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@latest @tanstack/react-query
```

`latest` installs the newest published version. A range such as `^2.0.0`
follows the later minor and patch versions. An application on a version
before 2.0.0 moves to 2.x by changing only the version: the alias and the
imports stay the same.

### Release archive install

Each Release has the package's `.tgz` archive attached, the one the workflow
checked before publishing. Copy the URL of that asset from the Release page and
install it under the alias name, without going through npm:

```bash
# Yarn
yarn add "@gouvfr-lasuite/ui-components@<archive-url>" @tanstack/react-query
# npm
npm install "@gouvfr-lasuite/ui-components@<archive-url>" @tanstack/react-query
```

The application's `package.json` and lockfile then pin that URL.

### Local archive install (to test a local change)

From the root of a checkout of
[the repository](https://github.com/BarthGve/ui-kit-augmente) (dependencies
installed), build the packages and pack `ui-components`. The version must be the
current version of `packages/ui-components/package.json`; the last line
printed is the archive path:

```bash
yarn build
yarn package:pack 2.0.0 --out /path/to/package-archive
```

Then, in the application, install the archive under the alias name:

```bash
# Yarn
yarn add "@gouvfr-lasuite/ui-components@file:/path/to/package-archive/barthgve-ui-components-2.0.0.tgz" @tanstack/react-query
# npm
npm install "@gouvfr-lasuite/ui-components@file:/path/to/package-archive/barthgve-ui-components-2.0.0.tgz" @tanstack/react-query
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
