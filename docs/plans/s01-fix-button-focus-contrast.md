---
validated: no
---
# Plan — Story s01-fix-button-focus-contrast

Branch: `feature/s01-fix-button-focus-contrast` (framing) · tickets: `feature/s01-fix-button-focus-contrast/<ticket-id>`
Research: `docs/research/s01-fix-button-focus-contrast.md` — read it first; this plan does not repeat it.

## Target story
**As a** keyboard user of a La Suite application **I want** a visible focus ring on every button **so that** I can see where I am. Complexity 2.
Acceptance criteria (docs/stories.md):
- Every `Button` variant (primary, secondary, tertiary, bordered) in every colour (brand, neutral, warning, error, success, info) draws the same two-part focus ring: an inner gap painted with `contextuals.background.surface.primary` (no literal `#fff` left in `button/_base.scss`) and an outer ring in the colour's border token.
- In each of the six themes and for each of the six colours, the outer ring has a contrast ratio of at least 3:1 against the inner gap and against the page surface, checked by a Vitest test computed from `src/cunningham-tokens.ts`.
- Widths of gap and ring, sizes and non-focus appearance are unchanged (existing tests pass).
- No new accessibility violation on the `Button` stories.

## Tickets (ordered)
### t01-focus-contrast-test
- **size:** S
- **estimate:** 1d
- **depends on:** none
- **scope:** a Vitest spec that guards the focus ring, written first and failing on the literal `#fff`.

Tasks:
1. [ ] Create `packages/ui-components/src/components/button/focus-ring.spec.tsx` (name next to `index.spec.tsx`). It imports `tokens` from `:/cunningham-tokens` and computes the WCAG contrast ratio with a small helper local to the spec.
2. [ ] For each of the six themes (`default`, `dark`, `dsfr-light`, `dsfr-dark`, `anct-light`, `anct-dark`) and each of the six colours (`brand`, `neutral`, `warning`, `error`, `success`, `info`), assert `border.semantic.<colour>.primary` against `background.surface.primary` is at least 3:1. The test must fail if a theme or colour token is missing (no silent skip).
3. [ ] Read `button/_base.scss` as text and assert that no `focus-visible` block contains a literal hex colour and that each `box-shadow` uses `var(--c--contextuals--background--surface--primary)` for its inner gap. This test fails today (four literal `#fff`).
4. [ ] Run `yarn test` for this spec only; record the red result in the ticket (it fails on task 3, passes on task 2).

### t02-focus-ring-surface-gap
- **size:** XS
- **estimate:** 0.5d
- **depends on:** t01-focus-contrast-test
- **scope:** replace the literal gap by the surface token, changeset, Storybook check, artifact.

Tasks:
1. [ ] In `button/_base.scss`, inside `button-variant`, replace the inner `0 0 0 1px #fff` of the four `&:focus-visible` blocks (primary, secondary, tertiary, bordered) by `0 0 0 1px var(--c--contextuals--background--surface--primary)`. Touch nothing else in the file.
2. [ ] `focus-ring.spec.tsx` is now green; `button/index.spec.tsx` and the full `yarn test` still pass.
3. [ ] Open the `Button` stories in Storybook (port from `bash .dm/lib/dm-port.sh`), keyboard-focus each variant, check light and dark, and run the Storybook a11y panel: no new violation. Stop the server afterwards.
4. [ ] Add a changeset in `.changeset/` (package `@gouvfr-lasuite/ui-components`, patch) with a gitmoji-style summary.
5. [ ] Update the design-system artifact: the `Button` page note on the focus ring, and republish after re-reading the published index. The PR description carries `Artifact: updated (version <id>)`.
6. [ ] Run `yarn lint`, `yarn check-locales`, `yarn build`.

## US totals
- **Person-days:** 1.5
- **Size mix:** 1×S, 1×XS

## Run interdicts
- Do not change the width of the gap or the ring (1px and 4px), the sizes, the hover, active or disabled states, or any non-focus colour of `Button`.
- Do not edit `src/cunningham-tokens.*` (generated) and add no new token: the story reuses `contextuals.background.surface.primary`.
- Do not touch `ProConnectButton` or `button/_suite.scss`.
- Add no dependency.
- No literal hex colour in `button/_base.scss` focus rules after the change.

## The point everything turns on
The ring is measured against the colours next to it (inner gap and page surface), not against the button fill. Because the gap now follows the surface token, the ring/gap and ring/page ratios are the same number, so the single token comparison in t01 proves both halves of the criterion.

## Files touched
- t01: `packages/ui-components/src/components/button/focus-ring.spec.tsx` (new).
- t02: `packages/ui-components/src/components/button/_base.scss`, `.changeset/<name>.md` (new), the artifact (outside the repo).

## Test strategy
- Unit (Vitest, jsdom): token contrast for 6 themes × 6 colours, and a text check on the stylesheet. SCSS is not rendered in jsdom, so the stylesheet check is textual by design.
- Manual: Storybook keyboard focus and a11y panel (no e2e is added: the change is presentational and the textual and token tests cover the behaviour that can fail).
- Prerequisite: dependencies must install. The Yarn cache is currently corrupted (`@fontsource-variable/roboto-flex`, `downshift`); `yarn cache clean` is to be run before `/dm-execute`.

## Definition of Done
Single PR into `next` per ticket, structured description with `Artifact: updated (version <id>)`, readable diff, `yarn lint`, `yarn check-locales`, `yarn test` and `yarn build` pass, review passed (no open critical or major), merged to `next`.
