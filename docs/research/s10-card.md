# Research — Story s10-card

Worktree `.worktrees/s10-card`, branch `feature/s10-card` (from `next` at `489ab57d`). Dependencies are installed. Nothing was run or built: every claim below comes from reading source and the generated token files (`packages/ui-components/src/cunningham-tokens.css`, values read from `ui-components`, not `ui-tokens`).

## The five structuring facts
1. **The premise "no equivalent in ui-kit" is true.** `grep -rniE '\bcard\b'` over `src/`, `e2e/`, `.storybook/` and `cunningham.ts` finds no component, class or token: only a test fixture named "Full Card clickable" (`components/forms/checkbox/index.spec.tsx:157`), a doc comment (`context-menu.stories.tsx:116`) and a comment in `e2e/la-gaufre/la-gaufre-v2.spec.tsx:64`. No upstream ui-kit issue is referenced for s10 in `docs/stories.md:169-184`.
2. **There is no elevation token anywhere.** `grep -iE 'shadow|elevation'` on `cunningham.ts` and the global tokens finds none. Shadows exist only as per-component literals: Modal `box-shadow: 0 6px 20px 0 rgba(0, 0, 18, 0.10)` (`modal/tokens.ts:9`, the one component *token* for a shadow), Tooltip `0 1px 5.4px 0 rgba(0,0,0,0.15)` (`tooltip/_base.scss:8`), Calendar `0 2px 4px rgba(0,0,0,0.05)` (`calendar/_index.scss:20,157`), the SCSS placeholder `%shadow` `0 1px 4px rgba(0,0,0,0.3)` (`utils/_index.scss:20`, extended by select and popover). AC3 "elevation from tokens" therefore needs a **component token** `--c--components--card--box-shadow` holding a literal: a design-system gap (see design).
3. **Radius is not global either** (`docs/design-system.md`, "Radius is a component token"). Modal and Calendar use 8px (`modal/tokens.ts:7`). Spacing is global: `--c--globals--spacings--{xs 0.5rem, sm 0.75rem, base 1rem, md 1.5rem}` (`cunningham-tokens.css:379-382`). So only elevation and radius are literals in a `tokens.ts`; padding can reference a global.
4. **The focus ring pattern is two-sided and the cards would clash with it.** `button/_base.scss:12-16` (s01, `b89668b2`) draws the ring as `box-shadow: 0 0 0 1px var(--c--contextuals--background--surface--primary), 0 0 0 4px var(--c--contextuals--border--semantic--<ctx>--primary)` on `:focus-visible` (CSS pseudo-class, no `useFocusRing`; `grep useFocusRing` finds none). A card already uses `box-shadow` for elevation, and `box-shadow` is dropped in forced-colors mode. The other pattern in the repo is `outline` + `outline-offset` (`tabs/index.scss:71-75`, `data-focus-visible`; file-uploader `form/file-uploader/index.scss:52-56`; Tabs adds `Highlight` for forced colors, `:122-127`). Ring colour `--c--contextuals--border--semantic--brand--primary` is `brand-550` (light, `cunningham-tokens.css:531`) and `brand-450` (dark, `:1323`).
5. **A clickable card with arbitrary header/body/footer cannot be a `<button>`.** `react-aria-components` 1.16.0 offers `Link` (`dist/types.d.ts:859`, renders `<a>`; without `href` it renders a `role="link"` span) and `Button` (`<button>`, phrasing content only). `react-aria` 3.47.0 is a direct dependency (`package.json:83`) and exposes `useButton({ elementType: "div" })` (role=button, tabIndex, Enter/Space via usePress). Interactive content nested in an interactive card breaks the `nested-interactive` axe rule that the Storybook a11y addon runs (`.storybook/main.ts` lists `@storybook/addon-a11y`). So: the whole card is **one** control, its content must not contain another focusable control.

## Target story
**As a** developer **I want** a card container **so that** I group related content consistently. Complexity 1 in stories.md. Acceptance criteria (docs/stories.md:176-178):
- AC1 `Card` renders an optional header, a body and an optional footer slot.
- AC2 A card that is interactive is operable by keyboard and has a visible focus ring.
- AC3 Padding, radius and elevation come from tokens.
Agentic notes: no equivalent in ui-kit, design to be reviewed; keep it presentational, no data logic. Dependencies: none. PRD: "Card, 1, Container with header and footer" (`docs/prd.md:38`).

## Current state of the code
- No `components/card/`. Comparable small components, all verified:
  - `badge/` (the closest): `badge.tsx` (`clsx`, BEM `c__badge--<type>`, `HTMLAttributes` spread), `types.ts`, `index.scss`, `badge.stories.tsx` (`title: "Components/Badge"`, `tags: ["autodocs"]`), `index.tsx` (`export * from`...). **No spec, no tokens.ts, no mdx**; its tokens live inline in `cunningham.ts:90-117` (`suiteComponentTokenOverrides`), which is the less-preferred way.
  - `modal/` (tokens.ts model): `tokens.ts` exports `tokens = (defaults: DefaultTokens) => ({...})`, imported in `cunningham.ts:14` and registered in `componentTokenDefaults` (`cunningham.ts:22-38`, key = folder name; forms use `forms-<name>`).
  - `tabs/` (react-aria model): `Tabs.tsx` on `react-aria-components`, `Tabs.mdx`, `tabs.stories.tsx`, `index.scss` with `data-focus-visible`, Playwright CT `e2e/tabs/` + `e2e/helpers/mount-tabs.tsx`.
  - `button/focus-ring.spec.tsx` (s01): reads `_base.scss` and `src/cunningham-tokens.css` from disk (Vitest stubs stylesheets), resolves `var()` chains per theme and checks WCAG contrast over the 6 themes. A reusable *technique*, but the helpers are local to that file.
- Registration: `src/library.scss` is a flat list of `@use "./components/<name>";` (e.g. `badge` at line 43, `storage-gauge` at 49); `src/index.ts` exports values and types per component (Badge block at ~line 318). For a new component both are manual edits.
- Tokens: `yarn build-theme` (= `cunningham -g css,scss,ts -o src --utility-classes && shx cp ...scss ...-sass.scss`, `package.json:43`) rewrites the tracked `src/cunningham-tokens.{css,scss,ts,...}`; the previous tickets note that `cunningham-tokens-sass.scss` must be restored after `yarn build`. Each token appears once per theme (`:root` + 5 theme blocks).
- Themes: `:root` (default light) + `.cunningham-theme--{dark,dsfr-light,dsfr-dark,anct-light,anct-dark}` (`cunningham-tokens.css:1, 793, 1585, 2352, 3119, 3889`).
- Contextual values useful for a card (light / dark): `surface.secondary` gray-000 / gray-850 (`:407,1199`); `border.surface.primary` gray-100 / gray-750 (`:528,1320`); `background.semantic.neutral.tertiary` gray-050 / gray-750 (`:425,1217`); `content.semantic.neutral.primary` gray-850 (`:495`).
- i18n: `src/locales/*.json` untouched; a card renders only consumer content. The accessible name of an interactive card comes from its content or from `aria-label`/`aria-labelledby` supplied by the consumer. **No i18n key needed.**
- Tests: Vitest specs sit beside components (`*.spec.tsx`/`index.spec.tsx`; `vitest run`); Playwright CT in `e2e/<name>/*.spec.tsx` with a `mount-<name>.tsx` helper in `e2e/helpers/` (config `playwright.config.ts`, projects chromium/webkit/firefox; previous stories report only chromium has an installed browser).
- Changesets on `next`: `calm-buttons-focus.md`, `checked-menus-speak.md`, `quiet-menus-leave.md`, `tree-rows-hear-clicks.md`; format `"@gouvfr-lasuite/ui-components": minor` + gitmoji line.

## Anchor points
- New folder `packages/ui-components/src/components/card/` (`index.tsx`, `Card.tsx`, `types.ts`, `tokens.ts`, `index.scss`, `card.stories.tsx`, `Card.mdx`, `Card.spec.tsx`).
- `packages/ui-components/cunningham.ts`: import (near line 14) and key `card` in `componentTokenDefaults` (line 22).
- `src/library.scss`, `src/index.ts`: one `@use`, one export block.
- `e2e/card/card.spec.tsx` + `e2e/helpers/mount-card.tsx` for the keyboard and focus-ring checks in a real browser.

## Verified APIs / functions
- `useButton(props, ref)` from `react-aria` 3.47.0: `elementType`, `onPress`, returns `buttonProps` (role, tabIndex, keyboard). `Link` from `react-aria-components` 1.16.0: `href`, `className`, `onPress`, data attributes `data-focus-visible`, `data-hovered`.
- `DefaultTokens` from `@gouvfr-lasuite/ui-tokens` for `tokens.ts` (`defaults.contextuals.*`, `defaults.globals.spacings.*`).
- `clsx` is the class helper used by Badge and Tabs.

## Traps & constraints
- `form/` vs `forms/` split does not apply (Card is not a form component).
- Editing `cunningham-tokens.*` by hand is forbidden; regenerate with `yarn build-theme` and restore `cunningham-tokens-sass.scss` if the build rewrites it.
- The existing literal in `modal/tokens.ts` (`"0 6px 20px 0 rgba(0,0,18,0.10)"`, `"8px"`) is the only precedent for literals in a component token; AGENTS.md says "never a literal colour, spacing or radius" in *stylesheets*, which `tokens.ts` is not.
- `box-shadow` as a ring is dropped in forced-colors mode; elevation and the ring cannot share one `box-shadow` without composition.
- Axe `nested-interactive`: a `role="button"` card containing a link or button fails. A footer with actions belongs in a **static** card.
- A translucent hover token (e.g. `contextual.primary`, black-050) would replace the opaque card background with a see-through one; use an opaque token (`neutral.tertiary`).
- The `%shadow` placeholder only works inside SCSS with `@extend`; it is not a CSS variable and cannot feed a token.
- Vitest does not load SCSS: AC3 and the focus rule are checked textually on the stylesheet and numerically on the generated tokens, as `focus-ring.spec.tsx` does.

## Open questions
1. **Elevation value (design-system gap).** Which literal for `--c--components--card--box-shadow`? Proposed: reuse the existing Calendar resting shadow `0 2px 4px rgba(0, 0, 0, 0.05)` (no new value invented); a global elevation scale is out of this story. Owner to confirm, or to ask for a scale (own story).
2. **Focus ring shape.** Proposed `outline` with offset (not the s01 `box-shadow` pair), because the shadow is taken by elevation and `outline` survives forced colors. Owner to confirm this deviation from button's recipe.
3. **Interactive API.** Proposed: `href` renders `<a>` (RAC `Link`), `onPress` renders `<div role="button">` (`useButton`); the two are mutually exclusive in the type; no `isDisabled` in v1; no stretched-link/nested-interactive support. Does the owner want `isDisabled`, or a polymorphic `as`?
4. **Header/footer content.** Slots as props (`header`, `footer`, `children` for the body) or compound subcomponents (`Card.Header`)? Proposed: props (no compound pattern in the repo; Tabs, Alert use props).
5. **Real browser coverage.** Only chromium is installed locally in previous stories; webkit/firefox focus-ring behaviour not verified here.

## Real complexity
Scored 1, re-scored **2**. The component itself is trivial, but the story brings three non-trivial things the score did not see: the missing elevation token (a design-system decision), a three-way render path (static / link / button) with an axe constraint, and a keyboard/focus-ring verification that needs a real browser. Still small: no dependency, no data, no i18n. Two tickets, about 3 person-days.
