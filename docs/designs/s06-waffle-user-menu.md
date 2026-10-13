# Design — Story s06-waffle-user-menu

Research: `docs/research/s06-waffle-user-menu.md` (read first). Reference mockup: `docs/designs/s06-waffle-user-menu.html` (static, proposed focus ring and the single layout; not code). Upstream design: ui-kit #278 (image read, Figma nodes not consulted).

## Decision
**Small visual change, no new component.** The refreshed user menu of #278 is already built (272 px popover, identity, App settings first, language picker and terms in the footer). What this story changes visually: (1) the user menu stylesheet moves its literal colour, radius and spacing values onto `--c--components--user-menu--*` tokens, **same rendered values**, so no pixel moves; (2) the item focus ring becomes 2 px `content.semantic.brand.tertiary` (the current 1 px neutral ring is 2.99:1 on the hovered item in the `dark` theme); (3) the full-screen mobile layout goes away, the popover is used at every width (#278). The waffle panel is the remote widget's: out of this design.

## Anatomy (as built, class names kept)
`button.user-menu__button` (kit tertiary `Button`, 40x40, `UserAvatar` small) opens `section.user-menu__popover` (RAC `Popover` > `Dialog`, `role=dialog`, labelled "User menu"): `.user-menu__content__body` > `__user-info` (avatar 32 + `__identity` name 14 px bold, email 12 px, ellipsis) ; `__settings` > `button.user-menu__item` (icon 16 + label 12 px, 32 px high) for App settings, Manage account, Logout (each only if its prop is set) ; `.user-menu__actions` (left: `actions` slot, right: Terms of Service link). No `user`: nothing renders (not even the trigger).
Waffle: `button.lagaufre-button` (kit tertiary icon-only `Button`, 9-dot icon, `aria-label` = label) next to the widget script; the panel is injected by the widget in `#lasuite-widget-lagaufre-shadow`.

## States
| state | user menu | waffle |
|---|---|---|
| closed | trigger only, `aria-expanded=false`, label "Open user menu" | button only |
| open | popover, `aria-expanded=true`, label "Close user menu", focus inside the dialog | panel by the widget (`aria-expanded` set by the widget) |
| without user | renders nothing | not applicable (no user concept) |
| hover (item) | `overlay.primary` background | Button tertiary hover |
| focus-visible (item, trigger, terms link) | 2 px `brand.tertiary` ring **inside** the item (the popover clips with `overflow: hidden`) | Button ring (s01) |
| disabled | none: items are only rendered when set | Button |
| loading / error | not designed (widget) | widget (`loadingText`, `error`) |

## Tokens
New component tokens `user-menu` (file `components/users/menu/tokens.ts`, registered in `cunningham.ts`, emitted by `yarn build-theme` as `--c--components--user-menu--<name>`; contextual colours otherwise stay as the global `--c--contextuals--*` already used):

| token | value | source |
|---|---|---|
| `width` | `272px` | design #278 (both windows) |
| `border-width` | `1px` | literal (gap 2) |
| `border-radius` | `8px` | literal, same as Modal, Calendar, Card |
| `box-shadow` | `0 6px 20px 0 rgba(0, 0, 18, 0.10)` | literal, **same value as `modal--box-shadow`** (gap 1) |
| `item-gap` | `1px` | literal, current value |
| `item-border-radius` | `4px` | literal (today the 4px comes from the spacing token `3xs` with a `4px` fallback) |
| `focus-ring-color` | `content.semantic.brand.tertiary` | contextual |
| `focus-ring-width` | `2px` | literal, as Button/Tabs |

Everything else in `_index.scss` uses globals: `spacings.base|sm|xs|3xs`, `font.sizes.xs|sm|ml`, contextual text, surface and border tokens. Padding block of the popover is `calc(var(--c--globals--spacings--xs) - var(--c--components--user-menu--border-width))` (= today's 7 px, 1 px border included in the 8 px inset). Fallbacks (`, 6px`, `, 4px`) are dropped. `LaGaufreV2` gets no token: it has no stylesheet; its button is the Button component.
Stylesheet rule for the guard test: no hex, `rgb(`, `rgba(`, `hsl(` outside comments; no `px` or `rem` literal in `padding*`, `margin*`, `gap`, `border*`, `box-shadow`, `outline*`; sizes (`width`, `height`, `min/max-*`, `line-height`, svg `width/height`, `flex-basis`) keep their literals, listed in the test.

## Contrast (six themes, from `cunningham-tokens.css`, overlay composited)
Text on surface and on item hover: `neutral.primary` 11.46 / 9.87 minimum, `neutral.secondary` 6.43 / 5.80, icons `neutral.tertiary` 5.36 / 4.83 (all at least 4.5:1 text, 3:1 non-text). Focus ring `content.semantic.brand.tertiary`: on surface 5.35 to 6.70, on hovered item 4.83 to 5.78 (at least 3:1 everywhere). The old ring (`border.semantic.neutral.primary`) is 2.99 / 3.03 / 3.02 on the hovered item in dark, dsfr-dark, anct-dark: the reason for the change. If a token fails in the test, STOP and report; do not edit a token.

## Forced colors, reduced motion
Forced colors: the ring uses `outline` (kept in forced-colors by the browser, mapped to `Highlight` by `outline-color: Highlight` in a `@media (forced-colors: active)` block); the popover border stays visible (shadows are dropped). Reduced motion: the menu has no transition of its own (RAC `Popover` entering animation is not set), nothing to disable.

## Accessibility
Trigger: `aria-haspopup="dialog"`, `aria-expanded`, label and title swap open/close, five locales. Popover: RAC `Dialog` with `aria-label` "User menu"; opens with Enter or Space, focus enters the dialog, Tab walks the items and wraps (trapped), Escape closes and returns focus to the trigger (verified). Waffle button: icon-only with `aria-label` in the active locale; the panel is a widget `dialog` with Escape close, Tab trap and focus return (read in its source, not run). Without a user nothing is rendered, so no empty focus stop.

## Design-system gaps (listed, not filled)
1. No global elevation token; the menu's shadow is the Modal literal behind a component token (a scale would re-point Modal, Calendar, Card, UserMenu: a separate story).
2. Radius, border width and ring width are not global tokens (design-system doc: per component).
3. The waffle panel (width 340, gradient, "See more", scroll) is the remote widget; #278's target for it needs `suitenumerique/integration`.
4. No Storybook way to show the open waffle without the network (the widget is remote): the Open story uses it, tests do not.
5. The menu is a `dialog` of buttons, not a `role=menu`: no arrow-key traversal (open question 4 of the research).
