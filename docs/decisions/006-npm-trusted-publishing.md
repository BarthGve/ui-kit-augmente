# ADR 006 — Publish the fork with npm trusted publishing

- Status: accepted
- Date: 2026-10-14
- Scope: framing
- Supersedes: the `NPM_TOKEN` clause of ADR 005

## Context

ADR 005 publishes from the `fork@<version>` tag workflow with an `NPM_TOKEN` repository secret. The first publish showed the limits: a granular token needs the 2FA bypass to publish directly, npm is deprecating direct-publish tokens (January 2027), and a token is a long-lived secret to store, rotate and revoke. `@barthgve/ui-components@1.4.0-fork.1` was published by hand, so the package now exists and can be configured as a trusted publisher.

## Decision

- The `publish` job authenticates to npm through OIDC (`id-token: write`, already granted to that job only). No `NPM_TOKEN` secret, no `NODE_AUTH_TOKEN`.
- The trusted publisher is configured by the owner on npmjs.com for `@barthgve/ui-components`: repository `BarthGve/ui-kit-augmente`, workflow `publish-fork.yml`.
- Everything else in ADR 005 stands: tag `fork@<version>`, commit ancestor of `main`, lint/test/build first, `--provenance`, `latest` tag.

## Considered options

- Granular token with 2FA bypass — rejected: deprecated for direct publishing, long-lived secret.
- Staged publish ("Read and write (stage only)") — rejected: every version waits for a manual approval with 2FA on npmjs.com.

## Consequences

Easier: nothing to rotate or leak. Harder: the workflow file name and repository are part of the npm trust configuration; renaming either breaks publishing until the trusted publisher is updated. Not yet proven: the first tag publish after this change.

## First publish (2026-10-14)

The first tag publish (`fork@1.4.0-fork.6`) worked after the trusted publisher was recreated with `npm publish` allowed. Five earlier tags failed with `403 OIDC permission denied for this action` although the OIDC claims matched the form (repository, workflow file, no environment): the configuration held `stage publish` and `manageDistTags` but not `publish`. The token exchange succeeded, the `PUT` was refused.

- Check the real permissions with `npm trust list @barthgve/ui-components` (npm 11.15 or later, 2FA). The website form is not proof.
- A recreated configuration does not keep the earlier checkboxes: `npx npm@11.21.0 trust revoke --id <id> <package>` then `npm trust github <package> --file publish-fork.yml --repo BarthGve/ui-kit-augmente --allow-publish`.
- Ruled out: the `registry-url` option of `setup-node` and the npm version (11.19 and 11.21 both fail with the wrong permissions).
- `gh run rerun` replays the workflow of the tag commit: a workflow fix needs a new tag.
