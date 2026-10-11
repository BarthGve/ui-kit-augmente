# Design — Story s05-horizontal-tabs

Research: `docs/research/s05-horizontal-tabs.md` (read first). Reference mockup: `docs/designs/s05-horizontal-tabs.html` (static, existing behaviour, not code).

## Decision
**No new visual.** The two Figma components of ui-kit #231 ("Tab Horizontal" = Classic, "Tab Horizontal Line" = Line; image read) are what `variant="default"` and `variant="line"` already render. This document records the design as it stands so the guard ticket tests it, and lists what is not covered. The upstream image was readable; Figma node 13516-883 itself was not consulted.

## Anatomy
`div.c__tabs.c__tabs--{default|line}[.c__tabs--full-width]` > `div[role=tablist].c__tabs__list` (scrolls horizontally) > `button[role=tab].c__tabs__tab` (optional `.c__tabs__icon` 18px, `.c__tabs__label`, and for `line` an `.c__tabs__indicator`) ; then one `div[role=tabpanel].c__tabs__panel` (selected only), 12px (`spacings.xs`) below the list.

## Variants (as built)
| | default ("Classic") | line ("Line") |
|---|---|---|
| tab height | 26px | 30px |
| rest | text `neutral.tertiary`, no background | same |
| hover | background `overlay.primary`, text unchanged | text `neutral.primary`, no background |
| selected | background `overlay.primary`, text `neutral.primary` | text `neutral.primary`, underline 1.5px `currentColor` sliding between tabs |
| radius | `spacings.xxxs` | `spacings.xs` |

## States
- rest, hover, selected: as above. Selected is neutral (black), never brand blue (upstream decision).
- focus-visible: 2px solid `content.brand.primary`, offset 2px, on tab and panel; mouse focus shows no ring (`data-focus-visible`).
- disabled: text `content.disabled.primary`, `not-allowed` cursor, skipped by arrows, not selectable.

## Tokens
No `--c--components--tabs--*` token exists; none is added (it would change the shipped CSS of both variants). Values are the global contextual tokens already used in `index.scss`. No literal colour in the stylesheet today; literals are sizes only (18px icon, 18px line-height, 1.5px indicator, 2px ring). Contrast table: research doc (all text pairs at least 4.83:1 in the six themes, ring at least 8.11:1, underline at least 11.46:1; disabled text 2.03 to 2.30, WCAG-exempt).

## Narrow viewport
List is `overflow-x: auto`, tabs never shrink or wrap; the root is `min-width: 0; max-width: 100%`, so the page does not scroll horizontally; the focused tab scrolls into view. No scroll buttons or fade (none designed).

## Forced colors and reduced motion
Forced colors: selected tab gets a 1px `Highlight` outline (also stands in for the line indicator), ring `Highlight`, disabled `GrayText`. Reduced motion: the indicator moves instantly.

## Accessibility
React Aria roles: `tablist` labelled by `aria-label`/`aria-labelledby`, `tab` with `aria-selected`/`aria-controls`, `tabpanel` labelled by its tab. Left/Right/Home/End with wrap, disabled skipped; automatic activation by default, `manual` with Enter/Space; Tab goes to the selected tab, then the panel. Icon-only tabs keep `aria-label`.

## Design-system gaps (listed, not filled)
1. Hover vs selected in `default` use the same background; the image suggests a darker selected (owner decision, open question 2 of the research).
2. No component tokens for Tabs (colours, radius, heights, ring); `docs/design-system.md` lists Tabs as a component without tokens.
3. Selected `default` tab is distinguished by lightness and text colour only (pill about 1.1:1 against the surface); no non-colour cue in forced-colors-off mode.
4. No scroll affordance when the list overflows.
5. Segmented control: out of scope (s13).
