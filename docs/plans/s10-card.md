---
validated: yes
---
# Plan — Story s10-card

Branch: `feature/s10-card` (framing) · tickets: `feature/s10-card/<ticket-id>`
Research: `docs/research/s10-card.md` — read it first; this plan does not repeat it. Design: `docs/designs/s10-card.md` (anatomy, states, token table, gaps).

## Target story
**As a** developer **I want** a card container **so that** I group related content consistently. Complexity 1 in stories.md, 2 after research (missing elevation token, three render paths, real-browser keyboard check).
The premise "no equivalent in ui-kit" holds. This is a new component, so each ticket is **test-first inside the ticket**: the specs are written and seen failing before the code, and the ticket is committed only when everything is green (no `it.fails` ships, since no behaviour pre-exists).
Acceptance criteria (docs/stories.md):
- AC1 `Card` renders an optional header, a body and an optional footer slot.
- AC2 A card that is interactive is operable by keyboard and has a visible focus ring.
- AC3 Padding, radius and elevation come from tokens.

## Tickets (ordered)
### t01-card-static
- **size:** M
- **estimate:** 1.5d
- **depends on:** none
- **scope:** the static `Card` (header / body / footer), its tokens, styles, registration, stories and changeset. Covers AC1 and AC3. One execute / review / ship slice.

Tasks:
1. [ ] Write `packages/ui-components/src/components/card/Card.spec.tsx` first (import `it` from `vitest`) and see it fail: (a) header, body and footer render in DOM order, with classes `c__card__header|body|footer` [fails today: no `Card`]; (b) omitting `header`/`footer` renders no `.c__card__header` / `.c__card__footer` node and no empty wrapper; (c) the root is a `div` without `role`, `className` and extra props (`id`, `data-*`, `aria-label`) are forwarded; (d) AC3 tokens: every key of `tokens.ts` has a `--c--components--card--<key>` declaration in `:root` of `src/cunningham-tokens.css` (read from disk, `focus-ring.spec.tsx` technique) [fails until `yarn build-theme`]; (e) AC3 stylesheet: `index.scss` reads `padding`, `border-radius` and `box-shadow` from `var(--c--components--card--…)` and contains no hex colour, `rgb(`, nor `px`/`rem` literal outside comments [fails until the SCSS exists].
2. [ ] Create `components/card/tokens.ts` with the token table of the design (`background-color`, `background-color--hover`, `color`, `border-color`, `border-width`, `border-radius`, `box-shadow`, `padding`, `header-font-weight`, `focus-ring-color|width|offset`), contextual/global refs from `DefaultTokens`, literals only for the gap values (`1px`, `8px`, Calendar's `0 2px 4px rgba(0, 0, 0, 0.05)`, `2px`, `2px`); import and register as `card` in `packages/ui-components/cunningham.ts` (`componentTokenDefaults`).
3. [ ] Run `yarn build-theme`; check the 12 `--c--components--card--*` variables appear in the six theme blocks; restore `src/cunningham-tokens-sass.scss` if it changed unexpectedly. Never hand-edit `cunningham-tokens.*`. Test (d) turns green.
4. [ ] Create `Card.tsx`, `types.ts` (`CardProps`: `header?`, `footer?`, `children`, `className?`, `HTMLAttributes<HTMLDivElement>`), `index.tsx` (`export *`). Sections only when their prop is non-null; classes through `clsx`; BEM `c__card`. Tests (a)-(c) turn green.
5. [ ] Create `index.scss` (BEM, tokens only, dividers with `border-color`, `overflow-wrap: anywhere`, `min-width: 0`); add `@use "./components/card";` to `src/library.scss`; add `Card` and `export type { CardProps }` to `src/index.ts`. Test (e) turns green.
6. [ ] Create `card.stories.tsx` (`title: "Components/Card"`, `tags: ["autodocs"]`): `Default` (body only), `HeaderBodyFooter`, `LongContent` (wrapping). Open the stories in Storybook on the port from `bash .dm/lib/dm-port.sh`, run the a11y addon on each story and in the `default`, `dark` and `dsfr-light` themes; stop the server.
7. [ ] Add `.changeset/<name>.md` for `@gouvfr-lasuite/ui-components`: **minor** (new component), gitmoji line `✨(card) add Card container`.
8. [ ] Run `yarn lint`, `yarn check-locales`, `yarn test`, `yarn build`; restore `cunningham-tokens-sass.scss` if the build rewrote it. The PR description carries `Artifact: updated (version <id>)` (page for Card with props and tokens read from the code, entry in the `Composants` catalogue, `project/canvas.json`): done by the main agent after the implementer, reading the published index again before merging.

### t02-card-interactive
- **size:** M
- **estimate:** 1.5d
- **depends on:** t01-card-static
- **scope:** the interactive behaviour (`href` / `onPress`), hover and focus-visible styles, keyboard and focus-ring verification in jsdom and a real browser, docs page. Covers AC2.

Tasks:
1. [ ] Extend `Card.spec.tsx` first and see it fail: (a) `href` renders `<a href>` (role `link`) whose accessible name is its content, and Enter activates it; (b) `onPress` renders `role="button"` with `tabindex="0"`, and click, Enter and Space each call `onPress` exactly once (`userEvent`); (c) a static card is not reached by `Tab`; (d) AC2 ring contrast: in the six themes, `focus-ring-color` against `contextuals.background.surface.primary` is >= 3:1 (resolve `var()` chains from `cunningham-tokens.css`, technique of `button/focus-ring.spec.tsx`); (e) AC2 stylesheet: `.c__card--interactive:focus-visible` sets `outline` from `focus-ring-width|color` and `outline-offset` from `focus-ring-offset`, a `forced-colors` rule sets `Highlight`, hover reads `background-color--hover`, and the transition is removed under `prefers-reduced-motion` [fail until the SCSS exists].
2. [ ] Write the Playwright CT test first, `e2e/card/card.spec.tsx` + `e2e/helpers/mount-card.tsx` (`CunninghamProvider`, chromium only; run with a throwaway config on the port from `dm-port.sh`, not committed, per the s03 harness): `Tab` focuses the interactive card (`toBeFocused`) and its computed `outline-style` is `solid` and `outline-width` `2px`; after a mouse click it is not `solid` (no ring on pointer focus); Enter and Space call the handler once for `onPress`; Enter on the `href` card changes `location.hash`; a static card never receives focus. See it fail.
3. [ ] Implement in `Card.tsx`: `href` -> RAC `Link` (`<a>`); `onPress` -> `useButton({ elementType: "div" })` on a `div`; both add `c__card--interactive`; the prop type is a union that forbids `href` and `onPress` together (checked by `// @ts-expect-error` lines in the spec, compiled by `yarn build`'s `tsc`). Static path unchanged. Tests 1(a)-(c) and 2 turn green.
4. [ ] Add to `index.scss`: `.c__card--interactive` (cursor pointer, transition on `background-color` with `globals.transitions.duration`), `:hover` and `:focus-visible` (outline from tokens), `@media (forced-colors: active)` (`Highlight`), `@media (prefers-reduced-motion: reduce)`. Tests 1(d)-(e) turn green.
5. [ ] Add stories `InteractiveLink` and `InteractiveButton` (text-only content), and a `Card.mdx` page: slots, the exclusive `href` / `onPress` rule, the "no interactive content inside an interactive card" constraint (axe `nested-interactive`), the tokens table, how to give a name (`aria-label` / `aria-labelledby`). Run the a11y addon on every story in `default`, `dark`, `dsfr-light`; drive the stories with the keyboard once (Tab, Enter, Space); stop the server.
6. [ ] Run `yarn lint`, `yarn check-locales`, `yarn test`, `yarn build`, and `yarn test:ct` on the chromium project for `e2e/card/`; restore `cunningham-tokens-sass.scss` if rewritten. No second changeset (t01's minor covers the component); amend its text only if the API changed. The PR description carries `Artifact: updated (version <id>)` (page props and interaction notes, catalogue entry, `project/canvas.json`), done by the main agent.

## US totals
- **Person-days:** 3.0 (1.5 + 1.5)
- **Size mix:** 2×M

## Run interdicts
- No new dependency (`react-aria` 3.47.0 and `react-aria-components` 1.16.0 are already installed); no ADR needed (ADR 002 conventions are followed; no structural choice), so ADR 005 stays free.
- Do not edit generated `src/cunningham-tokens.*`; regenerate with `yarn build-theme`.
- No literal colour, spacing or radius in `index.scss`; literals only in `tokens.ts`, limited to the five gap values listed in t01 task 2.
- No change to any existing component, token or story (Modal, Calendar, Tabs keep their shadow/ring); no global elevation token is introduced (design-system gap 1 stays a gap).
- No `isDisabled`, no variants, no compound subcomponents, no data logic, no i18n key (the owner can ask for them in a later story). `Card` holds no state, effect or fetch.
- A ticket never merges with a red test; no `it.fails` is expected (new component).

## The point everything turns on
The elevation token: AC3 says "elevation from tokens" but the system has none. The plan answers with a **component** token holding the existing Calendar shadow, and with an `outline` focus ring (not Button's `box-shadow` pair) so ring and elevation do not collide. If the owner wants a global elevation scale or Button's exact recipe, t01 task 2 and t02 task 4 change; nothing else.

## Files touched
- t01: `components/card/{index.tsx,Card.tsx,types.ts,tokens.ts,index.scss,card.stories.tsx,Card.spec.tsx}` (new); `packages/ui-components/cunningham.ts`; `src/library.scss`; `src/index.ts`; regenerated `src/cunningham-tokens.{css,scss,ts}` (and any other tracked file the generator rewrites); `.changeset/<name>.md` (new); the design-system artifact (outside the repo).
- t02: `components/card/Card.tsx`, `index.scss`, `types.ts`, `Card.spec.tsx`, `card.stories.tsx`, `Card.mdx` (new); `e2e/card/card.spec.tsx` and `e2e/helpers/mount-card.tsx` (new); the artifact.

## Test strategy
- Unit (Vitest + Testing Library, jsdom): slots and omission (AC1), element and role per mode, keyboard activation, token existence and textual stylesheet checks (AC3), ring contrast over six themes (AC2). SCSS is not rendered in jsdom, so stylesheet checks are textual by design.
- Component (Playwright, chromium): real `Tab` focus, computed outline on keyboard vs pointer focus, Enter/Space (AC2). Webkit/firefox are not installed locally: not verified.
- Manual: Storybook a11y addon on every story in `default`, `dark`, `dsfr-light`; one keyboard pass.
- Type level: `// @ts-expect-error` lines proving `href` + `onPress` is rejected, compiled by `tsc` in `yarn build`.
- Prerequisite: dependencies installed (they are); a chromium for Playwright CT.

## Definition of Done
Single PR into `next` per ticket, structured description with `Artifact: updated (version <id>)` (the design-system artifact page for Card, its catalogue entry in `Composants` and `project/canvas.json` are updated by the main agent after the implementer; `/dm-review` refuses the ticket without the line), readable diff, `yarn lint`, `yarn check-locales`, `yarn test`, `yarn build` pass (t02 also `yarn test:ct` on chromium for `e2e/card/`), one changeset (minor) shipped with t01, review passed (no open critical or major), merged to `next`.
