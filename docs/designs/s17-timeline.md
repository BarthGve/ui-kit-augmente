# Design — Story s17-timeline

Component story, no screen. Agent-derived from `docs/design-system.md` and the Card / Accordion designs (`docs/designs/s10-card.md`, `s11-accordion.md`); to be reviewed by the owner before planning (stories.md: "design to be reviewed"). Values read from `packages/ui-components/src/cunningham-tokens.css`.

## Screen(s)
Anatomy of one `Timeline` (an ordered list; items in the caller's order):

```
vertical (default)                    horizontal (scrolls on a narrow viewport)

 (✓)  12 Oct 2026                     (✓)────────(●)────────(○)────────(○)
  |   Order received                  12 Oct     13 Oct     15 Oct     —
  |   optional content                Received   Packed     Shipped    …
 (●)  13 Oct 2026   <- current        └── overflow-x: auto, focusable region ──┘
  |   Packed
 (○)  15 Oct 2026   <- upcoming
      Shipped
```

- `Timeline` takes `events: { id, date, title, content?, state? }[]`, `orientation?: "vertical" | "horizontal"` (default vertical), `dateFormat?: Intl.DateTimeFormatOptions` (default `{ dateStyle: "medium" }`), `aria-label` / `aria-labelledby`.
- Markup: `<ol role="list" class="c__timeline">` → `<li class="c__timeline__item">` → marker (`c__timeline__marker`, with connector line to the next item), `<time dateTime>` (`c__timeline__date`), title (`c__timeline__title`), optional content (`c__timeline__content`).
- State is `done`, `current` or `upcoming`; omitted = neutral marker, no state label. Each state has its own marker **shape** (done = check glyph on filled disc, current = filled dot with ring, upcoming = empty ring) plus a visually hidden label ("Done" / "Current" / "Upcoming") from the locales; the current item carries `aria-current="step"`.
- Horizontal: the `<ol>` is wrapped in a `role="region"` element with `tabindex="0"` and an accessible name, `overflow-x: auto`; items have a minimum width (`item-min-width`), titles wrap. Vertical: no wrapper.
- Long titles and content wrap (`overflow-wrap: anywhere`, `min-width: 0`).
- Variants: none beyond orientation.

## Mockup
None, on purpose (same reasoning as Card and Accordion): anatomy and token table are enough; `timeline.stories.tsx` is the visual reference.

## Reused components (from the design system)
- `Icon` (`check`) for the done marker (`aria-hidden`). Nothing else composed; stories may show `Badge` / `Button` in `content` as typical content only.
- Visual neighbours: `Separator` (hairline colour `border.surface.primary`), `Badge` (semantic success / brand / neutral roles).

## States
| State | Marker | Text |
|---|---|---|
| done | filled disc `background.semantic.success.primary` with check | title `content.semantic.neutral.primary` |
| current | filled dot `background.semantic.brand.primary` inside a ring `border`-width, title bold | `content.semantic.brand.primary`, `aria-current="step"` |
| upcoming | empty ring `border.surface.primary`-coloured, no fill | title and date `content.semantic.neutral.secondary` |
| none (no `state`) | neutral ring | neutral primary text |
| focus-visible | only the horizontal scroll region is focusable: outline `focus-ring-width` in `focus-ring-color`, offset `focus-ring-offset` | |

Empty `events` renders an empty list (no placeholder; the consumer shows `Empty`, s30). Loading / error: not applicable (presentational, no data fetching). No motion.

## Tokens
Declared in `src/components/timeline/tokens.ts`, registered as `timeline` in `cunningham.ts`, emitted as `--c--components--timeline--<name>` in six themes by `yarn build-theme`. Contextual global tokens only.

| Token | Value | Note |
|---|---|---|
| `color` | `contextuals.content.semantic.neutral.primary` | title |
| `color--muted` | `contextuals.content.semantic.neutral.secondary` | date, upcoming text |
| `color--current` | `contextuals.content.semantic.brand.primary` | current title |
| `connector-color` | `contextuals.border.surface.primary` | line between markers |
| `connector-width` | `2px` | literal (design-system gap 1) |
| `marker-size` | `1.5rem` | literal (gap 2), same as Material Icons' base 24px |
| `marker-done-background` | `contextuals.background.semantic.success.primary` | |
| `marker-done-color` | `contextuals.content.semantic.success.on-success` | check glyph |
| `marker-current-background` | `contextuals.background.semantic.brand.primary` | |
| `marker-upcoming-border-color` | `contextuals.content.semantic.neutral.tertiary` | ring needs 3:1, see contrast |
| `marker-border-width` | `2px` | literal (gap 1) |
| `title-font-weight` / `title-font-weight--current` | `globals.font.weights.regular` / `bold` | |
| `gap` | `globals.spacings.base` | between items |
| `item-gap` | `globals.spacings.xs` | marker to text |
| `item-min-width` | `12rem` | horizontal only (gap 3) |
| `focus-ring-color` | `contextuals.content.semantic.brand.tertiary` | as Accordion (4.70:1 and above 3:1 on surfaces) |
| `focus-ring-width` / `focus-ring-offset` | `2px` / `2px` | literals (as Card) |

Contrast: the plan must include a six-theme guard (technique of `button/focus-ring.spec.tsx`): text >= 4.5:1 on `surface.primary`, markers and ring >= 3:1 (non-text). If a pair fails in a theme, STOP and report, do not change an existing token.

## Responsive behaviour
Fluid width. Vertical needs no breakpoint. Horizontal never wraps to a second row: the region scrolls (AC2); the connector line continues across items.

## Accessibility contract (RGAA / WCAG 2.2)
- `<ol role="list">` of `<li>`: announced as an ordered list with N items (AC4); `role="list"` restores semantics lost by `list-style: none` in Safari / VoiceOver.
- Date in `<time dateTime=ISO>`, formatted with `Intl.DateTimeFormat(currentLocale)` (UTC for date-only strings).
- State never conveyed by colour alone: marker shape plus visually hidden text; `aria-current="step"` on the current item.
- Horizontal scroll region: `role="region"`, accessible name, `tabindex="0"` so keyboard users can scroll with arrows (axe `scrollable-region-focusable`).
- Markers are decorative (`aria-hidden`). Logical CSS properties for RTL.
- Storybook a11y addon: no violation on every story. Five locale files carry the same keys (`yarn check-locales`).

## Design system gaps
1. `Timeline` does not exist in the system (`docs/design-system.md:70` lists it as planned): this document is its first definition, to be confirmed by the owner.
2. Connector and marker border widths (`2px`) and marker size are component-level literals: no global border-width or icon-size token (same gap as Card / Accordion).
3. `item-min-width` (`12rem`) has no global counterpart; value to confirm in the owner review.
4. Upcoming-ring colour (`content.semantic.neutral.tertiary`) is a non-text use of a content token; if it fails 3:1 in a theme, the guard reports it and the owner decides.
