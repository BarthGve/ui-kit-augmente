# Research — Story s01-fix-button-focus-contrast

Worktree `.worktrees/s01-fix-button-focus-contrast`, branch `feature/s01-fix-button-focus-contrast` (from `next` at `1cda87fb`). Nothing was run: dependencies are not installed (Yarn cache corruption), so every claim below comes from reading source and from contrast computed on the generated token file.

## The five structuring facts
1. **The premise is half false.** The focus ring of the primary brand button already contrasts at 5.36:1 (light) and 3.47:1 (dark) against the page background — both above 3:1 (`_base.scss:12-16`, tokens `src/cunningham-tokens.ts`). What fails is the ring against the *button itself*: 1.00:1 in light (ring `#5E5CD0` on button `#5E5CD0`) and 1.42:1 in dark. A hard-coded 1px white gap separates them today, which is what the story's "against the button" criterion cannot see.
2. **The ring is a `box-shadow`, not an outline** (`0 0 0 1px #fff, 0 0 0 4px var(--c--contextuals--border--semantic--<ctx>--primary)`), duplicated four times per context (primary, secondary, tertiary, bordered) in `button/_base.scss`. Fixing "the primary brand button" alone leaves the other variants and the five other colour contexts (`neutral`, `warning`, `error`, `success`, `info`) generated from the same mixin with the same pattern.
3. **A literal `#fff` is hard-coded in the ring** (`_base.scss`, each variant). This breaks the repo rule "no literal colour" (AGENTS.md) and draws a bright white halo on the dark themes.
4. **The generated token file gives six themes**, not two: `default`, `dark`, `dsfr-light`, `dsfr-dark`, `anct-light`, `anct-dark`. The ring colour is the same `#5E5CD0` / `#7576EE` in all light / all dark ones (computed), so the check is the same per mode — but the acceptance criterion says "light and dark", and six themes must be verified.
5. **There is no focus test today**: `button/index.spec.tsx` contains no `focus` assertion, and Vitest/jsdom does not load SCSS, so "checked by a test on the computed tokens" means reading `cunningham-tokens.ts` and computing contrast in the test, not rendering the button.

## Target story
**As a** keyboard user of a La Suite application **I want** a visible focus ring on the primary brand button **so that** I can see where I am. Complexity scored 1.
Acceptance criteria:
- Focus ring of the primary brand `Button` has contrast ≥ 3:1 against the button and against the page background, in light and dark themes (test on the computed tokens).
- Other `Button` variants and sizes keep their current focus appearance (existing tests pass).
- The accessibility check reports no new violation on the `Button` stories.

Upstream issue ui-kit #184: "Blue CTAs have a very subtle focus ring. Focus indicators must have a minimum contrast ratio of 3:1 against the adjacent background. Focus must be visible around the entire perimeter." RGAA 10.7, severity major.

## Current state of the code
- `packages/ui-components/src/components/button/_base.scss` — mixin `button-variant($context)` generates the four variants; focus rule `&:focus-visible { box-shadow: 0 0 0 1px #fff, 0 0 0 4px var(--c--contextuals--border--semantic--#{$context}--primary); }`. On focus the background also switches to the `-hover` token.
- `button/_suite.scss` — only `.pro-connect-button` (separate component, own colours, no focus rule).
- `button/tokens.ts` — size and radius tokens only; there is **no focus-ring token**.
- `button/index.tsx` — class `c__button--<color>--<variant>`; `color` defaults to `brand`.
- `src/cunningham-tokens.ts` — generated; `contextuals.border.semantic.brand.primary` = `#5E5CD0` (light) / `#7576EE` (dark).

Contrast computed (WCAG formula) from that generated file:

| Theme | Ring | Button | Page | Ring / page | Ring / button |
|---|---|---|---|---|---|
| default, dsfr-light, anct-light | `#5E5CD0` | `#5E5CD0` | `#FFFFFF` | 5.36 | 1.00 |
| dark, dsfr-dark, anct-dark | `#7576EE` | `#5E5CD0` | `#2F303D` | 3.47 | 1.42 |

## Anchor points
- Style: `button/_base.scss`, the four `&:focus-visible` blocks inside `button-variant`.
- Token: a new `focus-ring-*` entry would go in `button/tokens.ts`, then `yarn build-theme` regenerates `src/cunningham-tokens.*` (AGENTS.md; never edit generated files). Alternatively reuse existing contextual tokens (`contextuals.border.surface.primary`, `contextuals.content.semantic.neutral.primary`).
- Test: a new spec next to `button/index.spec.tsx` (Vitest). Reading `src/cunningham-tokens.ts` directly is possible (it exports `tokens`).

## Verified APIs / functions
- `button-variant($context)` SCSS mixin — `button/_base.scss`, included for `brand`, `neutral`, `warning`, `error`, `success`, `info`.
- CSS variable `--c--contextuals--border--semantic--<ctx>--primary` — exists for all six contexts (read in the generated file for `brand`).
- `ButtonProps.variant`: `"primary" | "secondary" | "tertiary" | "bordered"`; `color` default `"brand"` (`button/index.tsx`).

## Traps & constraints
- **Shared mixin**: any change applies to every colour context and variant. Criterion 2 ("other variants keep their current focus appearance") conflicts with fixing the ring in the shared mixin; the story must say whether the other variants/contexts change too (the same defect exists there).
- **Measurement ambiguity**: "contrast against the button" depends on whether the 1px white gap counts as the adjacent colour. By the token values alone the ring/button ratio is 1.00:1 (light). A fix likely needs a two-tone ring (inner + outer) or a ring colour that differs from the button; that is a design decision.
- **Dark themes**: a literal white inner gap is high-contrast on `#2F303D`; replacing it by a token changes the look.
- **`ProConnectButton`** has no focus style at all (browser default) and is out of the story's wording.
- Existing e2e / stories reference buttons widely (HelpMenu, modals): a visual change shows up in their snapshots, if any.
- Dependencies are not installed in any worktree (`yarn install` fails on a corrupted Yarn cache for `@fontsource-variable/roboto-flex` / `downshift`): neither Vitest nor Storybook can be run until the cache is cleaned.

## Open questions
1. What does "contrast against the button" mean for the acceptance test: ring versus button fill (1.00:1 today), or ring versus the adjacent white gap? Needs a decision before planning.
2. Does the fix extend to all variants and the five other colour contexts (same code, same defect), or only `brand` `primary` as the story title says?
3. Is a two-tone ring acceptable for the approved design, or is there a reference design? No design is attached to ui-kit #184.
4. Which themes must the test cover — "light and dark" (2) or all six?

## Real complexity
Scored **1** in docs/stories.md; real: **2**. The change is small (SCSS plus a token), but the criterion cannot be met without a design decision (two-tone ring or distinct colour), must hold in six themes, needs a new contrast test that reads the generated tokens, and touches a mixin shared by 24 combinations (4 variants × 6 contexts). Not a 3: no logic, no API change.

## Split proposal
None needed.
