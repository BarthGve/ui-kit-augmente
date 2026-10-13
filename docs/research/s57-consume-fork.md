# Research — Story s57-consume-fork

Worktree `.worktrees/s57-consume-fork`, branch `feature/s57-consume-fork` (from `next` at `e7ac205e`). Docs only; evidence from the files below and from s56 (scripts and workflow merged).

## The five structuring facts
1. **Three places tell the reader to install the upstream package.** Root `README.md` (package table, `npx @gouvfr-lasuite/ui-codemod@1.0.0`, no install line for components), `packages/ui-components/README.md:10` (`yarn add @gouvfr-lasuite/ui-components @tanstack/react-query`) and `packages/ui-components/src/docs/installation.mdx:13` (same command). `customization.mdx` and `0_migrating_to_lasuite_ui.mdx` only show imports, which stay valid thanks to the alias.
2. **The package is not on npm yet** (s56 shipped the scripts and the workflow; the first publish needs the owner: scope `@barthgve`, `NPM_TOKEN`, tag `fork@1.4.0-fork.1` on `main`). The alias command would return 404 today. The owner nevertheless asked (2026-10-13) for the README to explain the installation now: the docs must say the true state.
3. **A working interim path exists and was proven in s56 t01**: `yarn build`, then `yarn fork:stage <version>` prints the path of a `.tgz` whose manifest says `@barthgve/ui-components`; `scripts/check-fork-package.mjs` installs it in a throwaway project under the upstream key (`@gouvfr-lasuite/ui-components` = `file:<archive>`), 9 `exports` entries resolve. The consumer-side command to document must be verified in a real throwaway app.
4. **Version scheme**: package version `1.4.0` (Changesets, PR #200) → fork tag `fork@1.4.0-fork.N` → published `1.4.0-fork.N`; `latest` dist-tag set by the workflow (`--tag latest`, prereleases require an explicit tag).
5. **Repository is public since 2026-10-13**: wording of README ("private workspace") refers to the Yarn workspace flag (`private: true` in the root manifest), not repository visibility: do not change it. npm provenance will be visible on the page once published.

## Target story
s57-consume-fork (docs/stories.md, complexity 2; criteria amended on 2026-10-13): README (root and package) and `installation.mdx` explain the fork package, the alias install, the interim archive install, peers and style imports; a throwaway app proves the archive path.

## Current state of the code
`README.md`, `packages/ui-components/README.md`, `packages/ui-components/src/docs/installation.mdx`; scripts `fork:stage` and `fork:check` in the root `package.json`; ADR 005.

## Anchor points
The three files above only. No code, no locale, no changeset (docs), no artifact page.

## Verified APIs / functions
`yarn fork:stage <version>` (last line = archive path); alias syntax `name@npm:@scope/pkg@version` (Yarn 1 and npm); `file:` install of a `.tgz`.

## Traps & constraints
- Yarn 1 resolves `@gouvfr-lasuite/ui-components@file:...` and rewrites it in the consumer `package.json` as the file path: document that the consumer lockfile then pins the archive path.
- React peer is 19: the install check showed an npm `ERESOLVE` warning from `use-resize-observer` (upstream); mention `--legacy-peer-deps` only if the throwaway app proves it is needed.
- Docs say "available after the first publish" for the alias: a wrong 404 claim is worse than an honest notice.
- `installation.mdx` is a Storybook Docs page (`Source` blocks); keep the structure.

## Open questions
1. Alias form for npm and Yarn 1: `yarn add @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@1.4.0-fork.1` (proved syntax-wise by the t01 check for `file:`, not yet for `npm:` since nothing is published): written as the target form, unverified until the first publish.

## Real complexity
2, unchanged. One ticket.

## Split proposal
None.
