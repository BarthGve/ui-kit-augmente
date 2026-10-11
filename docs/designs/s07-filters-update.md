# Design — Story s07-filters-update

Design system: `docs/design-system.md` (QuickSearch, Filter, SearchFilter, search and filtering). Reference: ui-kit #259 (Figma 6977-6508, image read: filter bar of compact pill buttons with icon, chevron, trailing reset icon, overflow arrows). **No mockup `.html`: this plan proposes no visual change.** The approved #259 visuals are a different, larger redesign (see research fact 1) and are out of this story.

## Decision
The shipped look of `Filter` and `SearchFilter` stays pixel-identical. The story delivers: stories per state, DOM guards, an additive `onReset`, and the literals moved to component tokens with unchanged values. No new component, no new global token, no new locale key.

## States (stories, evidence for AC1)
| State | `Filter` | `SearchFilter` |
|---|---|---|
| default | `Uncontrolled` (exists) | `Basic` (exists) |
| active | `UncontrolledWithDefault` (exists) | new `Active` (`selected` + `activeLabel`) |
| open | new `Open` (`defaultOpen`) | new `Open` (`isOpen`) |
| loading | not applicable (static options) | `Loading` (exists) |
| empty | not applicable | `Empty` (exists) |
New stories only reuse existing props; the open stories use a decorator with enough height for the popover.

## Tokens (t03, values copied from the stylesheets, none invented)
`--c--components--filter--*`: `button-height` 32px, `button-radius` 4px, `button-border-width` 1px, `button-font-size` 14px, `button-font-weight` 400, `button-active-font-weight` 500, `button-gap` 6px, `button-padding` `0 6px 0 8px`, `icon-size` 1.25rem, `popover-padding` 8px. `--c--components--search-filter--*`: `popover-min-width` 240px, `popover-max-width` 320px, `search-height` 36px, `list-max-height` 240px, `item-min-height` 32px, `item-font-weight` 500, `message-padding` 8px, `user-row-gap` 16px. Spacing and font fallbacks (`var(--c--globals--spacings--xs, 8px)`) lose their literal fallback; globals already exist. Colours keep their existing contextual tokens. Literal-without-global-token cases are commented in `tokens.ts` as design-system gaps (as `users/menu/tokens.ts`), reported not filled.

## Interactions (unchanged, to be guarded)
Select an option: trigger active, label `"label : option"`. Reset row (only with a value and `showReset`): clears, keeps the popover open, calls `onReset` (new). SearchFilter: typing filters `items` (caller), selection and trigger label untouched; picking an item clears the search and closes. Keyboard: Enter/Space/ArrowDown open; arrows move; Enter selects; Escape closes and returns focus to the trigger; reset row reachable by Tab.

## Deferred visuals (not in the plan's merged scope)
- Hover/focus label colour on the trigger: `neutral.tertiary` is 4.16:1 on `neutral.tertiary-hover` in light themes; `neutral.secondary` gives at least 4.99:1 (t04, owner decision).
- Explicit focus ring on the trigger (candidate `content.brand.tertiary`, at least 3.62:1 on every trigger background). The browser outline stands until decided.
- Accessible name and announcement for loading/empty rows (needs one locale key in five locales).
- #259 bar: icon, overflow arrows, trailing reset, buttons instead of a component: new story and ADR.

## Design system gaps
No component-level tokens exist for filters; no border-width or radius global used by these controls. Reported, not filled.
