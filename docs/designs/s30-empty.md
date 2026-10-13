# Design — Story s30-empty

Component story, no screen. Agent-derived from `docs/design-system.md` and the Card / Timeline designs; to be reviewed by the owner (stories.md: shadcn Empty, owner request). Values read from `packages/ui-components/src/cunningham-tokens.css`.

## Screen(s)
```
+------------------------------------+  c__empty (centred column)
|              [ media ]             |  c__empty__media (optional)
|             Title (hN)             |  c__empty__title  (required, heading level = headingLevel)
|  Description, a sentence or two    |  c__empty__description (optional)
|        [ Action ] [ Action ]       |  c__empty__actions (optional)
+------------------------------------+
```
- Props: `title: ReactNode`, `headingLevel?: 1|2|3|4|5|6` (default 3), `description?`, `media?`, `actions?`, `className?`, `aria-label` / `aria-labelledby` (adds `role="group"` only then), div attributes forwarded. Absent slots render nothing.
- Root fills its container width, content centred, max text width for readability (`description-max-width`).
- Variants: none.

## Mockup
None, on purpose (same as Card, Accordion, Timeline): anatomy and token table suffice; `empty.stories.tsx` is the visual reference.

## Reused components (from the design system)
`Button` and `Icon` appear in stories as typical `actions` / `media` only; the component imports neither.

## States
Presentational: no interactive, loading or error state. Variations covered by stories: all slots, title only, title + description, media + title + actions, each heading level.

## Tokens
Declared in `components/empty/tokens.ts`, registered as `empty`, emitted as `--c--components--empty--<name>` in six themes.

| Token | Value | Note |
|---|---|---|
| `title-color` | `contextuals.content.semantic.neutral.primary` | |
| `title-font-weight` | `globals.font.weights.bold` | |
| `description-color` | `contextuals.content.semantic.neutral.secondary` | |
| `media-color` | `contextuals.content.semantic.neutral.tertiary` | decorative, 3:1 asserted |
| `media-size` | `3rem` | literal, design-system gap 1 |
| `padding` | `globals.spacings.xl` | |
| `gap` | `globals.spacings.sm` | between slots |
| `actions-gap` | `globals.spacings.xs` | between actions |
| `description-max-width` | `28rem` | literal, gap 2 |

## Responsive behaviour
Fluid; text wraps (`overflow-wrap: anywhere`); actions wrap (`flex-wrap`).

## Accessibility contract (RGAA / WCAG 2.2)
- Title is a real heading; the caller picks the level for the page outline.
- No `role` by default (no landmark); `role="group"` only if a name is given.
- Media is the consumer's: decorative media gets `aria-hidden`, informative gets an `alt`.
- Text contrast >= 4.5:1 in six themes (guard test); logical CSS properties.
- No i18n key.

## Design system gaps
1. `Empty` does not exist in the system (DataGrid has an ad hoc placeholder, `c__datagrid__empty-placeholder`): this document is its first definition.
2. No global media-size or max-text-width token: component literals `3rem`, `28rem`.
3. DataGrid's placeholder is not migrated (out of scope).
