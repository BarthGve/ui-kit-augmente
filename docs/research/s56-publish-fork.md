# Research — Story s56-publish-fork

Worktree `.worktrees/s56-publish-fork`, branch `feature/s56-publish-fork` (from `next` at `28963e43`). Source and repository settings read; nothing built. `docs/reviews/features/publish-fork.md`: `Stories ready: yes`. Decisions: ADR 005.

## The five structuring facts
1. **GitHub Actions are disabled on this repository** (`gh api .../actions/permissions` → `enabled: false`; `docs/architecture.md:53`, set by `/dm-init`). The publish workflow cannot run, and no dry-run on a pull request is observable, until the owner enables Actions. Enabling them also switches on the existing `.github/workflows/main.yml` for every pull request (lint, locales, tests, build, e2e on chromium, webkit and firefox, storybook): the fork has only ever run these checks locally. Enabling Actions is the owner's call, listed in the PR and in ADR 005.
2. **Nothing publishes today and the package name is upstream's.** `packages/ui-components/package.json`: `name` `@gouvfr-lasuite/ui-components`, `version` `1.3.0`, `publishConfig.access: public`, `files: ["dist"]`, `exports` with `.`, `./icons`, `./style`, three font entries (and sass variants). `ui-tokens` is a regular dependency at `3.2.0`. No `repository` field (needed by npm provenance, which checks it against the workflow repository).
3. **The rewrite is two fields and the `exports` map is untouched**, so a staging copy of `package.json` (`name`, `version`, plus `repository`, `publishConfig`) next to the built `dist` is enough. `npm pack` honours `files`. The built `dist` does not exist in a fresh checkout (`yarn build` = `build-theme && tsc && vite build && build-assets`), so the stage script must fail clearly when `dist` is missing rather than build it.
4. **`docs/RELEASING.md` documents a manual upstream flow** (local `npm publish`, 2FA, "do not run `changeset publish`", no workflow, tags `@gouvfr-lasuite/ui-components@x.y.z`). The fork uses its own tag (`fork@<version>`) and a workflow, so the file needs a header saying it covers upstream and pointing to ADR 005. `.changeset/config.json` has `baseBranch: "main"`; `docs/architecture.md:45` and `AGENTS.md` (traps) record it as a trap and must be updated once corrected.
5. **Versioning is outside Changesets for the fork.** Changesets computes `1.3.1` or `1.4.0` for `ui-components`; the fork version `<base>-fork.<N>` is chosen by the owner at tag time. The script takes the version as an argument and checks that its base equals the current `package.json` version; `N` is free but the workflow refuses a tag whose base differs.

## Target story
s56-publish-fork (docs/stories.md, complexity 3). Criteria: AC1 staging script (name and version rewritten, source unchanged, refuses a bad version, prints the archive path); AC2 pack-and-install check through the alias and the `exports` map; AC3 package contents limited to `dist`, `ui-tokens` a regular dependency; AC4 `baseBranch: "next"`; AC5 workflow `fork@<version>` (ancestor of `main`, version accepted, lint/tests/build, `npm publish --provenance`, PR dry-run with artifact and no secret); AC6 `RELEASING.md` header and trap lines updated. Dependencies: none.

## Current state of the code
- No root `scripts/` folder; package scripts live in `packages/ui-components/scripts` (TypeScript run with `tsx`, `.mjs` for the PDFs) and `packages/ui-codemod` tests use `node --test`. Root `package.json` scripts delegate to Turborepo.
- Workflows: `.github/workflows/main.yml` (jobs reuse `front-dependencies-installation.yml`, Node `24.x`, checkout `@v6`, cache `@v5`) and the reusable install job. No publish workflow.
- Branch rulesets `driven-main` and `driven-next` require pull requests; `main` protection has `enforce_admins`.

## Anchor points
New `scripts/stage-fork-package.mjs`, `scripts/check-fork-package.mjs`, `scripts/fork-package.test.mjs` (`node --test`), root script entries `fork:stage` and `fork:check`; new `.github/workflows/publish-fork.yml`; edits to `.changeset/config.json`, `docs/RELEASING.md`, `docs/architecture.md`, `AGENTS.md` (trap line).

## Verified APIs / functions
`npm pack --pack-destination`, `npm publish --provenance --access public` (npm ≥ 9.5), `import.meta.resolve` (Node 24) for resolving `exports` entries, `actions/checkout@v6` with `fetch-depth: 0` for `git merge-base --is-ancestor <tag-commit> origin/main`, `permissions: id-token: write`. No dependency added.

## Traps & constraints
- **The install check needs the network** (the throwaway project installs the archive's dependencies from npm). Run it in CI; locally it needs a connection. It uses `npm install --ignore-scripts --no-audit --no-fund` in a temp directory outside the repository, and resolves each `exports` entry with `import.meta.resolve` instead of rendering (CSS cannot be imported in plain Node).
- **Package `name` with the alias**: the alias key must stay `@gouvfr-lasuite/ui-components`; the installed folder is `node_modules/@gouvfr-lasuite/ui-components` while the manifest inside says `@barthgve/ui-components`. Resolution is by folder, so the check must assert both.
- **A tag can be pushed from any branch**: the workflow must verify the ancestor-of-`main` rule itself (`fetch-depth: 0`, `git merge-base --is-ancestor`); a tag filter alone does not.
- **Dry-run on pull requests runs with the pull-request token**: no secret, no `id-token`; the artifact upload is the only write.
- **The first real publish is the owner's** (scope ownership on npm, `NPM_TOKEN` secret, tag, enabling Actions). The agent must not enable Actions or touch secrets; it writes the checklist.
- Do not edit generated `src/cunningham-tokens.*`; this story touches no component.

## Open questions
1. Enabling GitHub Actions (also activates `main.yml` on every PR): the owner's decision, outside the agent's run.
2. Is the npm scope `@barthgve` owned by the owner? Unknown until the first publish; the staging script takes the scope from a variable with this default, so a wrong scope is a one-line change.
3. `repository` field: added only in the staging copy (`https://github.com/BarthGve/ui-kit-augmente.git`, directory `packages/ui-components`), not in the source.

## Real complexity
Story says 3; **stays 3**: three small scripts and one workflow, but the workflow cannot be run by the agent (Actions disabled), so its correctness rests on a local dry-run of the same steps and a careful review. No split: the script, its check and the workflow share one package-name contract.

## Split proposal
None.
