# Review s06-waffle-user-menu / t02-user-menu-tokens

Branch `feature/s06-waffle-user-menu/t02-user-menu-tokens` (verified), one commit `84245474`. Judged against the t02 section of the plan only (t03 deferred).

## Checks run
- `yarn workspace @gouvfr-lasuite/ui-tokens build`, then `TZ=UTC yarn test --concurrency=1`: 47 files, 989 tests green (no flaky failure seen). `yarn lint`, `yarn check-locales`, `yarn build`: green. `cunningham-tokens-sass.scss` restored to the commit's version afterwards (`git status` clean).
- Constraint "markup unchanged": `index.tsx` is absent from the diff. `UserMenu.spec.tsx`: the diff has no `-` line; only imports (`fs`, `path`, `defaultTokenRefs`, `./tokens`) and appended describes. The t01 exact-DOM tests are untouched and green.
- Generated files: parsed `cunningham-tokens.ts` before/after for the 6 themes. The only change is a new `components["user-menu"]` with 8 keys per theme. Everything else is identical (including the globals). `cunningham-tokens.css`: +8 declarations x 6 blocks, nothing else.
- `cunningham-tokens-sass.scss`: the added lines equal those added to `cunningham-tokens.scss` (diff empty), with no removed line, same placement. The owner-delegated hand edit is faithful.
- Token values equal the old literals: 272px, 1px, 8px, `0 6px 20px 0 rgba(0, 0, 18, 0.10)`, 1px, 4px, 2px. Spacings read in the CSS: 3xs 0.25rem = 4px, xxs 0.375rem = 6px (the old fallback), xs 8px, sm 0.75rem = 12px. `calc(xs - border-width)` = 7px. The close button 8px, mobile padding 12px, footer border 1px, trigger padding 4px all render the same. Rendered output is unchanged except the ring.
- Stylesheet grep (by hand and via the guard): no hex/rgb/hsl, no `var(..., fallback)`. Remaining `px` literals are only `width`/`height`/`min-width`/`max-width`/`flex`/`line-height`/svg sizes (40px, 32px, 40px mobile, 51px, 16/24px, `100vw - 32px`, 16/18px), all in the allowed list. Nothing remains in padding/margin/gap/border/box-shadow/outline. AC1 is met for the stylesheet.
- No new dependency (package.json untouched). Changeset `patch` for `@gouvfr-lasuite/ui-components`, with the plan's line: accurate.
- Contrast: the spec covers 6 themes x {text, e-mail, icons, ring} on the surface and on the hover composited on the surface. All green. The ring `content.semantic.brand.tertiary` passes at >= 3:1.

## Mutations (each restored; `git diff --exit-code` clean, then `git status` clean at the end)
| Mutation | Red tests |
| --- | --- |
| box-shadow back to `rgba(0, 0, 18, 0.1)` | 3 |
| `var(--…xxs, 6px)` fallback back | 2 |
| forced-colors rule removed | 1 |
| ring token -> `border.semantic.neutral.primary` + `build-theme` | 1 (`dark`, focus ring) |

All four bite. No worker process of mine left behind (the playwright-mcp processes listed are not mine).

## Findings
- minor 1: the `box-shadow: none` and the new ring also apply to the Terms link and the language selector (same selector as before, declared). This is coherent with the design, but the override of the Button's own ring depends on the cascade. It is not verified in a browser (see below).
- minor 2: `.user-menu__trigger` is a dead selector (declared), tokenised anyway. Harmless; delete it in a later cleanup ticket.
- minor 3 (open question): the design table says the trigger gets the brand-tertiary ring too. The plan covers only the popover interior, and the trigger keeps the Button ring from s01. I judge the plan's reading acceptable: the trigger is a kit Button with its own tokenised ring, and changing it would be out of t02's scope. If the owner wants the design table applied literally, it is a follow-up. Not blocking.
- minor 4: the guard (b) tweaks (whitespace collapsed, `flex` in the list) are legitimate. The `flex` entry lets any `flex: 0 0 Npx` pass, an acceptable ceiling.
- The extra tokenisations beyond task 4 are equal-value and within the AC1 spirit. No drift against the plan: tasks 1 to 6 are present, with the plan checkboxes ticked. The note `Artifact: updated (version <id>)` is added by the main agent (noted only).
- No contradiction found with the research, the accepted ADRs, or AGENTS.md (BEM, component tokens, registration in `cunningham.ts`).

## Could NOT verify
- Rendering in a real browser (Storybook, Playwright CT): the focus ring inside the popover, the overlap with the Button's own ring (specificity of `box-shadow: none`), forced-colors mode, and the mobile layout. Vitest only reads the stylesheet. Human gesture: open the UserMenu story in desktop and mobile, press Tab through the items, the Terms link, the language selector and the close button; check the 2px brand ring is not clipped; enable Windows high-contrast or Chrome's forced-colors emulation.
- The ring on the trigger (see minor 3) and the published design-system artifact.
- The playwright CT suite was not part of `yarn test` here.

Max severity: minor
Ship allowed: yes
