# Research — Story s11-accordion

Worktree `.worktrees/s11-accordion`, branch `feature/s11-accordion` (from `next` at `07073fb9`). Nothing was run or built: every claim comes from reading the source (`packages/ui-components`) and the installed `react-aria-components` 1.16.0 sources under the main checkout's `node_modules` (`react-aria-components/src/Disclosure.tsx`, `@react-aria/disclosure/src/useDisclosure.ts`, `@react-stately/disclosure/src/useDisclosureGroupState.ts`, `useDisclosureState.ts`), read-only.

## The five structuring facts
1. **The premise "no equivalent in ui-kit" is true.** `grep -riE 'accordion|disclosure'` over `src/`, `e2e/`, `.storybook/` and `cunningham.ts` finds nothing. The only collapsible pattern is the Alert's expandable mode (`alert/AlertAdditionalExpandable.tsx`): a `Button` toggling between two renders, with `useControllableState`, no `aria-expanded`, no `aria-controls`, no panel. It is not reusable here and must not be touched. The PRD lists "Accordion, 2, Collapsible panels, keyboard accessibility" (`docs/prd.md:34`).
2. **`react-aria-components` 1.16.0 (direct dependency, `package.json:84`) exports `Disclosure`, `DisclosureGroup` and `DisclosurePanel`** (`dist/types.d.ts:2057-2143`), plus `DisclosureGroupStateContext` / `DisclosureStateContext`. No new dependency, no ADR.
   - `DisclosureGroup`: `allowsMultipleExpanded` (default `false` = single-open), `expandedKeys` (controlled), `defaultExpandedKeys` (uncontrolled), `onExpandedChange(keys: Set<Key>)`, `isDisabled`. In single mode, if `expandedKeys` holds more than one key, an effect collapses it to the first (`useDisclosureGroupState.ts`).
   - `Disclosure`: `id` (the key, auto-generated if absent), `isExpanded` / `defaultExpanded` / `onExpandedChange` (standalone use), `isDisabled`. Inside a group the group state wins. Render props / data attributes: `data-expanded`, `data-disabled`, `data-focus-visible-within`.
   - Trigger: a RAC `Button` with `slot="trigger"` inside the `Disclosure` receives `buttonProps` through `ButtonContext`: `id`, `aria-expanded`, `aria-controls`, and a `press` handler that toggles (pointer on `onPress`, keyboard on `onPressStart`, so Enter and Space both toggle: `useDisclosure.ts`). The button is a native `<button>`, so it is in the Tab order. **Wrap it in a RAC `Heading`** (exported; heading level chosen by the consumer) for the APG heading-around-button structure; RAC does not add it.
   - `DisclosurePanel`: `role="group"` by default (`'region'` optional), `aria-labelledby` = trigger id, `aria-hidden` = collapsed, `hidden="until-found"` when collapsed (so browser find-in-page can expand it through `beforematch`, which calls `toggle()`). A `hidden` element is not focusable and not reached by Tab, which gives "collapsed content is not focusable and hidden from AT" for free. Inside the panel the `ButtonContext` is cleared, so a Button in the content is not mistaken for the trigger.
   - Height animation: `useDisclosure` sets `--disclosure-panel-height` / `--disclosure-panel-width` (px while animating, then `auto`; `0px` collapsed) **only when `panel.getAnimations` exists**. jsdom has no `getAnimations`, so tests see the non-animated path (attributes set at once). The CSS must declare the `height` transition itself.
3. **Arrow keys between triggers do NOT come for free.** Verified: `Disclosure.tsx`, `useDisclosure.ts` and `useDisclosureGroupState.ts` contain no `ArrowUp/ArrowDown/Home/End` handling and no roving focus (`grep -i arrow` on the three files is empty). The WAI-ARIA accordion pattern makes arrow keys optional; **AC3 of the story requires them**, so they must be added: an `onKeyDown` on the group root that, for `ArrowDown` / `ArrowUp` (and `Home` / `End`, optional in APG), moves focus to the next / previous *enabled* trigger of **that** accordion, with `preventDefault`. Triggers are tagged with a class (`c__accordion__trigger`) and matched with `querySelectorAll`, filtered by `closest('.c__accordion') === root` so nested accordions are not crossed. The repo's `hooks/useArrowRoving.ts` is not reusable: it handles `ArrowLeft/Right` only, on `button` descendants of a container, with a capture listener and a space-to-click workaround. Writing ~15 lines inline in the component is the lazy and correct option; no hook extraction for one use. A disabled trigger is a `disabled` native button (RAC `isDisabled`), so it must be filtered out (`:not(:disabled)`).
4. **Controlled vs uncontrolled is done by RAC** (`useControlledState` from `@react-stately/utils`): `expandedKeys` present = controlled, otherwise `defaultExpandedKeys`. The repo's `hooks/useControllableState.ts` is **not needed** (its "controlled" test is `propsCallback` presence, not the value, which differs from RAC; do not mix them). Keys are `Set<Key>`; the Accordion API exposes them as `expandedKeys?: Iterable<Key>` / `onExpandedChange?: (keys: Set<Key>) => void`, i.e. RAC's own shape.
5. **Focus ring and tokens follow Card (s10), not Button.** The accordion trigger is a full-width row; the ring uses `outline` (`:focus-visible` / RAC `data-focus-visible`), with `outline-offset` negative or `0` so it is not clipped by the container's `overflow` (see Traps). Colours from contextual tokens only; literals confined to `tokens.ts` as in `card/tokens.ts`.

## Target story
**As a** user **I want** collapsible panels **so that** I read long content section by section. Complexity 2 in stories.md (docs/stories.md:186-202). Acceptance criteria:
- AC1 `Accordion` opens and closes a panel on click and on Enter or Space.
- AC2 A single-open mode and a multiple-open mode are available.
- AC3 Each trigger exposes the expanded state to assistive technology, and arrow keys move between triggers.
- AC4 The open state can be controlled or left uncontrolled.
Agentic notes: no equivalent in ui-kit, design to be reviewed; follow the WAI-ARIA accordion pattern. Dependencies: none. s37 `Collapsible` (stories.md:~650-668) is to "share the disclosure logic" with this story: it will reuse RAC `Disclosure` directly; nothing from s11 needs to be factored for it now.

## Complexity re-score
Story says 2; **stays 2**. RAC gives state, ARIA, Enter/Space and the hidden panel; what is left is the styled wrapper, the chevron, tokens, ~15 lines of arrow-key code and tests. The real-browser check (focus ring not clipped, collapsed content unreachable by Tab, height transition) justifies a Playwright CT file.

## Current state of the code
- No `components/accordion/`. Models, all read: `card/` (s10, the closest: `Card.tsx`, `types.ts`, `tokens.ts`, `index.scss`, `card.stories.tsx`, `Card.mdx`, `Card.spec.tsx`, `index.tsx`; `e2e/card/` + `e2e/helpers/mount-card.tsx`), `tabs/` (RAC wrapper with `data-focus-visible`, `Tabs.mdx`).
- Registration: `src/library.scss` (`@use "./components/card";` at line 44), `src/index.ts` (Card block ~line 327), `cunningham.ts` (import line 8, key `card` line 27 in `componentTokenDefaults`; key = folder name).
- Icon: `components/icon/Icon.tsx` (`<Icon name="expand_more" />` renders `<span class="material-icons">`, text content = glyph name, filled by default). Alert and Tabs use `<span className="material-icons">` directly. Material Icons font is already the repo's icon source (no new asset). The glyph text is not an accessible name: mark it `aria-hidden`.
- Tokens available (values read in `src/cunningham-tokens.css`): spacings `--c--globals--spacings--{xs .5rem, sm .75rem, base 1rem}`, `--c--globals--transitions--duration` 250ms (`:338`) and `--ease-out` (`:336`), contextual `border.surface.primary`, `background.semantic.neutral.tertiary`, `content.semantic.neutral.primary`, `content.semantic.disabled.primary` (`:515`), `border.semantic.brand.primary` (ring). Radius, border width and ring width/offset are component-level literals by convention (`docs/design-system.md`).
- i18n: nothing. The trigger label is consumer content; the chevron is decorative. **No locale key** (`yarn check-locales` unchanged).
- Tests: Vitest in jsdom with Testing Library + `userEvent` (`vitest run`); SCSS is not rendered in jsdom, so style checks are textual (s10 technique); Playwright CT in `e2e/<name>/` with `e2e/helpers/mount-<name>.tsx`, chromium only installed locally.
- Changesets on `next`: format `"@gouvfr-lasuite/ui-components": minor` + gitmoji line (`cards-group-content.md` as model).

## Anchor points
- New `packages/ui-components/src/components/accordion/` (`index.tsx`, `Accordion.tsx`, `types.ts`, `tokens.ts`, `index.scss`, `accordion.stories.tsx`, `Accordion.mdx`, `Accordion.spec.tsx`).
- `cunningham.ts`: import + key `accordion`; `src/library.scss`: one `@use`; `src/index.ts`: values and `export type`.
- `e2e/accordion/accordion.spec.tsx` + `e2e/helpers/mount-accordion.tsx`.
- Then `yarn build-theme` (rewrites tracked `src/cunningham-tokens.*`; restore `cunningham-tokens-sass.scss` if it drifts, as in s10).

## Verified APIs / functions
- `react-aria-components` 1.16.0: `DisclosureGroup`, `Disclosure`, `DisclosurePanel`, `Button` (`slot="trigger"`), `Heading`; types `DisclosureGroupProps`, `DisclosureProps`, `Key`.
- `Disclosure`/`DisclosureGroup` default class names `react-aria-Disclosure*` are overridden through `className`.
- `clsx` for BEM classes; `DefaultTokens` from `@gouvfr-lasuite/ui-tokens` for `tokens.ts`.

## Traps & constraints
- **`Disclosure` inside a `DisclosureGroup` needs an `id`** matching `expandedKeys`; without it a generated id is used and a consumer cannot control it. `AccordionItem` should require `id`.
- **Collapsed panel uses `hidden="until-found"`**: it is `content-visibility: hidden`, so a `display` or `overflow` rule on the panel can fight it. Do not set `display` on the panel; style an inner wrapper for padding. Height animation: the panel needs `overflow: clip` plus `height: var(--disclosure-panel-height)` and a transition, otherwise the open/close is instant (acceptable fallback, and the only behaviour in jsdom).
- **Panel padding inside the animated element** would be cut off during animation; keep the padding on an inner `div`, not on the element carrying the height.
- **Single-open + controlled with several keys**: RAC collapses to the first key through `setExpandedKeys`; in controlled mode this calls `onExpandedChange` on every render until the consumer fixes its state. Document it; do not work around it.
- **Enter/Space toggle comes from `onPressStart` for keyboard** (not `onPress`): a test that fires `keydown` only is enough; `userEvent.keyboard('{Enter}')` works. A naive `fireEvent.click` also works (pointer path).
- **Arrow handler and typed content**: the keydown listener on the root must act only when the event target is a trigger button (`target.closest('.c__accordion__trigger')`), otherwise arrows inside an input or a textarea in a panel would be hijacked.
- **Nested accordions** (an accordion inside a panel): only triggers owned by the same root are visited; test it.
- `box-shadow` is dropped in forced-colors, so the ring is an `outline` (as Card/Tabs).
- Editing `cunningham-tokens.*` by hand is forbidden; regenerate with `yarn build-theme`.
- Axe `nested-interactive` is not a concern (trigger is a button, content is a sibling region), but `aria-allowed-attr` / heading order checks apply: the consumer picks the heading `level`.

## Open questions
1. **API shape**: compound `<Accordion><AccordionItem id title>…</AccordionItem></Accordion>` (proposed, closest to RAC and shadcn) versus an `items` array prop. Plan assumes compound; the owner can ask for the data-driven form in a later story.
2. **Arrow wrap-around**: APG allows wrapping (Down on the last trigger goes to the first). Proposed: wrap, as `useArrowRoving` does. Home/End included (cheap, APG-recommended). Confirm.
3. **Heading level default**: proposed `3` as a default `headingLevel` prop on `AccordionItem`. A page-level default is an arbitrary choice; consumers can override per item.
4. **Panel role**: RAC default `group`; APG recommends `region` only for fewer than ~6 panels. Proposed: keep `group` (avoids a landmark flood).
5. **Height animation without JS measurement** relies on RAC's CSS variables; verified only by reading source. The Playwright CT must confirm it in chromium (falls back to instant, acceptable).
6. **Disabled**: per-item `isDisabled` and group `isDisabled` are RAC-native; proposed to expose both (zero extra code).
