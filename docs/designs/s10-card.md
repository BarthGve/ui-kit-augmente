# Design — Story s10-card

Component story, no screen. Agent-derived from `docs/design-system.md`; to be reviewed by the owner before planning (stories.md: "design to be reviewed"). Values read from `packages/ui-components/src/cunningham-tokens.css`.

## Screen(s)
Anatomy of one `Card`, a vertical stack inside a bordered, rounded, elevated surface:

```
+--------------------------------------+  c__card
| header (optional)                    |  c__card__header   divider below
|--------------------------------------|
| body (children)                      |  c__card__body
|--------------------------------------|
| footer (optional)                    |  c__card__footer   divider above
+--------------------------------------+
```
- `header` and `footer` are optional props taking any `ReactNode`; when omitted, their wrapper is **not rendered** (no empty padded strip, no stray divider). The body is `children`.
- Each section has the same inner padding; the dividers use the surface border colour. A card with only a body is a padded box.
- The card fills the width of its container (`display: block`, `min-width: 0`); long unbroken text wraps (`overflow-wrap: anywhere`). Height follows content.
- **Interactive** (optional behaviour), same visual anatomy:
  - `href` -> the whole card is a link (`<a>`); `onPress` -> the whole card is a button (`<div role="button" tabindex="0">`). Mutually exclusive.
  - Not offered in v1: `isDisabled`, nested actions, stretched-link. A card that needs buttons in its footer stays **static**.
- Variants: **none**. One look. (A tinted/outlined variant is not requested; add on demand.)

## Mockup
None. A static HTML reference was skipped on purpose: the component is a bordered box with three stacked slots, fully described by the anatomy and the token table; `Card.stories.tsx` (t01) is the visual reference. Execute builds with real tokens.

## Reused components (from the design system)
- None composed inside Card (it is a container). Stories compose `Button`, `Badge` and `Icon` in header/footer to show typical use; the interactive stories use plain text content only.
- Visual neighbours for consistency: `Modal` (8px radius, surface secondary, border, shadow token) and `Calendar` (opened state: 1px surface border, 8px radius, `0 2px 4px rgba(0,0,0,0.05)`).

## States
Static card: default only.

Interactive card:
| State | Rendering |
|---|---|
| default | surface background, border, resting elevation |
| hover | background `background-color--hover` (opaque neutral tertiary), pointer cursor, same elevation |
| focus-visible | ring: `outline` of `focus-ring-width` in `focus-ring-color`, `focus-ring-offset` from the border box, follows the radius; no background change needed. Keyboard focus only (`:focus-visible`), not on mouse click |
| active (pressed) | same as hover (no extra value invented) |
| disabled | not offered in v1 |
| forced-colors | `outline-color: Highlight` (as Tabs, `tabs/index.scss:122-127`); border kept |
| reduced motion | the only transition (background, `globals.transitions.duration`) is dropped under `prefers-reduced-motion: reduce` |

Empty/loading/error/success: not applicable (presentational; the consumer fills the slots).

## Tokens
All declared in `src/components/card/tokens.ts`, registered as `card` in `cunningham.ts`, emitted as `--c--components--card--<name>` in the six themes by `yarn build-theme`. Only contextual and global tokens, so the six themes (`default`, `dark`, `dsfr-light`, `dsfr-dark`, `anct-light`, `anct-dark`) follow without per-theme code.

| Token | Value | Light / dark resolved |
|---|---|---|
| `background-color` | `contextuals.background.surface.secondary` | gray-000 / gray-850 |
| `background-color--hover` | `contextuals.background.semantic.neutral.tertiary` | gray-050 / gray-750 |
| `color` | `contextuals.content.semantic.neutral.primary` | gray-850 / existing dark value |
| `border-color` | `contextuals.border.surface.primary` | gray-100 / gray-750 |
| `border-width` | `1px` | literal, same as Calendar's `1px` border |
| `border-radius` | `8px` | literal (design-system gap 2), same as Modal/Calendar |
| `box-shadow` | `0 2px 4px rgba(0, 0, 0, 0.05)` | literal (design-system gap 1), existing Calendar shadow |
| `padding` | `globals.spacings.base` (1rem) | applied to header, body and footer |
| `header-font-weight` | `globals.font.weights.bold` | 600 |
| `focus-ring-color` | `contextuals.border.semantic.brand.primary` | brand-550 / brand-450 |
| `focus-ring-width` | `2px` | literal (gap 2), same as Tabs |
| `focus-ring-offset` | `2px` | literal (gap 2), same as Tabs |

BEM classes: `c__card`, `c__card--interactive`, `c__card__header`, `c__card__body`, `c__card__footer`. No literal colour, spacing or radius in `index.scss`.

## Dark theme and the six themes
- Surface, border and text come from contextual tokens, so dark/DSFR/ANCT follow. Verified numerically in t02 (ring colour against the page surface >= 3:1 in the six themes, the technique of `button/focus-ring.spec.tsx`).
- In dark themes a 5% black shadow is nearly invisible: the **border** is what carries the card's edge there. This is intended; no dark-specific shadow is invented.
- Hover token `neutral.tertiary` is lighter than the surface in both modes (gray-050 over white, gray-750 over gray-850), so the hover cue exists in each mode without relying on colour alone: the cursor changes and the focus ring is the non-colour signal for keyboard users.
- The consumer's page background must differ from the card surface for the ring to be seen; the 2px offset leaves the page background visible between border and ring.

## Responsive behaviour
No breakpoint. Fluid width, wraps text, no fixed height. Padding does not shrink on mobile (1rem). Grids/lists of cards are the consumer's layout.

## Accessibility contract (RGAA / WCAG 2.2)
- Static card: a plain `div`, no role (not a landmark, not a region). If a consumer wants a name, they add `role="group"` with `aria-label` or `aria-labelledby` through props (spread on the root).
- `href`: native `<a href>`; accessible name from content (or consumer `aria-label`/`aria-labelledby`); Enter activates.
- `onPress`: `role="button"`, `tabindex=0`, Enter and Space activate (React Aria `useButton`); accessible name from content or consumer label.
- **No interactive descendant inside an interactive card** (axe `nested-interactive`); documented in `Card.mdx`.
- Visible focus ring on `:focus-visible` with contrast >= 3:1 against the adjacent page surface (WCAG 2.4.11/1.4.11), surviving forced colors.
- Hover/focus must not be the only way to see the content; heading semantics inside the header are the consumer's (`h2`..`h6`), Card imposes none.
- Storybook a11y addon reports no violation on every story.

## i18n
None: Card renders consumer content only and owns no string. No change in `src/locales/*.json`; `yarn check-locales` unchanged.

## Design system gaps
Reported, **not** filled by invention. Both resolved here by reusing existing values; the owner confirms at the plan checkpoint.
1. **No elevation/shadow token** exists in the global system (shadows are per-component literals: Modal, Tooltip, Calendar, `%shadow`). Card uses a component token `box-shadow` set to the existing Calendar resting shadow. A global elevation scale (and then re-pointing Modal, Calendar, Card) is a separate story if wanted.
2. **Radius, border width and focus-ring width/offset are not global tokens** (radius is per component by design: `docs/design-system.md`; ring offsets are literals in Tabs/file-uploader). Card holds them as component tokens, with the values already used by Modal/Calendar/Tabs.
3. **Focus ring recipe differs from Button's** (`outline` instead of the 1px surface + 4px ring `box-shadow` pair of s01), because `box-shadow` carries the elevation and is dropped in forced colors. Same colour token; the offset gap plays the role of the surface-colour gap. To be confirmed.
