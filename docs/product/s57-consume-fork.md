# Consume the fork in an application — `s57-consume-fork`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

A developer can install the fork's `ui-components` in an application without changing any import, and the README, the package README and the Storybook installation page all say how.

## User flow

1. Read "Install the fork" in the root README, the package README or the Storybook installation page (same wording in the three).
2. Install the package under the upstream name, so imports stay `@gouvfr-lasuite/ui-components`:
   `yarn add @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version>` (or `npm install` with the same alias).
3. Until the first npm publish, use the interim path: build the archive with `yarn fork:stage` and install it from a file.

## Visible rules

- Fork versions look like `<upstream version>-fork.<N>`.
- Only `ui-components` is the fork's: `ui-tokens` and `ui-codemod` stay the upstream packages.
- The alias command is flagged as available after the first publish.

## Known limits

- The npm package is not published yet (see `s56-publish-fork`); the alias command is read-checked only until then.
- The note "not yet published" in the three places is to be removed by the owner after the first publish.

## Out of scope

- Publishing the package, tags and secrets.
- Any code change.
