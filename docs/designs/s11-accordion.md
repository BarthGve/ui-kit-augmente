# Design — Story s11-accordion

Component story, no screen. Agent-derived from `docs/design-system.md` and from the Card design (`docs/designs/s10-card.md`); to be reviewed by the owner before planning (stories.md: "design to be reviewed"). Values read from `packages/ui-components/src/cunningham-tokens.css`.

## Screen(s)
Anatomy of one `Accordion`, a vertical stack of items separated by dividers:

```
+--------------------------------------+  c__accordion
| Section title                     v  |  c__accordion__item > __heading > __trigger (full-width button)
|--------------------------------------|  divider (border-bottom of the item)
| Section title                     ^  |  expanded: chevron rotated
|   panel content                      |  c__accordion__panel > __panel-content
|--------------------------------------|
| Section title                     v  |
+--------------------------------------+
```
- `Accordion` is the group (single-open by default, `allowsMultipleExpanded` for multiple). `AccordionItem` takes `id`, `title`, `children`, optional `headingLevel` (default 3) and `isDisabled`.
- The trigger is a native `<button>` inside a heading, label on the left, chevron (`expand_more`, Material Icons via the existing `Icon`, `aria-hidden`) on the right; the whole row is the hit target.
- The group fills its container's width and has **no outer card chrome**: a top and bottom hairline frame the list (flush list). Spacing handling follows Card: a single padding token applied to trigger and panel content, no margin between items, dividers carry the separation (no `gap`, so no stray space between items and no double border).
- Long titles wrap (`overflow-wrap: anywhere`, `min-width: 0`); the chevron keeps its size (`flex: none`).
- Variants: **none**. One look. (Boxed/card-like variant not requested.)

## Mockup
None, on purpose (same reasoning as Card): anatomy and token table are enough; `accordion.stories.tsx` is the visual reference.

## Reused components (from the design system)
- `Icon` (`expand_more`) for the chevron. Nothing else is composed in the component; stories show `Badge`/`Button` inside a panel as typical content only.
- Visual neighbours: `Card` (border colour, hover tertiary background, outline ring) and `Tabs` (outline ring, `data-focus-visible`).

## States
| State | Rendering |
|---|---|
| collapsed | panel hidden (not rendered visually, not focusable, hidden from AT); chevron pointing down |
| expanded | panel visible; chevron rotated 180deg; `aria-expanded="true"` on the trigger |
| hover | trigger background `trigger-background-color--hover` (opaque neutral tertiary); cursor pointer |
| focus-visible | `outline` of `focus-ring-width` in `focus-ring-color`, offset `focus-ring-offset` (negative, so the ring stays inside the row and is not clipped by an ancestor `overflow`); keyboard focus only |
| active (pressed) | same as hover (no extra value invented) |
| disabled | trigger text and chevron in `color--disabled`, `cursor: not-allowed`, no hover background, skipped by arrow keys, not focusable |
| forced-colors | `outline-color: Highlight`; chevron `forced-color-adjust` left to the browser (it inherits `currentColor`); dividers kept as borders |
| reduced motion | the height transition of the panel and the chevron rotation are removed under `prefers-reduced-motion: reduce` |

Motion when allowed: panel `height` from `--disclosure-panel-height` (set by React Aria) and chevron `transform`, both `globals.transitions.duration` with `ease-out`. If the height variable is absent (SSR, jsdom) the panel simply appears; no layout depends on it.

Empty/loading/error/success: not applicable (presentational; the consumer fills the panels).

## Tokens
All declared in `src/components/accordion/tokens.ts`, registered as `accordion` in `cunningham.ts`, emitted as `--c--components--accordion--<name>` in the six themes by `yarn build-theme`. Contextual and global tokens only, so the six themes follow without per-theme code.

| Token | Value | Light / dark resolved |
|---|---|---|
| `color` | `contextuals.content.semantic.neutral.primary` | gray-850 / existing dark value |
| `color--disabled` | `contextuals.content.semantic.disabled.primary` | gray-300 (light) |
| `border-color` | `contextuals.border.surface.primary` | gray-100 / gray-750 |
| `border-width` | `1px` | literal (gap 2), same as Card/Calendar |
| `trigger-background-color--hover` | `contextuals.background.semantic.neutral.tertiary` | gray-050 / gray-750 |
| `trigger-font-weight` | `globals.font.weights.bold` | 600 |
| `trigger-padding` | `globals.spacings.base` | 1rem, applied to the trigger |
| `panel-padding` | `globals.spacings.base` | 1rem, applied to the inner panel wrapper |
| `icon-size` | `1.5rem` | literal (gap 3), Material Icons' native 24px |
| `focus-ring-color` | `contextuals.content.semantic.brand.tertiary` | brand-550 / brand-250 (was `border.semantic.brand.primary`, changed in t02: see the contrast note) |
| `focus-ring-width` | `2px` | literal (gap 2), same as Card/Tabs |
| `focus-ring-offset` | `-2px` | literal (gap 2): inside the row |

BEM classes: `c__accordion`, `c__accordion__item`, `c__accordion__heading`, `c__accordion__trigger`, `c__accordion__title`, `c__accordion__icon`, `c__accordion__panel`, `c__accordion__panel-content`; state through RAC attributes (`[data-expanded]`, `[data-disabled]`, `[data-focus-visible]`). No literal colour, spacing or radius in `index.scss`. No radius token (flush list, no rounded container).

## Dark theme and the six themes
- Text, dividers and hover come from contextual tokens, so dark/DSFR/ANCT follow. Ring contrast against the adjacent surface is checked numerically in t02 (>= 3:1 in the six themes, technique of `button/focus-ring.spec.tsx`). In t02 the first token, `border.semantic.brand.primary`, failed that check on the hover background in the three dark themes (2.95 / 2.96 / 2.98 against gray-750). Owner-delegated decision: the ring uses `content.semantic.brand.tertiary`, unchanged in the light themes and at least 4.70:1 against both `surface.secondary` and the hover tertiary in all six themes.
- With a negative offset the ring is drawn over the trigger's own background: the ring colour must contrast with `surface.secondary` and the hover tertiary, not with the page; the t02 check uses both.
- Hover cue is the tertiary background plus the cursor; the focus ring is the non-colour signal. Expanded state is conveyed by the chevron rotation (shape), not colour alone.

## Responsive behaviour
No breakpoint. Fluid width; padding does not shrink on mobile; trigger label wraps. Touch target: the trigger row is at least 44px high with 1rem padding and a 24px icon (about 56px), above WCAG 2.5.8.

## Accessibility contract (RGAA / WCAG 2.2)
- Structure (APG accordion): `heading (level = headingLevel) > button[aria-expanded][aria-controls]`; panel `role="group"` with `aria-labelledby` = trigger id (React Aria default; `region` not used to avoid a landmark flood with many items).
- Enter and Space on a trigger toggle (React Aria `useDisclosure`); click/tap toggles.
- Arrow keys (required by AC3, **added by the component**, not provided by React Aria): `ArrowDown` / `ArrowUp` move focus to the next / previous enabled trigger of the same accordion, wrapping; `Home` / `End` go to the first / last enabled trigger. They act only when focus is on a trigger, so arrows inside panel content (inputs, textareas) are untouched. `Tab` still moves through all triggers and panel content in DOM order (APG: triggers stay in the tab sequence).
- Collapsed panel: `hidden="until-found"` and `aria-hidden`: content is neither focusable nor read; browser find-in-page can expand it.
- Visible focus ring on `:focus-visible` >= 3:1, surviving forced colors; target size above 24px.
- `prefers-reduced-motion` removes animation; no information depends on motion.
- The consumer provides the heading level that fits the page outline; the component imposes a default of 3 only.
- Storybook a11y addon reports no violation on every story.

## i18n
None: the component renders consumer content and a decorative icon; it owns no string. No change in `src/locales/*.json`; `yarn check-locales` unchanged.

## Design system gaps
Reported, **not** filled by invention; resolved by reusing existing values, owner confirms at the plan checkpoint.
1. **No disclosure/accordion pattern in the system.** The Alert's expandable mode is a different pattern (icon button swapping two renders). The Accordion is a new component built from existing tokens, not a restyle of the Alert.
2. **Border width and focus-ring width/offset are not global tokens** (component-level literals, as Card/Tabs): `1px`, `2px`, `-2px` live in `tokens.ts`. The negative offset differs from Card's `2px` because the trigger is a full-width row inside a list; to be confirmed.
3. **No global icon-size token**: `icon-size` is a component literal `1.5rem` (Material Icons' base size).
4. **No chevron/disclosure icon convention**: `expand_more` rotated 180deg is proposed (no `expand_less` swap, so a single glyph and a pure CSS transform). Alert uses `add`/`remove`; not reused because Accordion is not a plus/minus pattern.
