# ADR 008 — The project is independent of upstream ui-kit

- Status: accepted
- Date: 2026-10-25
- Scope: framing
- Supersedes: ADR 001 (upstream tracking), the "no rename" and version clauses of ADR 005, the tag, prerelease and product-tag clauses of ADR 007

## Context

The repository started as a fork of `suitenumerique/ui-kit` (ADR 001), so the code kept the upstream package names and the versions were tied to upstream ones (ADR 005: `@gouvfr-lasuite/ui-components` in the source, renamed at publish time, versions `<upstream-version>-fork.<N>`, tags `fork@…`). On GitHub the repository `BarthGve/ui-kit-augmente` is already a standalone repository (no fork link). The owner wants the project fully independent: no more upstream merges, no versions that read as derived from upstream ones.

## Decision

- **No upstream tracking.** The `upstream` and `cunningham` remotes are removed, and so are the upstream tags fetched locally. Upstream changes are no longer merged; a fix found upstream is ported by hand, like any other change.
- **`ui-components` is renamed in the source**: `packages/ui-components/package.json` is named `@barthgve/ui-components` and has its own `repository` field. The publish step no longer rewrites the manifest: `scripts/pack-package.mjs` packs the package as it is, and refuses a version that is not semver or that differs from the one in `package.json`.
- **`ui-tokens` and `ui-codemod` keep their upstream names.** `ui-components` depends on `@gouvfr-lasuite/ui-tokens@3.2.0`, which the local workspace satisfies today. Renaming it would either make yarn fetch it from the registry, or make the published package depend on an unpublished `@barthgve/ui-tokens`. `ui-codemod` is the upstream migration tool and targets the upstream names. Publishing the tokens under the owner's scope is a later decision.
- **Versions are plain semver.** The first independent version is **2.0.0**: a major version, so it never matches an upstream 1.x number and is not picked up silently by a `^1.4.0-fork.N` range. It is produced by the pending changesets (`.changeset/independent-package.md` is `major`), not written by hand.
- **Package tags are `ui-components@<version>`** (prefix shared by neither upstream `v*` tags nor the old `fork@…` tags). The publish workflow triggers on them; the GitHub Release is no longer marked as a prerelease. The notes of the first Release start at the last `fork@` tag.
- **Product versions** (`VERSION`, `CHANGELOG.md`) are tagged `v<VERSION>`: there are no upstream tags left to collide with. Past `fork-v…` and `release-v…` tags stay as they are.
- **The workflow file keeps its name** `.github/workflows/publish-fork.yml`: npm trusted publishing (ADR 006) is bound to that file name. Only its `name:` changes.
- **Consumers keep the alias install** `@gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version>`, so their imports and the examples of the Storybook stay the same.

## Considered options

- Keep the fork setup and stop merging only — rejected: `-fork.N` versions and the publish-time rename keep the project tied to upstream numbers.
- Rename the three packages — rejected for now: see the tokens clause above.
- Version 1.5.0 — rejected: it continues the upstream 1.x line, and `^1.4.0-fork.N` ranges would pick it up without the application choosing to.
- Rename the workflow file — deferred: it breaks publishing until the trusted publisher is updated on npmjs.com, with 2FA.
- Change the import name in the documentation to `@barthgve/ui-components` — rejected: about 120 examples, and it would contradict the alias the applications already use.

## Consequences

Easier: the source manifest is the published manifest; no merge conflicts with upstream; a version means one thing. Harder: no upstream fixes arrive by themselves (security, accessibility, React upgrades); Renovate still updates the dependencies. Each application moves from `1.4.0-fork.N` to `^2.0.0` once; its alias and imports do not change. To watch: the first `ui-components@2.0.0` tag is the first proof of the new workflow; renaming `publish-fork.yml` needs the trusted publisher updated first (`npm trust`).
