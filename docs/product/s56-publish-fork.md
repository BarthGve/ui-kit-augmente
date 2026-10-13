# Publish the fork on npm — `s56-publish-fork`

User-facing product page for this user story. Published to the wiki on release.
Not research, not the plan, not the review.

## Purpose

The fork's `ui-components` package can be installed in any project with a version number. It is published on npm as `@barthgve/ui-components`.

## User flow

1. Install the package under the upstream name, so imports do not change:
   `yarn add @gouvfr-lasuite/ui-components@npm:@barthgve/ui-components@<version>`
   (or `npm install` with the same alias).
2. Import components, `./style` and `./icons` as usual.
3. Upgrade by changing the version.

## Visible rules

- Fork versions look like `<upstream version>-fork.<N>`, for example `1.3.0-fork.1`. They never read as upstream releases.
- Only `ui-components` is published. `ui-tokens` and `ui-codemod` stay the upstream packages.
- The package contains only the built files (`dist`).
- A release is made by pushing a tag `fork@<version>` on a commit that is on `main`. Pull requests only run a dry run and publish nothing.
- The source code keeps the upstream package name.
- `docs/RELEASING.md` describes the upstream packages. For the fork, see decision 005 and the publish workflow.

## Known limits

- The package is not published yet. The owner must first enable GitHub Actions, confirm the npm scope, add the npm token, and push the first tag.
- The repository and the built code are public.

## Out of scope

- Publishing `ui-tokens` or `ui-codemod`.
- Renaming the package in the source.
- An installation page in Storybook.
