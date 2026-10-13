---
validated: yes
---
# Plan — Story s57-consume-fork

Branch: `feature/s57-consume-fork` (framing) · ticket: `feature/s57-consume-fork/t01-install-docs`
Research: `docs/research/s57-consume-fork.md`. No UI design.

## Target story
**As a** developer of an application **I want** installation instructions for the fork **so that** I use it without changing my imports. Complexity 2. Criteria: `docs/stories.md` (amended 2026-10-13: honest state until the first publish).

## Tickets (ordered)
### t01-install-docs
- **size:** S
- **estimate:** 1d
- **depends on:** none (s56 is merged)
- **scope:** `README.md`, `packages/ui-components/README.md`, `packages/ui-components/src/docs/installation.mdx`. Docs only.

Tasks:
1. [x] Prove the interim path first: in a throwaway app outside the repository (scratchpad), `yarn build`, `yarn fork:stage 1.4.0-fork.1`, install the archive with `yarn add "@gouvfr-lasuite/ui-components@file:<archive>"` and `@tanstack/react-query`, then compile a tiny file importing `Button`, `CunninghamProvider` and the `./style` import (a TypeScript check or a bundler run). Record the exact commands and the result (including any peer warning) — the docs quote these commands.
2. [x] Write the section "Install the fork" shared by the three places (same wording, adapted to Markdown/MDX): what the package is (`@barthgve/ui-components`, `x.y.z-fork.N`, only `ui-components` published; `ui-tokens` and `ui-codemod` remain upstream), the alias install for Yarn and npm (flagged: available after the first publish; link ADR 005), the interim archive install (commands of task 1), peers and style/font imports (existing text kept).
3. [x] Root `README.md`: add an "Install" section before "Development"; the package table row of `ui-components` points to the fork name; keep the codemod paragraph (upstream). `packages/ui-components/README.md`: replace the `yarn add` block. `installation.mdx`: same, keep `Source` blocks.
4. [x] Check: `yarn prettier --check` on the three files, `yarn lint`, a grep that no remaining line presents `yarn add @gouvfr-lasuite/ui-components` as the way to get the fork, Storybook builds (`yarn build-storybook` or the existing CI job) with the MDX page. PR lists the unverified part (the alias command until the first publish) and the owner follow-up (one-line removal of the "not yet published" notice after the first publish). PR line `Artifact: not applicable (docs only)`.

## US totals
- **Person-days:** 1.0
- **Size mix:** 1×S
- Split needed: no. ADR needed: no.

## Run interdicts
Docs only: no code, no locale, no dependency, no workflow. Never present the alias command as working before the first publish. Do not publish, tag or touch secrets.

## Files touched
`README.md`, `packages/ui-components/README.md`, `packages/ui-components/src/docs/installation.mdx`.

## Test strategy
Throwaway-app install of the staged archive (real), prettier and lint, Storybook build for the MDX page. The alias form is checked by reading, then by the owner after the first publish.

## Definition of Done
Single PR into `next`, structured description, checks green in CI (except `e2e` until s59), review `Ship allowed: yes`, merged.
